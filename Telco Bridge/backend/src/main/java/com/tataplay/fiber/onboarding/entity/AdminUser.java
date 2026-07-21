package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * AdminUser entity storing SOC Admin credentials, roles, and assigned cities (Geo-Tagging RBAC).
 * Supports multi-city assignment per admin user.
 */
@Entity
@Table(name = "admin_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    private String fullName;
    private String email;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.ROLE_ADMIN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_assigned_cities", joinColumns = @JoinColumn(name = "admin_user_id"))
    @Column(name = "city_name")
    @Builder.Default
    private Set<String> assignedCities = new HashSet<>();

    @Builder.Default
    private boolean isGlobalAdmin = false; // Super admin with cross-region access

    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
