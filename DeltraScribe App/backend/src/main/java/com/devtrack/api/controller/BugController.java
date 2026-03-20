package com.devtrack.api.controller;

import com.devtrack.api.model.*;
import com.devtrack.api.repository.AuditLogRepository;
import com.devtrack.api.repository.BugRepository;
import com.devtrack.api.repository.UserRepository;
import com.devtrack.api.repository.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bugs")
@CrossOrigin(origins = "*")
public class BugController {

    @Autowired
    private BugRepository bugRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private com.devtrack.api.repository.ConfigRepository configRepository;

    @Autowired
    private com.devtrack.api.repository.BugWorkflowMapRepository bugWorkflowMapRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @GetMapping
    public Page<Bug> getAllBugs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "true") boolean showClosed) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (showClosed) {
            return bugRepository.findAllOptimized(pageable);
        } else {
            return bugRepository.findAllOptimizedActive(pageable);
        }
    }

    @GetMapping("/my")
    public Page<Bug> getMyBugs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "true") boolean showClosed) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        
        if (showClosed) {
            return bugRepository.findAllOptimizedByAssignedDeveloperId(user.getId(), pageable);
        } else {
            return bugRepository.findAllOptimizedByAssignedDeveloperIdAndActive(user.getId(), pageable);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bug> getBugById(@PathVariable Long id) {
        return bugRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public Bug createBug(@RequestBody Bug bug) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        
        if (bug.getTitle() == null || bug.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Title is mandatory.");
        }
        if (bug.getDescription() == null || bug.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is mandatory.");
        }
        if (bug.getJtrackId() == null || bug.getJtrackId().trim().isEmpty()) {
            throw new RuntimeException("Jtrack ID is mandatory.");
        }
        if (bug.getAssignedDeveloper() == null) {
            throw new RuntimeException("Assignee is mandatory for Bugs.");
        }

        if (bug.getRaisedBy() == null) {
            bug.setRaisedBy(currentUser);
        }
        
        // Fetch full workflow to get steps if an ID was passed
        if (bug.getWorkflow() != null && bug.getWorkflow().getId() != null) {
            Workflow fullWorkflow = workflowRepository.findById(bug.getWorkflow().getId()).orElse(null);
            bug.setWorkflow(fullWorkflow);
        }
        
        if (bug.getWorkflow() != null && bug.getWorkflow().getSteps() != null && !bug.getWorkflow().getSteps().isEmpty()) {
            bug.setStatus(bug.getWorkflow().getSteps().get(0).getStepName());
        } else if (bug.getStatus() == null) {
            bug.setStatus("OPEN");
        }
        
        Bug savedBug = bugRepository.save(bug);

        if (savedBug.getWorkflow() != null && savedBug.getWorkflow().getSteps() != null) {
            List<BugWorkflowMap> wmaps = new java.util.ArrayList<>();
            boolean isFirst = true;

            for (WorkflowStep step : savedBug.getWorkflow().getSteps()) {
                BugWorkflowMap map = new BugWorkflowMap();
                map.setBug(savedBug);
                map.setWorkflow(savedBug.getWorkflow());
                map.setStep(step);
                map.setStepName(step.getStepName());
                map.setStepType(step.getStepType());
                map.setSequence(step.getSequence());

                if (isFirst) {
                    map.setStatus("IN_PROGRESS");
                    isFirst = false;
                } else {
                    map.setStatus("NOT_STARTED");
                }
                wmaps.add(map);
            }
            bugWorkflowMapRepository.saveAll(wmaps);
        }

        return savedBug;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBug(@PathVariable Long id, @RequestBody Bug bugDetails) {
        return bugRepository.findById(id)
                .map(bug -> {
                    String oldStatus = bug.getStatus();
                    
                    if ("INVALID_PENDING_APPROVAL".equals(oldStatus)) {
                        return ResponseEntity.status(403).body("This bug is pending invalidation review and locked from standard updates.");
                    }
                    
                    if ("CLOSED".equals(oldStatus) || "INVALID_BUG".equals(oldStatus)) {
                        return ResponseEntity.status(403).body("This bug is in a terminal state (CLOSED/INVALID) and cannot be updated.");
                    }
                    
                    // Restriction: Only assigned developer can update, UNLESS it's a Code Review, Admin override, or the Creator
                    if (bug.getAssignedDeveloper() != null) {
                        String username = SecurityContextHolder.getContext().getAuthentication().getName();
                        String roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities().toString();
                        boolean isReviewer = roles.contains("ROLE_CODEREVIEWER");
                        boolean isAdmin = roles.contains("ROLE_TESTADMIN");
                        boolean isCreatorTop = bug.getRaisedBy() != null && bug.getRaisedBy().getUsername().equals(username);

                        // DEVADMIN is treated as a DEVELOPER for bug updates (restricted to assigned bugs)
                        if (!bug.getAssignedDeveloper().getUsername().equals(username) && !isReviewer && !isAdmin && !isCreatorTop) {
                            return ResponseEntity.status(403).body("Only the assigned developer, the bug creator, or an admin can update this bug.");
                        }

                        // NEW: Prevent developer updates if bug is in active testing phase or has a tester assigned
                        boolean isActiveTesting = bug.getStatus() != null && (bug.getStatus().contains("TESTING") || 
                                               (bug.getStatus().contains("UAT") && !bug.getStatus().contains("COMPLETED")) ||
                                               (bug.getStatus().contains("SIT") && !bug.getStatus().contains("COMPLETED")));

                        if ((bug.getTester() != null || isActiveTesting) && 
                            !isAdmin && !isReviewer && !roles.contains("ROLE_TESTER")) {
                            return ResponseEntity.status(403).body("This bug is currently in testing/review phase and cannot be updated by developers.");
                        }
                    }

                    // Mandatory remarks for status change
                    if (bugDetails.getStatus() != null && !bug.getStatus().equals(bugDetails.getStatus())) {
                        if (bugDetails.getRemarks() == null || bugDetails.getRemarks().trim().isEmpty()) {
                            return ResponseEntity.badRequest().body("Updating Remarks are mandatory for all status changes.");
                        }
                    }

                    // Check transition logic if workflow is present
                    if (bugDetails.getStatus() != null && !bug.getStatus().equals(bugDetails.getStatus())) {
                        if ("INVALID_PENDING_APPROVAL".equals(bugDetails.getStatus())) {
                            bug.setStatus("INVALID_PENDING_APPROVAL");
                        } else if (bug.getWorkflow() == null) {
                            bug.setStatus(bugDetails.getStatus());
                        } else {
                            List<BugWorkflowMap> snapshottedMaps = bugWorkflowMapRepository.findByBugId(bug.getId());
                            List<WorkflowStep> steps = snapshottedMaps.stream()
                                    .sorted(java.util.Comparator.comparing(BugWorkflowMap::getSequence))
                                    .map(BugWorkflowMap::getStep)
                                    .toList();
                            
                            Optional<WorkflowStep> currentStepOpt = steps.stream()
                                    .filter(s -> s.getStepName().equals(bug.getStatus()))
                                    .findFirst();
                            Optional<WorkflowStep> nextStepOpt = steps.stream()
                                    .filter(s -> s.getStepName().equals(bugDetails.getStatus()))
                                    .findFirst();

                            if (currentStepOpt.isPresent() && nextStepOpt.isPresent()) {
                                WorkflowStep currentStep = currentStepOpt.get();
                                WorkflowStep nextStep = nextStepOpt.get();
                                
                                // Special Transition: Invalid Bug (Developer shortcut to Verification)
                                if ("INVALID_BUG".equals(bugDetails.getRemarks()) || bugDetails.getStatus().contains("VERIFIED") || bugDetails.getStatus().contains("CLOSED")) {
                                    // if it's skipping, allow if it's jumping to the final step (Tester step)
                                    // Set all intermediate map steps to CLOSED, make target IN_PROGRESS
                                    snapshottedMaps.forEach(map -> {
                                        if (map.getSequence() <= currentStep.getSequence()) {
                                            map.setStatus("CLOSED");
                                            bugWorkflowMapRepository.save(map);
                                        } else if (map.getStepName().equals(nextStep.getStepName())) {
                                            map.setStatus("IN_PROGRESS");
                                            bugWorkflowMapRepository.save(map);
                                        }
                                    });
                                } else if ("NOT_RESOLVED".equals(bugDetails.getRemarks())) {
                                    // Special Transition: Tester rejecting fix back to developer
                                    // Close current verification step, re-open the developer step (usually index 1 if 0 is OPEN)
                                    WorkflowStep devStep = steps.stream()
                                        .filter(s -> "TASK".equals(s.getStepType()) && s.getSequence() > 1 && !s.getStepName().contains("COMPLETED"))
                                        .findFirst().orElse(steps.get(1)); // Fallback to 2nd step (IN_PROGRESS)

                                    snapshottedMaps.forEach(map -> {
                                        if (map.getStepName().equals(currentStep.getStepName())) {
                                            map.setStatus("CLOSED");
                                            bugWorkflowMapRepository.save(map);
                                        } else if (map.getStepName().equals(devStep.getStepName())) {
                                            map.setStatus("IN_PROGRESS");
                                            bugWorkflowMapRepository.save(map);
                                        }
                                    });
                                    bug.setStatus(devStep.getStepName());
                                    // Override bugDetails.status so it gets set correctly below
                                    bugDetails.setStatus(devStep.getStepName());
                                } else if (nextStep.getSequence() != currentStep.getSequence() + 1) {
                                    return ResponseEntity.status(400).body("Sequential transitions only. Cannot jump from " + bug.getStatus() + " to " + bugDetails.getStatus());
                                } else {
                                    // Standard sequential move
                                    snapshottedMaps.forEach(map -> {
                                        if (map.getStepName().equals(currentStep.getStepName())) {
                                            map.setStatus("CLOSED");
                                            bugWorkflowMapRepository.save(map);
                                        }
                                        if (map.getStepName().equals(nextStep.getStepName())) {
                                            map.setStatus("IN_PROGRESS");
                                            bugWorkflowMapRepository.save(map);
                                        }
                                    });
                                }
                            }
                            
                            // Check BYPASS LOGIC if necessary
                            bug.setStatus(bugDetails.getStatus());
                            
                            // Final step completion
                            if (bugDetails.getStatus().contains("CLOSED") || bugDetails.getStatus().contains("VERIFIED&CLOSED")) {
                                snapshottedMaps.forEach(map -> {
                                    map.setStatus("CLOSED");
                                    bugWorkflowMapRepository.save(map);
                                });
                            }
                        }
                    }

                    String username = SecurityContextHolder.getContext().getAuthentication().getName();
                    User currentUser = userRepository.findByUsername(username).orElseThrow();
                    String currentUserRole = SecurityContextHolder.getContext().getAuthentication().getAuthorities().toString();

                    boolean isCreator = bug.getRaisedBy() != null && bug.getRaisedBy().getId().equals(currentUser.getId());
                    boolean isAdmin = currentUserRole.contains("ROLE_TESTADMIN");
                    boolean isAssignedDeveloper = bug.getAssignedDeveloper() != null && bug.getAssignedDeveloper().getId().equals(currentUser.getId());

                    // Permission logic
                    if (!isCreator && !isAdmin) {
                        if (isAssignedDeveloper || currentUserRole.contains("ROLE_DEVELOPER")) {
                            if ("CLOSED".equals(bugDetails.getStatus()) || (bugDetails.getStatus() != null && bugDetails.getStatus().contains("VERIFIED"))) {
                                // Exclude INVALID_BUG short-circuit from this general block if developer triggers it
                                if (!"INVALID_BUG".equals(bugDetails.getRemarks())) {
                                    return ResponseEntity.status(403).body("Developers cannot verify/close bugs. Only the creator tester can do this.");
                                }
                            }
                        } else {
                            return ResponseEntity.status(403).body("You do not have permission to update this bug.");
                        }
                    } else {
                        // Creator or Admin update
                        bug.setTitle(bugDetails.getTitle());
                        bug.setDescription(bugDetails.getDescription());
                        bug.setSeverity(bugDetails.getSeverity());
                        bug.setPriority(bugDetails.getPriority());
                        // jtrackId is immutable

                        if (bugDetails.getAssignedDeveloper() != null) {
                            bug.setAssignedDeveloper(bugDetails.getAssignedDeveloper());
                            // If assigned manually, remove from pool
                            if (bug.isInPool()) {
                                bug.setInPool(false);
                                bug.setInPoolDate(null);
                            }
                        } else {
                            bug.setAssignedDeveloper(null);
                        }
                        
                        if (bugDetails.getBugTask() != null) {
                            bug.setBugTask(bugDetails.getBugTask());
                        } else {
                            bug.setBugTask(null);
                        }

                        if (bugDetails.getWorkflow() != null && bugDetails.getWorkflow().getId() != null) {
                            Workflow fullWorkflow = workflowRepository.findById(bugDetails.getWorkflow().getId()).orElse(null);
                            bug.setWorkflow(fullWorkflow);
                        } else if (bugDetails.getWorkflow() == null) {
                            bug.setWorkflow(null);
                        }
                    }
                    
                    // Audit logging for status change
                    if (bugDetails.getStatus() != null && !bugDetails.getStatus().equals(oldStatus)) {
                        AuditLog log = new AuditLog();
                        log.setEntityType("BUG");
                        log.setEntityId(bug.getId());
                        log.setFieldName("status");
                        log.setOldValue(oldStatus);
                        log.setNewValue(bug.getStatus());
                        log.setRemarks(bugDetails.getRemarks());
                        log.setChangedBy(currentUser);
                        auditLogRepository.save(log);
                    }
                    
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBug(@PathVariable Long id) {
        return bugRepository.findById(id)
                .map(bug -> {
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();
                    String currentUserRole = SecurityContextHolder.getContext().getAuthentication().getAuthorities().toString();

                    if (!bug.getRaisedBy().getUsername().equals(username) && !currentUserRole.contains("ROLE_TESTADMIN")) {
                        return ResponseEntity.status(403).body("Only the creator or an admin can update this bug.");
                    }

                    bugWorkflowMapRepository.deleteByBugId(id);
                    bugRepository.delete(bug);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/current-step")
    public ResponseEntity<WorkflowStep> getCurrentBugStep(@PathVariable Long id) {
        return bugWorkflowMapRepository.findActiveStepByBugId(id)
                .map(map -> ResponseEntity.ok(map.getStep()))
                .orElse(ResponseEntity.ok(null));
    }

    @GetMapping("/{id}/steps")
    public ResponseEntity<List<WorkflowStep>> getBugSteps(@PathVariable Long id) {
        List<BugWorkflowMap> maps = bugWorkflowMapRepository.findByBugId(id);
        List<WorkflowStep> steps = maps.stream()
                .sorted(java.util.Comparator.comparing(BugWorkflowMap::getSequence))
                .map(BugWorkflowMap::getStep)
                .toList();
        return ResponseEntity.ok(steps);
    }

    // UAT and Pool Endpoints
    @PostMapping("/{id}/push-to-pool")
    @PreAuthorize("hasAnyRole('DEVADMIN', 'TESTADMIN')")
    public ResponseEntity<?> pushToPool(@PathVariable Long id) {
        return bugRepository.findById(id)
                .map(bug -> {
                    if (bug.getAssignedDeveloper() != null) {
                        return ResponseEntity.badRequest().body("Assigned bugs cannot be pushed to pool.");
                    }
                    bug.setInPool(true);
                    bug.setInPoolDate(java.time.LocalDateTime.now());
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pick-from-pool")
    @PreAuthorize("hasAnyRole('DEVELOPER', 'DEVADMIN')")
    public ResponseEntity<?> pickFromPool(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (!bug.isInPool()) {
                        return ResponseEntity.badRequest().body("Bug is not in the pool.");
                    }
                    bug.setInPool(false);
                    bug.setAssignedDeveloper(currentUser);
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pick-for-sit")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> pickForSit(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (bug.getTester() != null) {
                        return ResponseEntity.badRequest().body("Bug is already being tested.");
                    }
                    bug.setTester(currentUser);
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve-sit")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> approveSit(@PathVariable Long id, @RequestBody Bug bugDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (bugDetails.getRemarks() == null || bugDetails.getRemarks().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Remarks are mandatory for approval.");
                    }
                    String oldStatus = bug.getStatus();
                    String newStatus = configRepository.findByConfigKey("STATUS_SIT_COMPLETED")
                            .map(AppConfig::getConfigValue).orElse("SIT_COMPLETED");
                    
                    bug.setStatus(newStatus);
                    bug.setTester(null);
                    bug.setRemarks(bugDetails.getRemarks());

                    // Sync Workflow Map
                    List<BugWorkflowMap> maps = bugWorkflowMapRepository.findByBugId(bug.getId());
                    if (!maps.isEmpty()) {
                        maps.forEach(map -> {
                            if (map.getStepName().equals(oldStatus)) {
                                map.setStatus("CLOSED");
                                bugWorkflowMapRepository.save(map);
                            }
                            if (map.getStepName().equals(newStatus)) {
                                map.setStatus("IN_PROGRESS");
                                bugWorkflowMapRepository.save(map);
                            }
                        });
                    }
                    
                    AuditLog log = new AuditLog();
                    log.setEntityType("BUG");
                    log.setEntityId(bug.getId());
                    log.setFieldName("status");
                    log.setOldValue(oldStatus);
                    log.setNewValue(newStatus);
                    log.setRemarks(bugDetails.getRemarks());
                    log.setChangedBy(currentUser);
                    auditLogRepository.save(log);
                    
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject-sit")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> rejectSit(@PathVariable Long id, @RequestBody Bug bugDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (bugDetails.getRemarks() == null || bugDetails.getRemarks().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Remarks are mandatory for rejection.");
                    }
                    String oldStatus = bug.getStatus();
                    bug.setStatus("IN_PROGRESS");
                    bug.setTester(null);
                    bug.setRemarks(bugDetails.getRemarks());

                    // Sync Workflow Map
                    List<BugWorkflowMap> maps = bugWorkflowMapRepository.findByBugId(bug.getId());
                    if (!maps.isEmpty()) {
                        maps.forEach(map -> {
                            if (map.getStepName().equals(oldStatus)) {
                                map.setStatus("NOT_STARTED");
                                bugWorkflowMapRepository.save(map);
                            }
                            if (map.getStepName().equals("IN_PROGRESS")) {
                                map.setStatus("IN_PROGRESS");
                                bugWorkflowMapRepository.save(map);
                            }
                        });
                    }
                    
                    AuditLog log = new AuditLog();
                    log.setEntityType("BUG");
                    log.setEntityId(bug.getId());
                    log.setFieldName("status");
                    log.setOldValue(oldStatus);
                    log.setNewValue("IN_PROGRESS");
                    log.setRemarks(bugDetails.getRemarks());
                    log.setChangedBy(currentUser);
                    auditLogRepository.save(log);
                    
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pick-for-uat")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> pickForUat(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (bug.getTester() != null) {
                        return ResponseEntity.badRequest().body("Bug is already being tested.");
                    }
                    bug.setTester(currentUser);
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve-uat")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> approveUat(@PathVariable Long id, @RequestBody Bug bugDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (bugDetails.getRemarks() == null || bugDetails.getRemarks().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Remarks are mandatory for approval.");
                    }
                    String oldStatus = bug.getStatus();
                    String newStatus = configRepository.findByConfigKey("STATUS_UAT_COMPLETED")
                            .map(AppConfig::getConfigValue).orElse("UAT_COMPLETED");
                    
                    bug.setStatus(newStatus);
                    bug.setTester(null);
                    bug.setRemarks(bugDetails.getRemarks());

                    // Sync Workflow Map
                    List<BugWorkflowMap> maps = bugWorkflowMapRepository.findByBugId(bug.getId());
                    if (!maps.isEmpty()) {
                        maps.forEach(map -> {
                            if (map.getStepName().equals(oldStatus)) {
                                map.setStatus("CLOSED");
                                bugWorkflowMapRepository.save(map);
                            }
                            if (map.getStepName().equals(newStatus)) {
                                map.setStatus("IN_PROGRESS");
                                bugWorkflowMapRepository.save(map);
                            }
                        });
                    }
                    
                    AuditLog log = new AuditLog();
                    log.setEntityType("BUG");
                    log.setEntityId(bug.getId());
                    log.setFieldName("status");
                    log.setOldValue(oldStatus);
                    log.setNewValue(newStatus);
                    log.setRemarks(bugDetails.getRemarks());
                    log.setChangedBy(currentUser);
                    auditLogRepository.save(log);
                    
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject-uat")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> rejectUat(@PathVariable Long id, @RequestBody Bug bugDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (bugDetails.getRemarks() == null || bugDetails.getRemarks().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Remarks are mandatory for rejection.");
                    }
                    String oldStatus = bug.getStatus();
                    String newStatus = configRepository.findByConfigKey("STATUS_REJECTED")
                            .map(AppConfig::getConfigValue).orElse("IN_PROGRESS");
                    
                    bug.setStatus(newStatus);
                    bug.setTester(null); // Release tester
                    bug.setRemarks(bugDetails.getRemarks());
                    
                    // Sync Workflow Map
                    List<BugWorkflowMap> maps = bugWorkflowMapRepository.findByBugId(bug.getId());
                    if (!maps.isEmpty()) {
                        maps.forEach(map -> {
                            if (map.getStepName().equals(oldStatus)) {
                                map.setStatus("NOT_STARTED");
                                bugWorkflowMapRepository.save(map);
                            }
                            if (map.getStepName().equals(newStatus)) {
                                map.setStatus("IN_PROGRESS");
                                bugWorkflowMapRepository.save(map);
                            }
                        });
                    }
                    
                    AuditLog log = new AuditLog();
                    log.setEntityType("BUG");
                    log.setEntityId(bug.getId());
                    log.setFieldName("status");
                    log.setOldValue(oldStatus);
                    log.setNewValue(newStatus);
                    log.setRemarks(bugDetails.getRemarks());
                    log.setChangedBy(currentUser);
                    auditLogRepository.save(log);
                    
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping("/{id}/approve-invalid")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> approveInvalidBug(@PathVariable Long id, @RequestBody Bug bugDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (!"INVALID_PENDING_APPROVAL".equals(bug.getStatus())) {
                        return ResponseEntity.badRequest().body("Bug is not pending invalidation review.");
                    }
                    if (bugDetails.getRemarks() == null || bugDetails.getRemarks().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Remarks are mandatory for approval.");
                    }
                    String oldStatus = bug.getStatus();
                    String newStatus = "INVALID_BUG";
                    
                    bug.setStatus(newStatus);
                    bug.setRemarks(bugDetails.getRemarks());
                    
                    bugWorkflowMapRepository.findByBugId(bug.getId()).forEach(map -> {
                        map.setStatus("CLOSED");
                        bugWorkflowMapRepository.save(map);
                    });
                    
                    AuditLog log = new AuditLog();
                    log.setEntityType("BUG");
                    log.setEntityId(bug.getId());
                    log.setFieldName("status");
                    log.setOldValue(oldStatus);
                    log.setNewValue(newStatus);
                    log.setRemarks(bugDetails.getRemarks());
                    log.setChangedBy(currentUser);
                    auditLogRepository.save(log);
                    
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject-invalid")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN')")
    public ResponseEntity<?> rejectInvalidBug(@PathVariable Long id, @RequestBody Bug bugDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        return bugRepository.findById(id)
                .map(bug -> {
                    if (!"INVALID_PENDING_APPROVAL".equals(bug.getStatus())) {
                        return ResponseEntity.badRequest().body("Bug is not pending invalidation review.");
                    }
                    if (bugDetails.getRemarks() == null || bugDetails.getRemarks().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Remarks are mandatory for rejection.");
                    }
                    String oldStatus = bug.getStatus();
                    String newStatus = "IN_PROGRESS"; // Return to developer step
                    
                    bug.setStatus(newStatus);
                    bug.setRemarks(bugDetails.getRemarks());

                    // Sync Workflow Map
                    List<BugWorkflowMap> maps = bugWorkflowMapRepository.findByBugId(bug.getId());
                    if (!maps.isEmpty()) {
                        maps.forEach(map -> {
                            if (map.getStepName().equals(oldStatus)) {
                                map.setStatus("NOT_STARTED");
                                bugWorkflowMapRepository.save(map);
                            }
                            if (map.getStepName().equals(newStatus)) {
                                map.setStatus("IN_PROGRESS");
                                bugWorkflowMapRepository.save(map);
                            }
                        });
                    }
                    
                    AuditLog log = new AuditLog();
                    log.setEntityType("BUG");
                    log.setEntityId(bug.getId());
                    log.setFieldName("status");
                    log.setOldValue(oldStatus);
                    log.setNewValue(newStatus);
                    log.setRemarks(bugDetails.getRemarks());
                    log.setChangedBy(currentUser);
                    auditLogRepository.save(log);
                    
                    return ResponseEntity.ok(bugRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
