package com.tataplay.fiber.onboarding.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Mobile number must be a valid 10-digit Indian number")
    private String mobileNumber;

    @NotBlank(message = "Email address is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    private String houseNumber;
    private String addressLine1;
    private String addressLine2;
    private String society;
    private String street;
    private String landmark;
    private String area;
    private String city;
    private String state;
    private String pincode;
    private Double latitude;
    private Double longitude;
}
