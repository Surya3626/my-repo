package com.example.devtrack.controller;

import com.example.devtrack.model.Role;
import com.example.devtrack.model.Task;
import com.example.devtrack.model.User;
import com.example.devtrack.repository.TaskRepository;
import com.example.devtrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

@Controller
public class TaskController {

        @Autowired
        private TaskRepository taskRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private com.example.devtrack.repository.BugRepository bugRepository;

        @Autowired
        private com.example.devtrack.repository.ChangeRequestRepository changeRequestRepository;

        @GetMapping("/")
        public String dashboard(@RequestParam(required = false) String status,
                        @RequestParam(required = false) String priority,
                        @RequestParam(required = false) String developerName,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) String branch,
                        @RequestParam(required = false) String jtrackId,
                        @RequestParam(required = false) String devStartDate,
                        @RequestParam(required = false) String sitDate,
                        @RequestParam(required = false) String uatDate,
                        @RequestParam(required = false) String prodDate,
                        Model model) {

                UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication()
                                .getPrincipal();
                User currentUser = userRepository.findByUserId(userDetails.getUsername()).orElseThrow();

                if (!currentUser.getRoles().contains(Role.ADMIN)) {
                        return "redirect:/my-tasks";
                }

                // Fetch all tasks and filter manually
                List<Task> tasks = taskRepository.findAll();

                if (status != null && !status.isEmpty()) {
                        tasks.removeIf(t -> t.getStatus() == null || !t.getStatus().equalsIgnoreCase(status));
                }
                if (priority != null && !priority.isEmpty()) {
                        tasks.removeIf(t -> t.getPriority() == null || !t.getPriority().equalsIgnoreCase(priority));
                }
                if (developerName != null && !developerName.isEmpty()) {
                        tasks.removeIf(t -> t.getDeveloperName() == null
                                        || !t.getDeveloperName().toLowerCase().contains(developerName.toLowerCase()));
                }
                if (type != null && !type.isEmpty()) {
                        tasks.removeIf(t -> t.getType() == null || !t.getType().equalsIgnoreCase(type));
                }
                if (branch != null && !branch.isEmpty()) {
                        tasks.removeIf(t -> t.getBranch() == null
                                        || !t.getBranch().toLowerCase().contains(branch.toLowerCase()));
                }
                if (jtrackId != null && !jtrackId.isEmpty()) {
                        tasks.removeIf(t -> t.getJtrackId() == null
                                        || !t.getJtrackId().toLowerCase().contains(jtrackId.toLowerCase()));
                }
                if (devStartDate != null && !devStartDate.isEmpty()) {
                        tasks.removeIf(t -> t.getDevStartDate() == null
                                        || !t.getDevStartDate().toString().equals(devStartDate));
                }
                if (sitDate != null && !sitDate.isEmpty()) {
                        tasks.removeIf(t -> t.getSitDate() == null || !t.getSitDate().toString().equals(sitDate));
                }
                if (uatDate != null && !uatDate.isEmpty()) {
                        tasks.removeIf(t -> t.getUatDate() == null || !t.getUatDate().toString().equals(uatDate));
                }
                if (prodDate != null && !prodDate.isEmpty()) {
                        tasks.removeIf(t -> t.getProdDate() == null || !t.getProdDate().toString().equals(prodDate));
                }

                model.addAttribute("tasks", tasks);

                // Add users for "Assigned To" dropdown
                List<User> developers = userRepository.findAll().stream()
                                .filter(u -> u.getRoles().contains(Role.DEVELOPER))
                                .toList();
                model.addAttribute("developers", developers);

                return "dashboard_v3"; // Finalized Design 3
        }

        @GetMapping("/my-tasks")
        public String myTasks(Model model) {
                UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication()
                                .getPrincipal();
                User currentUser = userRepository.findByUserId(userDetails.getUsername()).orElseThrow();

                List<Task> myTasks = taskRepository.findByAssignedUser(currentUser);
                model.addAttribute("tasks", myTasks);
                model.addAttribute("newTask", new Task());
                return "my-tasks";
        }

        @PostMapping("/task/create")
        public String createTask(@ModelAttribute Task task, @RequestParam(required = false) Long assignedUserId) {
                UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication()
                                .getPrincipal();
                User currentUser = userRepository.findByUserId(userDetails.getUsername()).orElseThrow();

                if (assignedUserId != null) {
                        User assignedUser = userRepository.findById(assignedUserId).orElseThrow();
                        task.setAssignedUser(assignedUser);
                        task.setDeveloperName(assignedUser.getName());
                } else {
                        task.setAssignedUser(currentUser);
                        task.setDeveloperName(currentUser.getName());
                }

                task.setStatus("To Do"); // Default status
                taskRepository.save(task);

                // Redirect based on role or referrer? For now, if admin created, go back to
                // dashboard
                if (currentUser.getRoles().contains(Role.ADMIN) && assignedUserId != null) {
                        return "redirect:/";
                }
                return "redirect:/my-tasks";
        }

        @PostMapping("/task/update")
        public String updateTask(@RequestParam Long taskId,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String description,
                        @RequestParam(required = false) String sitDate,
                        @RequestParam(required = false) String uatDate,
                        @RequestParam(required = false) String prodDate,
                        @RequestParam(required = false) String devStartDate,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) String branch,
                        @RequestParam(required = false) String priority,
                        @RequestParam(required = false) String jtrackId,
                        @RequestParam(required = false) Double efforts,
                        @RequestParam(required = false) String taskName,
                        @RequestParam(required = false) String newComment) {

                Task task = taskRepository.findById(taskId).orElseThrow();

                if (status != null)
                        task.setStatus(status);
                if (type != null)
                        task.setType(type);
                if (branch != null)
                        task.setBranch(branch);
                if (priority != null)
                        task.setPriority(priority);
                if (jtrackId != null)
                        task.setJtrackId(jtrackId);
                if (efforts != null)
                        task.setEfforts(efforts);
                if (taskName != null)
                        task.setTaskName(taskName);

                if (description != null && !description.isEmpty()) {
                        task.setDescription(description);
                }

                if (devStartDate != null && !devStartDate.isEmpty())
                        task.setDevStartDate(LocalDate.parse(devStartDate));
                if (sitDate != null && !sitDate.isEmpty())
                        task.setSitDate(LocalDate.parse(sitDate));
                if (uatDate != null && !uatDate.isEmpty())
                        task.setUatDate(LocalDate.parse(uatDate));
                if (prodDate != null && !prodDate.isEmpty())
                        task.setProdDate(LocalDate.parse(prodDate));

                UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication()
                                .getPrincipal();
                User currentUser = userRepository.findByUserId(userDetails.getUsername()).orElseThrow();

                if (newComment != null && !newComment.trim().isEmpty()) {
                        String timestamp = java.time.LocalDateTime.now()
                                        .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                        String formattedComment = String.format("[%s] %s (%s): %s", timestamp, currentUser.getName(),
                                        currentUser.getRoles().iterator().next(), newComment.trim());

                        String existingComments = task.getComments();
                        if (existingComments == null || existingComments.isEmpty()) {
                                task.setComments(formattedComment);
                        } else {
                                task.setComments(existingComments + "\n" + formattedComment);
                        }
                }

                taskRepository.save(task);

                if (currentUser.getRoles().contains(Role.ADMIN)) {
                        return "redirect:/";
                }
                return "redirect:/my-tasks";
        }

        @GetMapping("/design1")
        public String dashboardV1(Model model) {
                model.addAttribute("tasks", taskRepository.findAll());
                return "dashboard_v1";
        }

        public String dashboardV2(Model model) {
                model.addAttribute("tasks", taskRepository.findAll());
                return "dashboard_v2";
        }

        @GetMapping("/design3")
        public String dashboardV3(Model model) {
                model.addAttribute("tasks", taskRepository.findAll());
                return "dashboard_v3";
        }

        @GetMapping("/design4")
        public String dashboardV4(Model model) {
                model.addAttribute("tasks", taskRepository.findAll());
                return "dashboard_v4";
        }

        @PostConstruct
        public void initData() {
                userRepository.deleteAll();
                taskRepository.deleteAll();
                bugRepository.deleteAll();
                changeRequestRepository.deleteAll();

                // Create Users
                User admin = new User("admin", "Admin User", "admin123", "admin@example.com", "1234567890",
                                new HashSet<>(Arrays.asList(Role.ADMIN, Role.DEVELOPER, Role.TESTING)));
                User dev1 = new User("dev1", "Alex Johnson", "dev123", "alex@example.com", "9876543210",
                                new HashSet<>(Collections.singletonList(Role.DEVELOPER)));
                User dev2 = new User("dev2", "Maria Lopez", "dev123", "maria@example.com", "1122334455",
                                new HashSet<>(Collections.singletonList(Role.DEVELOPER)));
                User dev3 = new User("dev3", "Chris Green", "dev123", "chris@example.com", "5566778899",
                                new HashSet<>(Collections.singletonList(Role.DEVELOPER)));
                User tester = new User("tester", "Test User", "test123", "test@example.com", "9988776655",
                                new HashSet<>(Collections.singletonList(Role.TESTING)));
                User testAdmin = new User("testadmin", "Test Admin", "testadmin123", "testadmin@example.com",
                                "1231231234",
                                new HashSet<>(Collections.singletonList(Role.TEST_ADMIN)));

                userRepository.saveAll(Arrays.asList(admin, dev1, dev2, dev3, tester, testAdmin));

                // Create Change Requests
                com.example.devtrack.model.ChangeRequest cr1 = new com.example.devtrack.model.ChangeRequest(
                                "Q4 Release", "JT-2001", "Major release for Q4 including new dashboard.",
                                LocalDate.now().plusDays(5));
                com.example.devtrack.model.ChangeRequest cr2 = new com.example.devtrack.model.ChangeRequest(
                                "Security Patch", "JT-2002", "Critical security updates.",
                                LocalDate.now().plusDays(2));
                com.example.devtrack.model.ChangeRequest cr3 = new com.example.devtrack.model.ChangeRequest(
                                "Mobile App Update", "JT-2003", "Updates for iOS and Android apps.",
                                LocalDate.now().plusDays(10));

                changeRequestRepository.saveAll(Arrays.asList(cr1, cr2, cr3));

                // Create Tasks
                taskRepository.saveAll(Arrays.asList(
                                new Task(null, "Alex Johnson", "Implement User Profile Management", "In Progress",
                                                LocalDate.now().plusDays(5), LocalDate.now().plusDays(10),
                                                LocalDate.of(2024, 10, 15), "SR", "feature/user-profile", "High",
                                                "JIRA-1234",
                                                "Create CRUD endpoints for user profiles and integrate with frontend.",
                                                5.0, LocalDate.now().minusDays(2), dev1),
                                new Task(null, "Maria Lopez", "Fix Login Page UI Glitch", "To Do",
                                                LocalDate.now().plusDays(2), LocalDate.now().plusDays(4),
                                                LocalDate.of(2024, 9, 30), "Fix", "bugfix/login-ui", "Medium",
                                                "JIRA-1235",
                                                "Resolve alignment issue on login button for mobile devices.", 1.5,
                                                LocalDate.now(), dev2),
                                new Task(null, "Alex Johnson", "Develop Dashboard Analytics Module", "Done",
                                                LocalDate.now().minusDays(5), LocalDate.now().minusDays(2),
                                                LocalDate.of(2024, 9, 20), "CR", "feature/dashboard-analytics", "High",
                                                "JIRA-1236", "Implement charts and graphs for user activity analytics.",
                                                8.0, LocalDate.now().minusDays(10), dev1),
                                new Task(null, "Chris Green", "Refactor Database Schema", "Blocked",
                                                LocalDate.now().plusDays(10), LocalDate.now().plusDays(15),
                                                LocalDate.of(2024, 11, 1), "Enhancement", "refactor/db-schema", "High",
                                                "JIRA-1237", "Normalize tables and improve indexing for performance.",
                                                10.0, LocalDate.now().minusDays(5), dev3),
                                new Task(null, "Maria Lopez", "Update API Documentation", "In Progress",
                                                LocalDate.now().plusDays(3), LocalDate.now().plusDays(6),
                                                LocalDate.of(2024, 10, 5), "SR", "docs/api-update", "Low", "JIRA-1238",
                                                "Update Swagger docs to reflect recent API changes.", 2.0,
                                                LocalDate.now().minusDays(1), dev2),
                                new Task(null, "Chris Green", "Perform Security Audit", "Done",
                                                LocalDate.now().minusDays(8), LocalDate.now().minusDays(4),
                                                LocalDate.of(2024, 9, 10), "Enhancement", "security/audit", "Medium",
                                                "JIRA-1240", "Run security scans and fix identified vulnerabilities.",
                                                3.0, LocalDate.now().minusDays(12), dev3)));

                // Create Bugs
                com.example.devtrack.model.Bug bug1 = new com.example.devtrack.model.Bug(
                                "Login button unresponsive on mobile",
                                "Clicking login does nothing on iOS Safari.", "Open", "High",
                                "Critical", dev2, tester, LocalDate.now().minusDays(2),
                                LocalDate.now());
                bug1.setChangeRequest(cr1);

                com.example.devtrack.model.Bug bug2 = new com.example.devtrack.model.Bug(
                                "Dashboard charts not loading",
                                "500 Error when loading analytics.", "In Progress", "Critical",
                                "Critical", dev1, tester, LocalDate.now().minusDays(1),
                                LocalDate.now());
                bug2.setChangeRequest(cr1);

                com.example.devtrack.model.Bug bug3 = new com.example.devtrack.model.Bug(
                                "Typo in welcome message",
                                "Says 'Welcom' instead of 'Welcome'.", "Resolved", "Low", "SR", dev3,
                                tester, LocalDate.now().minusDays(5), LocalDate.now().minusDays(1));
                bug3.setChangeRequest(cr2);

                com.example.devtrack.model.Bug bug4 = new com.example.devtrack.model.Bug(
                                "Profile image upload fails",
                                "Uploads > 2MB fail silently.", "Open", "Medium", "Enhancement", dev1,
                                tester, LocalDate.now(), LocalDate.now());
                bug4.setChangeRequest(cr3);

                // Add more bugs for variety and testing filters
                com.example.devtrack.model.Bug bug5 = new com.example.devtrack.model.Bug(
                                "Search not working",
                                "Search returns no results.", "Open", "High", "Bug", dev2,
                                admin, LocalDate.now(), LocalDate.now());
                bug5.setChangeRequest(cr1);

                bugRepository.saveAll(Arrays.asList(bug1, bug2, bug3, bug4, bug5));

                // Add comments to bugs manually since constructor doesn't support it yet
                List<com.example.devtrack.model.Bug> bugs = bugRepository.findAll();
                if (!bugs.isEmpty()) {
                        com.example.devtrack.model.Bug b1 = bugs.get(0);
                        b1.setComments(
                                        "[2024-11-20 10:00] Test User (TESTING): Reproduced on iPhone 12.\n[2024-11-21 09:30] Maria Lopez (DEVELOPER): Investigating touch events.");
                        bugRepository.save(b1);
                }

                // Add comments to tasks
                List<Task> tasks = taskRepository.findAll();
                if (!tasks.isEmpty()) {
                        Task task1 = tasks.get(0);
                        task1.setComments(
                                        "[2024-11-15 14:00] Alex Johnson (DEVELOPER): Started working on the backend API.\n[2024-11-18 11:00] Admin User (ADMIN): Please ensure we handle edge cases for invalid inputs.");
                        taskRepository.save(task1);
                }
        }
}
