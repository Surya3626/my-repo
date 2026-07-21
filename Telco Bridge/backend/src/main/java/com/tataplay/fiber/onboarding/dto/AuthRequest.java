package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRequest {
    private String mobileNumber;
    private String otp;
    private String firstName;
    private String lastName;
    private String email;
}
