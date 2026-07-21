package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.service.FeasibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/feasibility")
@RequiredArgsConstructor
public class FeasibilityController {

    private final FeasibilityService feasibilityService;

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkFeasibility(
            @RequestParam String pincode,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        boolean feasible = feasibilityService.checkFeasibility(pincode, latitude, longitude);
        
        Map<String, Object> data = new HashMap<>();
        data.put("pincode", pincode);
        data.put("feasible", feasible);
        
        if (feasible) {
            return ResponseEntity.ok(ApiResponse.success("Location is feasible for TelcoBridge Broadband", data));

        } else {
            return ResponseEntity.ok(ApiResponse.success("Network expansion under progress. Feasibility failed.", data));
        }
    }

    @PostMapping("/expansion")
    public ResponseEntity<ApiResponse<Void>> registerExpansion(
            @RequestParam(required = false) String mobileNumber,
            @RequestParam String email,
            @RequestParam String pincode) {

        feasibilityService.registerForExpansion(mobileNumber, email, pincode);
        return ResponseEntity.ok(ApiResponse.success("Successfully registered for network expansion alerts."));
    }
}
