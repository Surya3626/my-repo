package com.example.devtrack.controller;

import com.example.devtrack.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.example.devtrack.repository.UserRepository userRepository;

    @GetMapping("/login")
    public String login(jakarta.servlet.http.HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("JWT_TOKEN".equals(cookie.getName())) {
                    String token = cookie.getValue();
                    try {
                        String username = jwtUtil.extractUsername(token);
                        com.example.devtrack.model.User user = userRepository.findByUserId(username).orElse(null);

                        if (user != null) {
                            if (user.getRoles().contains(com.example.devtrack.model.Role.TESTING)) {
                                return "redirect:/bug-manager";
                            } else {
                                return "redirect:/";
                            }
                        }
                    } catch (Exception e) {
                        // Token invalid, proceed to login
                    }
                }
            }
        }
        return "login";
    }

    @PostMapping("/auth/login")
    public String createToken(@RequestParam String userId, @RequestParam String password,
            HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(userId, password));

            final UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            final String jwt = jwtUtil.generateToken(userDetails);

            Cookie cookie = new Cookie("JWT_TOKEN", jwt);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60); // 1 hour
            response.addCookie(cookie);

            // Redirect based on role
            if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_TESTING"))) {
                return "redirect:/bug-manager";
            } else {
                return "redirect:/"; // Admin and Developer go to Home
            }

        } catch (Exception e) {
            return "redirect:/login?error=true";
        }
    }

    @PostMapping("/logout")
    public String logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("JWT_TOKEN", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return "redirect:/login";
    }
}
