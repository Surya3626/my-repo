package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String role;
    private Set<String> assignedCities;
    private boolean isGlobalAdmin;
    private boolean active;
}
