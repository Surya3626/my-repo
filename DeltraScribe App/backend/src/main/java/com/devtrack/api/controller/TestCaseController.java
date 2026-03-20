package com.devtrack.api.controller;

import com.devtrack.api.model.TestCase;
import com.devtrack.api.model.User;
import com.devtrack.api.model.Role;
import com.devtrack.api.repository.TestCaseRepository;
import com.devtrack.api.repository.UserRepository;
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

@RestController
@RequestMapping("/api/testcases")
@CrossOrigin(origins = "*")
public class TestCaseController {

    @Autowired
    private TestCaseRepository testCaseRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public Page<TestCase> getAllTestCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "true") boolean showClosed) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (showClosed) {
            return testCaseRepository.findAll(pageable);
        } else {
            return testCaseRepository.findByStatusNot("CLOSED", pageable);
        }
    }

    @GetMapping("/task/{taskId}")
    public List<TestCase> getTestCasesByTask(@PathVariable Long taskId) {
        return testCaseRepository.findAll().stream()
                .filter(tc -> tc.getTestCaseTask() != null && tc.getTestCaseTask().getId().equals(taskId))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestCase> getTestCaseById(@PathVariable Long id) {
        return testCaseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN', 'DEVADMIN')")
    public TestCase createTestCase(@RequestBody TestCase testCase) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        
        if (testCase.getTitle() == null || testCase.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Title is mandatory.");
        }
        if (testCase.getDescription() == null || testCase.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Description is mandatory.");
        }
        if (testCase.getTestCaseId() == null || testCase.getTestCaseId().trim().isEmpty()) {
            throw new RuntimeException("Test Case ID is mandatory.");
        }

        if (testCase.getCreatedBy() == null) {
            testCase.setCreatedBy(currentUser);
        }
        
        if (testCase.getStatus() == null) {
            testCase.setStatus("OPEN");
        }
        
        return testCaseRepository.save(testCase);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN', 'DEVADMIN')")
    public ResponseEntity<?> updateTestCase(@PathVariable Long id, @RequestBody TestCase testCaseDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        boolean isAdmin = currentUser.getRoles().contains(Role.DEVADMIN) || currentUser.getRoles().contains(Role.TESTADMIN);

        return testCaseRepository.findById(id)
                .map(testCase -> {
                    // Restriction: Only creator or admin can update
                    if (!isAdmin && !testCase.getCreatedBy().getId().equals(currentUser.getId())) {
                        return ResponseEntity.status(403).body("You can only update test cases created by you.");
                    }

                    testCase.setTestCaseId(testCaseDetails.getTestCaseId());
                    testCase.setTitle(testCaseDetails.getTitle());
                    testCase.setDescription(testCaseDetails.getDescription());
                    testCase.setSteps(testCaseDetails.getSteps());
                    testCase.setExpectedResult(testCaseDetails.getExpectedResult());
                    testCase.setDocumentUrl(testCaseDetails.getDocumentUrl());
                    testCase.setStatus(testCaseDetails.getStatus());
                    
                    if (testCaseDetails.getTestCaseTask() != null) {
                        testCase.setTestCaseTask(testCaseDetails.getTestCaseTask());
                    }
                    
                    return ResponseEntity.ok(testCaseRepository.save(testCase));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TESTER', 'TESTADMIN', 'DEVADMIN')")
    public ResponseEntity<?> deleteTestCase(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();
        boolean isAdmin = currentUser.getRoles().contains(Role.DEVADMIN) || currentUser.getRoles().contains(Role.TESTADMIN);

        return testCaseRepository.findById(id)
                .map(testCase -> {
                    if (!isAdmin && !testCase.getCreatedBy().getId().equals(currentUser.getId())) {
                        return ResponseEntity.status(403).body("You can only delete test cases created by you.");
                    }
                    testCaseRepository.delete(testCase);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
