package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.entity.JourneyTracking;
import com.tataplay.fiber.onboarding.repository.JourneyTrackingRepository;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.JourneyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JourneyServiceImpl implements JourneyService {

    private final JourneyTrackingRepository journeyTrackingRepository;
    private final AuditService auditService;

    @Override
    @Transactional
    public JourneyTracking saveProgress(String mobileNumber, String page, int step, String draftData,
                                         String sessionId, String browser, String device, String ipAddress) {
        return saveProgressWithActor(mobileNumber, page, step, draftData, sessionId, browser, device, ipAddress, 
                                     "CUSTOMER", mobileNumber, "Customer (" + mobileNumber + ")", null);
    }

    @Override
    @Transactional
    public JourneyTracking saveProgressWithActor(String mobileNumber, String page, int step, String draftData,
                                                 String sessionId, String browser, String device, String ipAddress,
                                                 String role, String actorId, String actorName, String stepHistoryJson) {
        
        Optional<JourneyTracking> existingOpt = journeyTrackingRepository.findByMobileNumber(mobileNumber);
        JourneyTracking tracking;
        if (existingOpt.isPresent()) {
            tracking = existingOpt.get();
            tracking.setCurrentPage(page);
            tracking.setCurrentStep(step);
            tracking.setDraftData(draftData);
            tracking.setSessionId(sessionId);
            tracking.setBrowser(browser);
            tracking.setDevice(device);
            tracking.setIpAddress(ipAddress);
            tracking.setLastActiveAt(LocalDateTime.now());
            if (role != null) tracking.setLastPerformedByRole(role);
            if (actorId != null) tracking.setLastPerformedById(actorId);
            if (actorName != null) tracking.setLastPerformedByName(actorName);
            if (stepHistoryJson != null) tracking.setStepHistoryJson(stepHistoryJson);
        } else {
            tracking = JourneyTracking.builder()
                    .mobileNumber(mobileNumber)
                    .currentPage(page)
                    .currentStep(step)
                    .draftData(draftData)
                    .sessionId(sessionId)
                    .browser(browser)
                    .device(device)
                    .ipAddress(ipAddress)
                    .lastActiveAt(LocalDateTime.now())
                    .lastPerformedByRole(role != null ? role : "CUSTOMER")
                    .lastPerformedById(actorId != null ? actorId : mobileNumber)
                    .lastPerformedByName(actorName != null ? actorName : "Customer (" + mobileNumber + ")")
                    .stepHistoryJson(stepHistoryJson)
                    .build();
        }

        JourneyTracking saved = journeyTrackingRepository.save(tracking);
        String actorDesc = (role != null ? role : "USER") + " [" + (actorId != null ? actorId : mobileNumber) + "]";
        auditService.log("JOURNEY_STEP_SAVE", "Step " + step + " (" + page + ") saved by " + actorDesc, mobileNumber);
        return saved;
    }

    @Override
    public JourneyTracking getProgress(String mobileNumber) {
        return journeyTrackingRepository.findByMobileNumber(mobileNumber)
                .orElse(null); // Return null if no journey exists yet
    }

    @Override
    @Transactional
    public void clearProgress(String mobileNumber) {
        journeyTrackingRepository.findByMobileNumber(mobileNumber)
                .ifPresent(tracking -> {
                    journeyTrackingRepository.delete(tracking);
                    auditService.log("JOURNEY_CLEAR", "Cleared journey tracking progress on completion", mobileNumber);
                });
    }
}
