package com.devtrack.api.controller;

import com.devtrack.api.model.User;
import com.devtrack.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('DEVADMIN', 'TESTADMIN', 'DEVELOPER', 'TESTER')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
