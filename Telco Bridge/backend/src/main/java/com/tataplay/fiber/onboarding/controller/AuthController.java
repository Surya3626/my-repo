package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.dto.AuthRequest;

import com.tataplay.fiber.onboarding.entity.*;
import com.tataplay.fiber.onboarding.repository.AdminUserRepository;
import com.tataplay.fiber.onboarding.repository.CityMasterRepository;
import com.tataplay.fiber.onboarding.security.JwtTokenProvider;
import com.tataplay.fiber.onboarding.service.CustomerService;
import com.tataplay.fiber.onboarding.service.JourneyService;
import com.tataplay.fiber.onboarding.service.OtpService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final OtpService otpService;
    private final CustomerService customerService;
    private final JourneyService journeyService;
    private final JwtTokenProvider tokenProvider;
    private final AdminUserRepository adminUserRepository;
    private final CityMasterRepository cityMasterRepository;

    @PostConstruct
    public void seedMasterDataAndAdmins() {
        // 1. Seed Cities if empty
        if (cityMasterRepository.count() == 0) {
            cityMasterRepository.save(CityMaster.builder()
                    .cityName("Mumbai").stateName("Maharashtra").regionZone("WEST")
                    .pincodes(new HashSet<>(Arrays.asList("400001", "400002", "400050")))
                    .build());
            cityMasterRepository.save(CityMaster.builder()
                    .cityName("Navi Mumbai").stateName("Maharashtra").regionZone("WEST")
                    .pincodes(new HashSet<>(Arrays.asList("400703", "400705", "400706")))
                    .build());
            cityMasterRepository.save(CityMaster.builder()
                    .cityName("Pune").stateName("Maharashtra").regionZone("WEST")
                    .pincodes(new HashSet<>(Arrays.asList("411001", "411002", "411014")))
                    .build());
            cityMasterRepository.save(CityMaster.builder()
                    .cityName("New Delhi").stateName("Delhi").regionZone("NORTH")
                    .pincodes(new HashSet<>(Arrays.asList("110001", "110002", "110020")))
                    .build());
            cityMasterRepository.save(CityMaster.builder()
                    .cityName("Bengaluru").stateName("Karnataka").regionZone("SOUTH")
                    .pincodes(new HashSet<>(Arrays.asList("560001", "560002", "560034")))
                    .build());
            cityMasterRepository.save(CityMaster.builder()
                    .cityName("Surat").stateName("Gujarat").regionZone("WEST")
                    .pincodes(new HashSet<>(Arrays.asList("395001", "395003")))
                    .build());
        }

        // 2. Seed Admin Users if empty
        if (adminUserRepository.count() == 0) {
            // Super Admin
            adminUserRepository.save(AdminUser.builder()
                    .username("admin").password("admin123")
                    .fullName("Global System Administrator").email("admin@tataplayfiber.com")
                    .role(Role.ROLE_ADMIN).isGlobalAdmin(true)
                    .assignedCities(new HashSet<>(Arrays.asList("ALL")))
                    .build());

            // Regional Admin West Zone (Multi-City: Mumbai, Navi Mumbai, Pune, Surat)
            adminUserRepository.save(AdminUser.builder()
                    .username("admin_west").password("admin123")
                    .fullName("Rajesh Verma (West Zone Manager)")
                    .email("r.verma@tataplayfiber.com")
                    .role(Role.ROLE_ADMIN).isGlobalAdmin(false)
                    .assignedCities(new HashSet<>(Arrays.asList("Mumbai", "Navi Mumbai", "Pune", "Surat")))
                    .build());

            // Regional Admin North Zone (New Delhi)
            adminUserRepository.save(AdminUser.builder()
                    .username("admin_north").password("admin123")
                    .fullName("Amit Sharma (North Zone Lead)")
                    .email("a.sharma@tataplayfiber.com")
                    .role(Role.ROLE_ADMIN).isGlobalAdmin(false)
                    .assignedCities(new HashSet<>(Arrays.asList("New Delhi")))
                    .build());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Customer>> registerLead(@RequestBody AuthRequest request) {
        Customer customer = customerService.registerOrResume(
                request.getFirstName(),
                request.getLastName(),
                request.getMobileNumber(),
                request.getEmail()
        );
        return ResponseEntity.ok(ApiResponse.success("Lead registered successfully", customer));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<String>> sendOtp(@RequestBody AuthRequest request) {
        otpService.sendOtp(request.getMobileNumber());
        return ResponseEntity.ok(ApiResponse.success("OTP sent to mobile: " + request.getMobileNumber(), "SUCCESS"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@RequestBody AuthRequest request) {
        boolean isValid = otpService.verifyOtp(request.getMobileNumber(), request.getOtp());
        if (!isValid) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired OTP", null));
        }

        String jwt = tokenProvider.generateToken(request.getMobileNumber(), "ROLE_CUSTOMER");
        Customer customer = customerService.getByMobileNumber(request.getMobileNumber());
        JourneyTracking tracking = journeyService.getProgress(request.getMobileNumber());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("token", jwt);
        responseData.put("customer", customer);
        responseData.put("progress", tracking);

        return ResponseEntity.ok(ApiResponse.success("OTP verification successful", responseData));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminLogin(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");

        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(username);

        if (adminOpt.isPresent()) {
            AdminUser admin = adminOpt.get();
            if (admin.getPassword().equals(password) && admin.isActive()) {
                String jwt = tokenProvider.generateToken(username, "ROLE_ADMIN");
                Map<String, Object> data = new HashMap<>();
                data.put("token", jwt);
                data.put("username", admin.getUsername());
                data.put("fullName", admin.getFullName());
                data.put("assignedCities", admin.getAssignedCities());
                data.put("isGlobalAdmin", admin.isGlobalAdmin());

                return ResponseEntity.ok(ApiResponse.success("Admin login successful", data));
            }
        } else if ("admin".equals(username) && "admin123".equals(password)) {
            // Fallback for default super admin
            String jwt = tokenProvider.generateToken(username, "ROLE_ADMIN");
            Map<String, Object> data = new HashMap<>();
            data.put("token", jwt);
            data.put("username", username);
            data.put("assignedCities", Collections.singleton("ALL"));
            data.put("isGlobalAdmin", true);
            return ResponseEntity.ok(ApiResponse.success("Admin login successful", data));
        }

        return ResponseEntity.badRequest().body(ApiResponse.error("Invalid Admin credentials", null));
    }

    @GetMapping("/journey")
    public ResponseEntity<ApiResponse<JourneyTracking>> getJourney() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        JourneyTracking tracking = journeyService.getProgress(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Journey tracking retrieved successfully", tracking));
    }

    @PostMapping("/journey")
    public ResponseEntity<ApiResponse<JourneyTracking>> saveJourney(@RequestBody Map<String, Object> payload) {
        String page = (String) payload.get("page");
        Integer step = (Integer) payload.get("step");
        String draftData = (String) payload.get("draftData");
        String sessionId = (String) payload.get("sessionId");
        String mobileNumber = (String) payload.get("mobileNumber");
        String stepHistoryJson = (String) payload.get("stepHistoryJson");

        if (mobileNumber == null || mobileNumber.trim().isEmpty()) {
            mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        }

        JourneyTracking tracking = journeyService.saveProgress(
                mobileNumber, page, step != null ? step : 1, draftData, sessionId,
                "Web Browser", "Desktop", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.success("Journey saved successfully", tracking));
    }
}
