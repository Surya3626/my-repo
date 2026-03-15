package com.devtrack.api.controller;

import com.devtrack.api.model.*;
import com.devtrack.api.repository.AuditLogRepository;
import com.devtrack.api.repository.ConfigRepository;
import com.devtrack.api.repository.TaskRepository;
import com.devtrack.api.repository.TaskWorkflowMapRepository;
import com.devtrack.api.repository.UserRepository;
import com.devtrack.api.repository.CommentRepository;
import com.devtrack.api.repository.AttachmentRepository;
import com.devtrack.api.services.WorkflowExecutionService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Comparator;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ConfigRepository configRepository;

    @Autowired
    private WorkflowExecutionService workflowExecutionService;

    @Autowired
    private TaskWorkflowMapRepository taskWorkflowMapRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAllOptimized();
    }

    @GetMapping("/my")
    public List<Task> getMyTasks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        return taskRepository.findAllOptimized().stream()
                .filter(t -> t.getAssignedDeveloper() != null && t.getAssignedDeveloper().getId().equals(user.getId()))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Title is mandatory.");
        }
        if (task.getDescription() == null || task.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is mandatory.");
        }

        if (task.getCreatedBy() == null) {
            task.setCreatedBy(currentUser);
        }
        
        // Refined Assignment Logic:
        // 1. If a DEVELOPER creates a task and it's unassigned, auto-assign to them.
        // 2. If an ADMIN creates a task, keep it as they provided (unassigned or specific dev).
        if (task.getAssignedDeveloper() == null) {
            boolean isDeveloper = currentUser.getRoles().contains(Role.DEVELOPER);
            boolean isAdmin = currentUser.getRoles().contains(Role.DEVADMIN) || currentUser.getRoles().contains(Role.TESTADMIN);
            
            if (isDeveloper && !isAdmin) {
                task.setAssignedDeveloper(currentUser);
            }
        }
        
        if (task.getWorkflow() != null) {
            Task savedTask = taskRepository.save(task);
            workflowExecutionService.initializeWorkflow(savedTask.getId(), task.getWorkflow().getId());
            return savedTask;
        } else if (task.getStatus() == null) {
            task.setStatus("OPEN");
        }
        
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id)
                .map(task -> {
                    String oldStatus = task.getStatus();
                    
                    if ("CLOSED".equals(oldStatus)) {
                        return ResponseEntity.status(403).body("This task is in a terminal state (CLOSED) and cannot be updated.");
                    }
                    
                    // Restriction: Only assigned developer can update, UNLESS it's a Code Review or Admin override
                    if (task.getAssignedDeveloper() != null) {
                        String username = SecurityContextHolder.getContext().getAuthentication().getName();
                        String roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities().toString();
                        boolean isReviewer = roles.contains("ROLE_CODEREVIEWER");
                        boolean isAdmin = roles.contains("ROLE_DEVADMIN");
                        
                        if (!task.getAssignedDeveloper().getUsername().equals(username) && !isReviewer && !isAdmin) {
                            return ResponseEntity.status(403).body("Only the assigned developer (" + task.getAssignedDeveloper().getFullName() + ") can update this task.");
                        }

                        // NEW: Prevent developer updates if task is in active testing phase or has a tester assigned
                        boolean isActiveTesting = task.getStatus().contains("TESTING") || 
                                               (task.getStatus().contains("UAT") && !task.getStatus().contains("COMPLETED")) ||
                                               (task.getStatus().contains("SIT") && !task.getStatus().contains("COMPLETED"));

                        if ((task.getTester() != null || isActiveTesting) && 
                            !isAdmin && !roles.contains("ROLE_TESTER")) {
                            return ResponseEntity.status(403).body("This task is currently in testing/review phase and cannot be updated by developers.");
                        }
                    }

                    // Mandatory Date Validations based on selected status (Only for DEPLOYED/MOVE_TO_UAT)
                    String currentTargetStatus = taskDetails.getStatus() != null ? taskDetails.getStatus() : task.getStatus();
                    if (currentTargetStatus.equals("IN_PROGRESS") && taskDetails.getDevStartDate() == null && task.getDevStartDate() == null) {
                        return ResponseEntity.badRequest().body("Dev Start Date is mandatory for IN_PROGRESS status.");
                    }
                    if (currentTargetStatus.equals("SIT_DEPLOYED") && taskDetails.getSitDate() == null && task.getSitDate() == null) {
                        return ResponseEntity.badRequest().body("SIT Date is mandatory for SIT_DEPLOYED status.");
                    }
                    if (currentTargetStatus.equals("MOVE_TO_UAT") && taskDetails.getUatDate() == null && task.getUatDate() == null) {
                        return ResponseEntity.badRequest().body("UAT Date is mandatory for MOVE_TO_UAT status.");
                    }
                    if (currentTargetStatus.equals("PROD_DEPLOYED") && taskDetails.getProductionDate() == null && task.getProductionDate() == null) {
                        return ResponseEntity.badRequest().body("Production Date is mandatory for PROD_DEPLOYED status.");
                    }
                    
                    if (currentTargetStatus.equals("CODE_REVIEW")) {
                        String gitLinks = taskDetails.getGitLinks() != null ? taskDetails.getGitLinks() : task.getGitLinks();
                        if (gitLinks == null || gitLinks.trim().isEmpty()) {
                            return ResponseEntity.badRequest().body("Git Links are mandatory for CODE_REVIEW status.");
                        }
                    }

                    // Check transition logic if workflow is present
                    // Dynamic Workflow Transition (Removed hardcoded jumps)
                    if (taskDetails.getStatus() != null && !task.getStatus().equals(taskDetails.getStatus())) {
                        if (taskDetails.getRemarks() == null || taskDetails.getRemarks().trim().isEmpty()) {
                            return ResponseEntity.badRequest().body("Updating Remarks are mandatory for all status changes.");
                        }
                        task.setStatus(taskDetails.getStatus());
                    }

                    task.setTitle(taskDetails.getTitle());
                    task.setDescription(taskDetails.getDescription());
                    task.setPriority(taskDetails.getPriority());
                    task.setType(taskDetails.getType());
                    task.setBranchName(taskDetails.getBranchName());
                    // jtrackId is immutable once created
                    task.setPds(taskDetails.getPds());
                    task.setGitLinks(taskDetails.getGitLinks());
                    task.setCodeReviewComments(taskDetails.getCodeReviewComments());
                    task.setDevStartDate(taskDetails.getDevStartDate());
                    task.setSitDate(taskDetails.getSitDate());
                    task.setUatDate(taskDetails.getUatDate());
                    task.setPreprodDate(taskDetails.getPreprodDate());
                    task.setProductionDate(taskDetails.getProductionDate());
                    
                    if (taskDetails.getAssignedDeveloper() != null) {
                        task.setAssignedDeveloper(taskDetails.getAssignedDeveloper());
                        // If assigned manually, remove from pool
                        if (task.isInPool()) {
                            task.setInPool(false);
                            task.setInPoolDate(null);
                        }
                    }

                    if (taskDetails.getWorkflow() != null) {
                        task.setWorkflow(taskDetails.getWorkflow());
                    }
                    
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();
                    User currentUser = userRepository.findByUsername(username).orElseThrow();
                    
                    // Simple audit logging for status change
                    if (taskDetails.getStatus() != null && !taskDetails.getStatus().equals(oldStatus)) {
                        AuditLog log = new AuditLog();
                        log.setEntityType("TASK");
                        log.setEntityId(task.getId());
                        log.setFieldName("status");
                        log.setOldValue(oldStatus);
                        log.setNewValue(task.getStatus());
                        log.setRemarks(taskDetails.getRemarks());
                        log.setChangedBy(currentUser);
                        auditLogRepository.save(log);
                    }
                    
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportTasksToExcel() {
        List<Task> tasks = taskRepository.findAll();
        
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Tasks");
            
            // Create Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Jtrack ID", "Title", "Type", "Status", "Priority", "Assignee", "Branch", "PDs", "Created Date", "Dev Start", "SIT Date", "UAT Date", "Preprod", "Prod"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Fill Data
            int rowIdx = 1;
            for (Task task : tasks) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(task.getId());
                row.createCell(1).setCellValue(task.getJtrackId() != null ? task.getJtrackId() : "");
                row.createCell(2).setCellValue(task.getTitle() != null ? task.getTitle() : "");
                row.createCell(3).setCellValue(task.getType() != null ? task.getType().getName() : "");
                row.createCell(4).setCellValue(task.getStatus() != null ? task.getStatus() : "");
                row.createCell(5).setCellValue(task.getPriority() != null ? task.getPriority() : "");
                row.createCell(6).setCellValue(task.getAssignedDeveloper() != null ? task.getAssignedDeveloper().getFullName() : "Unassigned");
                row.createCell(7).setCellValue(task.getBranchName() != null ? task.getBranchName() : "");
                row.createCell(8).setCellValue(task.getPds() != null ? task.getPds() : "");
                row.createCell(9).setCellValue(task.getCreatedDate() != null ? task.getCreatedDate().toString() : "");
                row.createCell(10).setCellValue(task.getDevStartDate() != null ? task.getDevStartDate().toString() : "");
                row.createCell(11).setCellValue(task.getSitDate() != null ? task.getSitDate().toString() : "");
                row.createCell(12).setCellValue(task.getUatDate() != null ? task.getUatDate().toString() : "");
                row.createCell(13).setCellValue(task.getPreprodDate() != null ? task.getPreprodDate().toString() : "");
                row.createCell(14).setCellValue(task.getProductionDate() != null ? task.getProductionDate().toString() : "");
            }
            
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            byte[] bytes = out.toByteArray();
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tasks.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DEVADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    // 1. Delete associated TaskWorkflowMap records
                    List<TaskWorkflowMap> workflowMaps = taskWorkflowMapRepository.findByTaskId(id);
                    taskWorkflowMapRepository.deleteAll(workflowMaps);
                    
                    // 2. Delete associated AuditLog records (entityType = "TASK")
                    List<AuditLog> auditLogs = auditLogRepository.findAll().stream()
                            .filter(log -> log.getEntityId().equals(id) && "TASK".equals(log.getEntityType()))
                            .toList();
                    auditLogRepository.deleteAll(auditLogs);
                    
                    // 3. Delete associated Comment records
                    List<com.devtrack.api.model.Comment> comments = commentRepository.findAll().stream()
                            .filter(c -> c.getEntityId().equals(id) && "TASK".equals(c.getEntityType()))
                            .toList();
                    commentRepository.deleteAll(comments);
                    
                    // 4. Delete associated Attachment records
                    List<Attachment> attachments = attachmentRepository.findAll().stream()
                            .filter(a -> a.getEntityId().equals(id) && "TASK".equals(a.getEntityType()))
                            .toList();
                    attachmentRepository.deleteAll(attachments);

                    // Finally, delete the task itself
                    taskRepository.delete(task);
                    
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // UAT and Pool Endpoints
    @PostMapping("/{id}/push-to-pool")
    @PreAuthorize("hasRole('DEVADMIN')")
    public ResponseEntity<?> pushToPool(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    if (task.getAssignedDeveloper() != null) {
                        return ResponseEntity.badRequest().body("Assigned tasks cannot be pushed to pool.");
                    }
                    task.setInPool(true);
                    task.setInPoolDate(java.time.LocalDateTime.now());
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pick-from-pool")
    @PreAuthorize("hasAnyRole('DEVELOPER', 'DEVADMIN')")
    public ResponseEntity<?> pickFromPool(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return taskRepository.findById(id)
                .map(task -> {
                    if (!task.isInPool()) {
                        return ResponseEntity.badRequest().body("Task is not in the pool.");
                    }
                    task.setInPool(false);
                    task.setAssignedDeveloper(currentUser);
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pick-for-sit")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> pickForSit(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return taskRepository.findById(id)
                .map(task -> {
                    if (task.getTester() != null) {
                        return ResponseEntity.badRequest().body("Task is already being tested.");
                    }
                    task.setTester(currentUser);
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve-sit")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> approveSit(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            if (taskDetails.getRemarks() == null || taskDetails.getRemarks().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Remarks are mandatory for approval.");
            }
            // Update SIT Date if provided during approval (optional during testing phase)
            if (taskDetails.getSitDate() != null) {
                task.setSitDate(taskDetails.getSitDate());
            }
            String oldStatus = task.getStatus();
            if (task.getWorkflow() != null) {
                workflowExecutionService.approveStep(id);
            } else {
                String newStatus = configRepository.findByConfigKey("STATUS_SIT_COMPLETED")
                        .map(AppConfig::getConfigValue).orElse("SIT_COMPLETED");
                task.setStatus(newStatus);
            }
            task.setTester(null);
            task.setRemarks(taskDetails.getRemarks());
            
            AuditLog log = new AuditLog();
            log.setEntityType("TASK");
            log.setEntityId(task.getId());
            log.setFieldName("status");
            log.setOldValue(oldStatus);
            log.setNewValue(taskRepository.findById(id).get().getStatus());
            log.setRemarks(taskDetails.getRemarks());
            log.setChangedBy(userRepository.findByUsername(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow());
            auditLogRepository.save(log);
            
            return ResponseEntity.ok(taskRepository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject-sit")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> rejectSit(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            if (taskDetails.getRemarks() == null || taskDetails.getRemarks().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Remarks are mandatory for rejection.");
            }
            String oldStatus = task.getStatus();
            if (task.getWorkflow() != null) {
                workflowExecutionService.rejectStep(id);
            } else {
                task.setStatus("IN_PROGRESS");
            }
            task.setTester(null);
            task.setRemarks(taskDetails.getRemarks());
            
            AuditLog log = new AuditLog();
            log.setEntityType("TASK");
            log.setEntityId(task.getId());
            log.setFieldName("status");
            log.setOldValue(oldStatus);
            log.setNewValue(taskRepository.findById(id).get().getStatus());
            log.setRemarks(taskDetails.getRemarks());
            log.setChangedBy(userRepository.findByUsername(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow());
            auditLogRepository.save(log);
            
            return ResponseEntity.ok(taskRepository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pick-for-uat")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> pickForUat(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return taskRepository.findById(id)
                .map(task -> {
                    if (task.getTester() != null) {
                        return ResponseEntity.badRequest().body("Task is already being tested.");
                    }
                    task.setTester(currentUser);
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve-uat")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> approveUat(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            if (taskDetails.getRemarks() == null || taskDetails.getRemarks().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Remarks are mandatory for approval.");
            }
            // Update UAT Date if provided during approval (optional during testing phase)
            if (taskDetails.getUatDate() != null) {
                task.setUatDate(taskDetails.getUatDate());
            }
            String oldStatus = task.getStatus();
            if (task.getWorkflow() != null) {
                workflowExecutionService.approveStep(id);
            } else {
                String newStatus = configRepository.findByConfigKey("STATUS_UAT_COMPLETED")
                        .map(AppConfig::getConfigValue).orElse("UAT_COMPLETED");
                task.setStatus(newStatus);
            }
            task.setTester(null);
            task.setRemarks(taskDetails.getRemarks());
            
            AuditLog log = new AuditLog();
            log.setEntityType("TASK");
            log.setEntityId(task.getId());
            log.setFieldName("status");
            log.setOldValue(oldStatus);
            log.setNewValue(taskRepository.findById(id).get().getStatus());
            log.setRemarks(taskDetails.getRemarks());
            log.setChangedBy(userRepository.findByUsername(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow());
            auditLogRepository.save(log);
            
            return ResponseEntity.ok(taskRepository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject-uat")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> rejectUat(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            if (taskDetails.getRemarks() == null || taskDetails.getRemarks().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Remarks are mandatory for rejection.");
            }
            String oldStatus = task.getStatus();
            if (task.getWorkflow() != null) {
                workflowExecutionService.rejectStep(id);
            } else {
                String newStatus = configRepository.findByConfigKey("STATUS_REJECTED")
                        .map(AppConfig::getConfigValue).orElse("IN_PROGRESS");
                task.setStatus(newStatus);
            }
            task.setTester(null);
            task.setRemarks(taskDetails.getRemarks());
            
            AuditLog log = new AuditLog();
            log.setEntityType("TASK");
            log.setEntityId(task.getId());
            log.setFieldName("status");
            log.setOldValue(oldStatus);
            log.setNewValue(taskRepository.findById(id).get().getStatus());
            log.setRemarks(taskDetails.getRemarks());
            log.setChangedBy(userRepository.findByUsername(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow());
            auditLogRepository.save(log);
            
            return ResponseEntity.ok(taskRepository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/current-step")
    public ResponseEntity<TaskWorkflowMap> getCurrentStep(@PathVariable Long id) {
        TaskWorkflowMap step = workflowExecutionService.getCurrentStep(id);
        if (step != null) {
            return ResponseEntity.ok(step);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/steps")
    public ResponseEntity<List<WorkflowStep>> getTaskSteps(@PathVariable Long id) {
        List<TaskWorkflowMap> maps = taskWorkflowMapRepository.findByTaskId(id);
        List<WorkflowStep> steps = maps.stream()
                .sorted(java.util.Comparator.comparing(TaskWorkflowMap::getSequence))
                .map(TaskWorkflowMap::getStep)
                .toList();
        return ResponseEntity.ok(steps);
    }

    // Dynamic Workflow Endpoints
    @GetMapping("/current")
    public List<Task> getTasksByStepType(@RequestParam String type) {
        return taskWorkflowMapRepository.findTasksByStepType(type);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveWorkflowStep(@PathVariable Long id, @RequestBody(required = false) Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            TaskWorkflowMap currentStep = workflowExecutionService.getCurrentStep(id);
            if (currentStep == null) return ResponseEntity.badRequest().body("No active workflow step found.");

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            String roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities().toString();
            boolean isAdmin = roles.contains("ROLE_DEVADMIN") || roles.contains("ROLE_TESTADMIN");

            // RBAC Check
            if (!isAdmin) {
                if ("CODE_REVIEW".equals(currentStep.getStepType()) && !roles.contains("ROLE_CODEREVIEWER")) {
                    return ResponseEntity.status(403).body("Only Code Reviewers can approve this step.");
                }
                if ("TESTING".equals(currentStep.getStepType()) && !roles.contains("ROLE_TESTER")) {
                    return ResponseEntity.status(403).body("Only Testers can approve this step.");
                }
                if ("TASK".equals(currentStep.getStepType()) && task.getAssignedDeveloper() != null) {
                    if (!task.getAssignedDeveloper().getUsername().equals(username)) {
                        return ResponseEntity.status(403).body("Only the assigned developer can approve this task step.");
                    }
                }
            }

            // Date validation for the NEXT status
            // We need to peek at the next step to see what status we are moving into
            List<TaskWorkflowMap> maps = taskWorkflowMapRepository.findByTaskId(id);
            if (!maps.isEmpty()) {
                List<WorkflowStep> steps = maps.stream()
                        .sorted(java.util.Comparator.comparing(TaskWorkflowMap::getSequence))
                        .map(TaskWorkflowMap::getStep)
                        .toList();
                int currentIndex = -1;
                for (int i = 0; i < steps.size(); i++) {
                    if (steps.get(i).getStepName().equals(task.getStatus())) {
                        currentIndex = i;
                        break;
                    }
                }
                
                if (currentIndex != -1 && currentIndex + 1 < steps.size()) {
                    WorkflowStep nextStep = steps.get(currentIndex + 1);
                    String nextStatus = nextStep.getStepName();
                    
                    // Use dates from taskDetails if provided, otherwise from task
                    LocalDate devStartDate = (taskDetails != null && taskDetails.getDevStartDate() != null) ? taskDetails.getDevStartDate() : task.getDevStartDate();
                    LocalDate sitDate = (taskDetails != null && taskDetails.getSitDate() != null) ? taskDetails.getSitDate() : task.getSitDate();
                    LocalDate uatDate = (taskDetails != null && taskDetails.getUatDate() != null) ? taskDetails.getUatDate() : task.getUatDate();
                    LocalDate prodDate = (taskDetails != null && taskDetails.getProductionDate() != null) ? taskDetails.getProductionDate() : task.getProductionDate();

                    if (nextStatus.equals("IN_PROGRESS") && devStartDate == null) {
                        return ResponseEntity.badRequest().body("Dev Start Date is mandatory to move to " + nextStatus);
                    }
                    if (nextStatus.contains("SIT_DEPLOYED") && sitDate == null) {
                        return ResponseEntity.badRequest().body("SIT Date is mandatory to move to " + nextStatus);
                    }
                    if (nextStatus.contains("MOVE_TO_UAT") && uatDate == null) {
                        return ResponseEntity.badRequest().body("UAT Date is mandatory to move to " + nextStatus);
                    }
                    if (nextStatus.contains("PROD_DEPLOYED") && prodDate == null) {
                        return ResponseEntity.badRequest().body("Production Date is mandatory to move to " + nextStatus);
                    }
                    
                    if (nextStatus.equals("CODE_REVIEW")) {
                        String gitLinks = (taskDetails != null && taskDetails.getGitLinks() != null) ? taskDetails.getGitLinks() : task.getGitLinks();
                        if (gitLinks == null || gitLinks.trim().isEmpty()) {
                            return ResponseEntity.badRequest().body("Git Links are mandatory to move to Code Review");
                        }
                    }
                }
            }

            // Persist task details provided during approval
            if (taskDetails != null) {
                if (taskDetails.getDevStartDate() != null) task.setDevStartDate(taskDetails.getDevStartDate());
                if (taskDetails.getSitDate() != null) task.setSitDate(taskDetails.getSitDate());
                if (taskDetails.getUatDate() != null) task.setUatDate(taskDetails.getUatDate());
                if (taskDetails.getProductionDate() != null) task.setProductionDate(taskDetails.getProductionDate());
                if (taskDetails.getPreprodDate() != null) task.setPreprodDate(taskDetails.getPreprodDate());
                if (taskDetails.getGitLinks() != null) task.setGitLinks(taskDetails.getGitLinks());
                if (taskDetails.getAssignedDeveloper() != null) task.setAssignedDeveloper(taskDetails.getAssignedDeveloper());
                
                // Save the task fields before transitioning the workflow step
                taskRepository.save(task);
            }

            String oldStatus = task.getStatus();
            workflowExecutionService.approveStep(id);
            
            // Log Audit
            User currentUser = userRepository.findByUsername(username).orElseThrow();
            AuditLog log = new AuditLog();
            log.setEntityType("TASK");
            log.setEntityId(task.getId());
            log.setFieldName("workflow_approve");
            log.setOldValue(oldStatus);
            log.setNewValue(taskRepository.findById(id).get().getStatus());
            log.setRemarks(taskDetails != null ? taskDetails.getRemarks() : "Step Approved");
            log.setChangedBy(currentUser);
            auditLogRepository.save(log);
            
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectWorkflowStep(@PathVariable Long id, @RequestBody(required = false) Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            String oldStatus = task.getStatus();
            workflowExecutionService.rejectStep(id);
            
            // Log Audit
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsername(username).orElseThrow();
            AuditLog log = new AuditLog();
            log.setEntityType("TASK");
            log.setEntityId(task.getId());
            log.setFieldName("workflow_reject");
            log.setOldValue(oldStatus);
            log.setNewValue(taskRepository.findById(id).get().getStatus());
            log.setRemarks(taskDetails != null ? taskDetails.getRemarks() : "Step Rejected");
            log.setChangedBy(currentUser);
            auditLogRepository.save(log);
            
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
