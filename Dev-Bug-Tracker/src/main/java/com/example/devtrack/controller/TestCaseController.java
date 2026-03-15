package com.example.devtrack.controller;

import com.example.devtrack.model.ChangeRequest;
import com.example.devtrack.model.TestCase;
import com.example.devtrack.repository.ChangeRequestRepository;
import com.example.devtrack.repository.TestCaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.List;

@Controller
public class TestCaseController {

    @Autowired
    private TestCaseRepository testCaseRepository;

    @Autowired
    private ChangeRequestRepository changeRequestRepository;

    @GetMapping("/test-case-manager")
    public String testCaseManager(Model model) {
        List<ChangeRequest> crs = changeRequestRepository.findAll();
        model.addAttribute("crs", crs);
        return "test-case-manager";
    }

    @GetMapping("/test-cases/cr/{crId}")
    public String viewTestCases(@PathVariable Long crId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Model model) {
        ChangeRequest cr = changeRequestRepository.findById(crId).orElseThrow();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<TestCase> testCasePage = testCaseRepository.findByChangeRequestId(crId, pageable);

        model.addAttribute("cr", cr);
        model.addAttribute("testCases", testCasePage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", testCasePage.getTotalPages());
        model.addAttribute("totalItems", testCasePage.getTotalElements());
        return "test-cases";
    }

    @PostMapping("/test-cases/save")
    public String saveTestCase(@ModelAttribute TestCase testCase, @RequestParam Long crId) {
        ChangeRequest cr = changeRequestRepository.findById(crId).orElseThrow();
        testCase.setChangeRequest(cr);
        testCaseRepository.save(testCase);
        return "redirect:/test-cases/cr/" + crId;
    }

    @PostMapping("/test-cases/create-cr")
    public String createCR(@ModelAttribute ChangeRequest cr) {
        cr.setCreatedAt(LocalDate.now());
        changeRequestRepository.save(cr);
        return "redirect:/test-case-manager";
    }
}
