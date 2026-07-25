package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.*;
import com.tataplay.fiber.onboarding.entity.OnboardingChannel;
import com.tataplay.fiber.onboarding.entity.OnboardingStep;
import com.tataplay.fiber.onboarding.entity.PerformedByType;
import com.tataplay.fiber.onboarding.service.OnboardingJourneyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for the onboarding journey & step audit layer.
 *
 * All step business logic remains in the existing step-specific service classes.
 * This controller is the wiring layer only.
 */
@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingJourneyController {

    private final OnboardingJourneyService journeyService;

    /**
     * Start a new onboarding journey.
     * Body: { prospectMobile, channel, actorId }
     */
    private boolean isUserAdmin(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private String resolveActorId(Authentication auth, String requestActorId, String fallbackMobile) {
        if (requestActorId != null && !requestActorId.isBlank()) return requestActorId;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return fallbackMobile != null ? fallbackMobile : "CUSTOMER";
    }

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<OnboardingJourneyDto>> startJourney(
            @Valid @RequestBody StartJourneyRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = isUserAdmin(auth);
        PerformedByType actorType = resolveActorType(request.getChannel(), isAdmin);
        String actorId = resolveActorId(auth, request.getActorId(), request.getProspectMobile());

        OnboardingJourneyDto dto = journeyService.startJourney(
                request.getProspectMobile(), request.getChannel(), actorType, actorId);

        return ResponseEntity.ok(ApiResponse.success("Onboarding journey started", dto));
    }

    @GetMapping("/{journeyId}")
    public ResponseEntity<ApiResponse<OnboardingJourneyDto>> getJourney(@PathVariable Long journeyId) {
        return ResponseEntity.ok(ApiResponse.success("Journey retrieved", journeyService.getJourney(journeyId)));
    }

    @PostMapping("/{journeyId}/steps/{step}/start")
    public ResponseEntity<ApiResponse<OnboardingJourneyDto>> startStep(
            @PathVariable Long journeyId,
            @PathVariable OnboardingStep step,
            @RequestBody(required = false) CompleteStepRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = isUserAdmin(auth);
        OnboardingJourneyDto current = journeyService.getJourney(journeyId);
        PerformedByType actorType = resolveActorType(current.getChannel(), isAdmin);
        String actorId = resolveActorId(auth, request != null ? request.getActorId() : null, current.getProspectMobile());

        OnboardingJourneyDto dto = journeyService.startStep(journeyId, step, actorType, actorId);
        return ResponseEntity.ok(ApiResponse.success("Step " + step + " started", dto));
    }

    @PostMapping("/{journeyId}/steps/{step}/complete")
    public ResponseEntity<ApiResponse<OnboardingJourneyDto>> completeStep(
            @PathVariable Long journeyId,
            @PathVariable OnboardingStep step,
            @RequestBody(required = false) CompleteStepRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = isUserAdmin(auth);
        OnboardingJourneyDto current = journeyService.getJourney(journeyId);
        PerformedByType actorType = resolveActorType(current.getChannel(), isAdmin);
        String actorId = resolveActorId(auth, request != null ? request.getActorId() : null, current.getProspectMobile());
        String payload = request != null ? request.getPayloadJson() : null;

        OnboardingJourneyDto dto = journeyService.completeStep(journeyId, step, actorType, actorId, payload);
        return ResponseEntity.ok(ApiResponse.success("Step " + step + " completed", dto));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> checkJourney(@RequestParam String mobile) {
        if (mobile == null || mobile.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mobile number is required", null));
        }
        try {
            OnboardingJourneyDto dto = journeyService.resumeByMobile(mobile);
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("exists", true);
            data.put("journeyId", dto.getJourneyId());
            data.put("currentStep", dto.getCurrentStep());
            data.put("status", dto.getStatus());
            return ResponseEntity.ok(ApiResponse.success("Active journey found", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No active onboarding journey found for mobile: " + mobile, "JOURNEY_NOT_FOUND"));
        }
    }

    @PostMapping("/resume")
    public ResponseEntity<ApiResponse<OnboardingJourneyDto>> resumeJourney(
            @RequestBody java.util.Map<String, String> body) {
        String prospectMobile = body.get("prospectMobile");
        if (prospectMobile == null || prospectMobile.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("prospectMobile is required", null));
        }
        try {
            OnboardingJourneyDto dto = journeyService.resumeByMobile(prospectMobile);
            return ResponseEntity.ok(ApiResponse.success("Journey resumed", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No active onboarding journey found for mobile: " + prospectMobile, "JOURNEY_NOT_FOUND"));
        }
    }

    @PostMapping("/{journeyId}/abandon")
    public ResponseEntity<ApiResponse<OnboardingJourneyDto>> abandonJourney(
            @PathVariable Long journeyId,
            @RequestBody(required = false) java.util.Map<String, String> body) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = isUserAdmin(auth);
        OnboardingJourneyDto current = journeyService.getJourney(journeyId);
        PerformedByType actorType = resolveActorType(current.getChannel(), isAdmin);
        String requestActorId = body != null ? body.get("actorId") : null;
        String actorId = resolveActorId(auth, requestActorId, current.getProspectMobile());

        OnboardingJourneyDto dto = journeyService.abandonJourney(journeyId, actorType, actorId);
        return ResponseEntity.ok(ApiResponse.success("Journey abandoned — customer can resume", dto));
    }

    private PerformedByType resolveActorType(OnboardingChannel channel, boolean isAdmin) {
        if (isAdmin) return PerformedByType.SALES_AGENT;
        return PerformedByType.CUSTOMER;
    }
}

