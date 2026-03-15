package com.example.devtrack.controller;

import com.example.devtrack.model.Bug;
import com.example.devtrack.model.ChangeRequest;
import com.example.devtrack.model.Role;
import com.example.devtrack.model.User;
import com.example.devtrack.repository.BugRepository;
import com.example.devtrack.repository.ChangeRequestRepository;
import com.example.devtrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class BugController {

    @Autowired
    private BugRepository bugRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChangeRequestRepository changeRequestRepository;

    @GetMapping("/bug-manager")
    public String bugManager(Model model) {
        List<ChangeRequest> crs = changeRequestRepository.findAll();
        model.addAttribute("crs", crs);
        return "bug-manager";
    }

    @PostMapping("/cr/create")
    public String createCR(@ModelAttribute ChangeRequest cr) {
        cr.setCreatedAt(LocalDate.now());
        changeRequestRepository.save(cr);
        return "redirect:/bug-manager";
    }

    @GetMapping("/bug-report")
    public String bugReport(Model model) {
        List<ChangeRequest> crs = changeRequestRepository.findAll();
        List<Bug> allBugs = bugRepository.findAll();

        // Group bugs by CR ID for easier access in the view
        java.util.Map<Long, List<Bug>> bugsByCrId = allBugs.stream()
                .filter(b -> b.getChangeRequest() != null)
                .collect(Collectors.groupingBy(b -> b.getChangeRequest().getId()));

        model.addAttribute("crs", crs);
        model.addAttribute("bugsByCrId", bugsByCrId);
        return "bug-report";
    }

    @GetMapping("/cr/{id}")
    public String viewCR(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String title,
            Model model) {
        ChangeRequest cr = changeRequestRepository.findById(id).orElseThrow();

        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedDate").descending());
        Page<Bug> bugPage = bugRepository.findByChangeRequestId(id, pageable);

        model.addAttribute("cr", cr);
        model.addAttribute("bugs", bugPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", bugPage.getTotalPages());
        model.addAttribute("totalItems", bugPage.getTotalElements());

        List<User> developers = userRepository.findAll().stream()
                .filter(u -> u.getRoles().contains(Role.DEVELOPER))
                .collect(Collectors.toList());
        model.addAttribute("developers", developers);

        return "cr-details";
    }

    @PostMapping("/bug/create")
    public String createBug(@ModelAttribute Bug bug, @RequestParam Long crId,
            @RequestParam(required = false) Long assignedToId) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findByUserId(userDetails.getUsername()).orElseThrow();

        ChangeRequest cr = changeRequestRepository.findById(crId).orElseThrow();
        bug.setChangeRequest(cr);
        bug.setRaisedBy(currentUser);
        bug.setCreatedDate(LocalDate.now());
        bug.setUpdatedDate(LocalDate.now());
        bug.setStatus("Open"); // Default

        if (assignedToId != null) {
            User assignedUser = userRepository.findById(assignedToId).orElse(null);
            bug.setAssignedTo(assignedUser);
        }

        bugRepository.save(bug);
        return "redirect:/cr/" + crId;
    }

    @GetMapping("/my-bugs")
    public String myBugs(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String title,
            Model model) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findByUserId(userDetails.getUsername()).orElseThrow();

        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedDate").descending());
        Page<Bug> bugPage = bugRepository.findByAssignedTo(currentUser, pageable);

        model.addAttribute("bugs", bugPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", bugPage.getTotalPages());
        model.addAttribute("totalItems", bugPage.getTotalElements());
        return "my-bugs";
    }

    @PostMapping("/bug/update")
    public String updateBug(@RequestParam Long bugId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String newComment) {
        Bug bug = bugRepository.findById(bugId).orElseThrow();

        if (status != null)
            bug.setStatus(status);
        if (description != null && !description.isEmpty()) {
            bug.setDescription(description);
        }

        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findByUserId(userDetails.getUsername()).orElseThrow();

        if (newComment != null && !newComment.trim().isEmpty()) {
            String timestamp = java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            String formattedComment = String.format("[%s] %s (%s): %s", timestamp, currentUser.getName(),
                    currentUser.getRoles().iterator().next(), newComment.trim());

            String existingComments = bug.getComments();
            if (existingComments == null || existingComments.isEmpty()) {
                bug.setComments(formattedComment);
            } else {
                bug.setComments(existingComments + "\n" + formattedComment);
            }
        }

        bug.setUpdatedDate(LocalDate.now());
        bugRepository.save(bug);

        if (currentUser.getRoles().contains(Role.TESTING)) {
            if (bug.getChangeRequest() != null) {
                return "redirect:/cr/" + bug.getChangeRequest().getId();
            }
            return "redirect:/bug-manager";
        }
        return "redirect:/my-bugs";
    }
}
