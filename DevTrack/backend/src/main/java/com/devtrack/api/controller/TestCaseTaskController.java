package com.devtrack.api.controller;

import com.devtrack.api.model.*;
import com.devtrack.api.repository.AuditLogRepository;
import com.devtrack.api.repository.TestCaseTaskRepository;
import com.devtrack.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-case-tasks")
@CrossOrigin(origins = "*")
public class TestCaseTaskController {

    @Autowired
    private TestCaseTaskRepository testCaseTaskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    public List<TestCaseTask> getAllTestCaseTasks() {
        return testCaseTaskRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestCaseTask> getTestCaseTaskById(@PathVariable Long id) {
        return testCaseTaskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TestCaseTask createTestCaseTask(@RequestBody TestCaseTask testCaseTask) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        
        if (testCaseTask.getTitle() == null || testCaseTask.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Title is mandatory.");
        }
        if (testCaseTask.getDescription() == null || testCaseTask.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is mandatory.");
        }

        if (testCaseTask.getCreatedBy() == null) {
            testCaseTask.setCreatedBy(currentUser);
        }

        if (testCaseTask.getWorkflow() != null && testCaseTask.getWorkflow().getSteps() != null && !testCaseTask.getWorkflow().getSteps().isEmpty()) {
            testCaseTask.setStatus(testCaseTask.getWorkflow().getSteps().get(0).getStepName());
        } else if (testCaseTask.getStatus() == null) {
            testCaseTask.setStatus("OPEN");
        }
        
        return testCaseTaskRepository.save(testCaseTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTestCaseTask(@PathVariable Long id, @RequestBody TestCaseTask testCaseTaskDetails) {
        return testCaseTaskRepository.findById(id)
                .map(testCaseTask -> {
                    String oldStatus = testCaseTask.getStatus();
                    testCaseTask.setTitle(testCaseTaskDetails.getTitle());
                    testCaseTask.setDescription(testCaseTaskDetails.getDescription());
                    // jtrackId is immutable
                    testCaseTask.setPriority(testCaseTaskDetails.getPriority());

                    if (testCaseTaskDetails.getStatus() != null && !testCaseTask.getStatus().equals(testCaseTaskDetails.getStatus())) {
                        if (testCaseTaskDetails.getRemarks() == null || testCaseTaskDetails.getRemarks().trim().isEmpty()) {
                            return ResponseEntity.badRequest().body("Updating Remarks are mandatory for all status changes.");
                        }
                        testCaseTask.setStatus(testCaseTaskDetails.getStatus());
                    }
                    
                    if (testCaseTaskDetails.getAssignedDeveloper() != null) {
                        testCaseTask.setAssignedDeveloper(testCaseTaskDetails.getAssignedDeveloper());
                    }

                    if (testCaseTaskDetails.getWorkflow() != null) {
                        testCaseTask.setWorkflow(testCaseTaskDetails.getWorkflow());
                    }
                    
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();
                    User currentUser = userRepository.findByUsername(username).orElseThrow();
                    
                    if (testCaseTaskDetails.getStatus() != null && !testCaseTaskDetails.getStatus().equals(oldStatus)) {
                        AuditLog log = new AuditLog();
                        log.setEntityType("TEST_CASE_TASK");
                        log.setEntityId(testCaseTask.getId());
                        log.setFieldName("status");
                        log.setOldValue(oldStatus);
                        log.setNewValue(testCaseTask.getStatus());
                        log.setRemarks(testCaseTaskDetails.getRemarks());
                        log.setChangedBy(currentUser);
                        auditLogRepository.save(log);
                    }
                    
                    return ResponseEntity.ok(testCaseTaskRepository.save(testCaseTask));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestCaseTask(@PathVariable Long id) {
        return testCaseTaskRepository.findById(id)
                .map(testCaseTask -> {
                    testCaseTaskRepository.delete(testCaseTask);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
