package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.dto.OnboardingJourneyDto;
import com.tataplay.fiber.onboarding.dto.StepAuditDto;
import com.tataplay.fiber.onboarding.entity.*;
import com.tataplay.fiber.onboarding.repository.CustomerRepository;
import com.tataplay.fiber.onboarding.repository.OnboardingJourneyRepository;
import com.tataplay.fiber.onboarding.repository.OnboardingStepAuditRepository;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.OnboardingJourneyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingJourneyServiceImpl implements OnboardingJourneyService {

    private final OnboardingJourneyRepository journeyRepository;
    private final OnboardingStepAuditRepository auditRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    // ─── Canonical step orders per channel ──────────────────────────────────────

    private static final List<OnboardingStep> SELF_ORDER = List.of(
            OnboardingStep.FEASIBILITY_CHECK,
            OnboardingStep.CUSTOMER_DETAILS,
            OnboardingStep.OTP_VERIFICATION,
            OnboardingStep.DOCUMENT_COLLECTION,
            OnboardingStep.BUILD_PROFILE,
            OnboardingStep.PLANS_ADDONS_COUPONS,
            OnboardingStep.PAYMENT,
            OnboardingStep.DOCUMENT_MIGRATION,
            OnboardingStep.CUSTOMER_CONSENT,
            OnboardingStep.CAF_GENERATION,
            OnboardingStep.EKYC_INITIATION
    );

    private static final List<OnboardingStep> SALES_AGENT_ORDER = List.of(
            OnboardingStep.FEASIBILITY_CHECK,
            OnboardingStep.CUSTOMER_DETAILS,
            // OTP_VERIFICATION is SKIPPED for SALES_AGENT
            OnboardingStep.DOCUMENT_COLLECTION,
            OnboardingStep.BUILD_PROFILE,
            OnboardingStep.PLANS_ADDONS_COUPONS,
            OnboardingStep.PAYMENT,
            OnboardingStep.DOCUMENT_MIGRATION,
            OnboardingStep.CUSTOMER_CONSENT,
            OnboardingStep.CAF_GENERATION,
            OnboardingStep.EKYC_INITIATION
    );

    private List<OnboardingStep> stepOrder(OnboardingChannel channel) {
        return channel == OnboardingChannel.SALES_AGENT ? SALES_AGENT_ORDER : SELF_ORDER;
    }

    private OnboardingStep nextStep(OnboardingChannel channel, OnboardingStep current) {
        List<OnboardingStep> order = stepOrder(channel);
        int idx = order.indexOf(current);
        return (idx >= 0 && idx < order.size() - 1) ? order.get(idx + 1) : null;
    }

    // ─── Service methods ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OnboardingJourneyDto startJourney(String prospectMobile, OnboardingChannel channel,
                                             PerformedByType actorType, String actorId) {
        OnboardingStep firstStep = stepOrder(channel).get(0);

        String effectiveMobile = (prospectMobile != null && !prospectMobile.isBlank())
                ? prospectMobile : "PROSPECT-" + System.currentTimeMillis();
        String effectiveActorId = (actorId != null && !actorId.isBlank())
                ? actorId : effectiveMobile;

        // If a real mobile number is provided, check if a journey already exists for this prospect
        if (prospectMobile != null && !prospectMobile.isBlank() && !prospectMobile.startsWith("PROSPECT-")) {
            Optional<OnboardingJourney> existingOpt = journeyRepository.findTopByProspectMobileOrderByCreatedAtDesc(prospectMobile);
            if (existingOpt.isPresent()) {
                OnboardingJourney existing = existingOpt.get();
                if (existing.getStatus() == JourneyStatus.ABANDONED) {
                    existing.setStatus(JourneyStatus.IN_PROGRESS);
                    existingRepositorySave(existing);
                }
                log.info("Resume existing journey {} for mobile {} at step {} (status {})",
                        existing.getId(), prospectMobile, existing.getCurrentStep(), existing.getStatus());
                return toDto(existing);
            }
        }

        OnboardingJourney journey = OnboardingJourney.builder()
                .prospectMobile(effectiveMobile)
                .channel(channel)
                .currentStep(firstStep)
                .status(JourneyStatus.IN_PROGRESS)
                .lastActorId(effectiveActorId)
                .lastActorType(actorType)
                .build();
        journey = journeyRepository.save(journey);

        // For SALES_AGENT channel, auto-skip OTP
        if (channel == OnboardingChannel.SALES_AGENT) {
            writeAudit(journey, OnboardingStep.OTP_VERIFICATION, StepAuditStatus.SKIPPED,
                    PerformedByType.SYSTEM, "SYSTEM", null);
        }

        writeAudit(journey, firstStep, StepAuditStatus.STARTED, actorType, effectiveActorId, null);

        auditService.log("JOURNEY_STARTED",
                channel + " onboarding journey started for " + effectiveMobile + " by " + actorType + " [" + effectiveActorId + "]",
                effectiveMobile);

        return toDto(journey);
    }

    private void existingRepositorySave(OnboardingJourney existing) {
        journeyRepository.save(existing);
    }


    @Override
    @Transactional
    public OnboardingJourneyDto startStep(Long journeyId, OnboardingStep step,
                                         PerformedByType actorType, String actorId) {
        OnboardingJourney journey = findJourney(journeyId);
        updateJourneyActor(journey, actorType, actorId);
        writeAudit(journey, step, StepAuditStatus.STARTED, actorType, actorId, null);
        return toDto(journeyRepository.save(journey));
    }

    @Override
    @Transactional
    public OnboardingJourneyDto completeStep(Long journeyId, OnboardingStep step,
                                            PerformedByType actorType, String actorId,
                                            String payloadJson) {
        OnboardingJourney journey = findJourney(journeyId);
        updateJourneyActor(journey, actorType, actorId);

        // Check if payload contains updated mobileNumber and update journey prospectMobile
        if (payloadJson != null && payloadJson.contains("mobileNumber")) {
            try {
                int idx = payloadJson.indexOf("\"mobileNumber\"");
                if (idx != -1) {
                    int valStart = payloadJson.indexOf("\"", idx + 14) + 1;
                    int valEnd = payloadJson.indexOf("\"", valStart);
                    if (valStart > 0 && valEnd > valStart) {
                        String extractedMobile = payloadJson.substring(valStart, valEnd);
                        if (!extractedMobile.isBlank() && extractedMobile.length() == 10) {
                            journey.setProspectMobile(extractedMobile);
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        writeAudit(journey, step, StepAuditStatus.COMPLETED, actorType, actorId, payloadJson);

        // If PAYMENT just completed, auto-run Document Migration (backend-only)
        if (step == OnboardingStep.PAYMENT) {
            writeAudit(journey, OnboardingStep.DOCUMENT_MIGRATION, StepAuditStatus.STARTED,
                    PerformedByType.SYSTEM, "SYSTEM", null);
            writeAudit(journey, OnboardingStep.DOCUMENT_MIGRATION, StepAuditStatus.COMPLETED,
                    PerformedByType.SYSTEM, "SYSTEM", "{\"migrated\":true}");
            log.info("Document migration auto-completed (system) for journey {}", journeyId);
        }

        // Advance currentStep
        OnboardingStep next = nextStep(journey.getChannel(), step);
        // Skip DOCUMENT_MIGRATION in the UI step pointer (it's backend-only)
        if (next == OnboardingStep.DOCUMENT_MIGRATION) {
            next = nextStep(journey.getChannel(), OnboardingStep.DOCUMENT_MIGRATION);
        }

        if (next == null) {
            journey.setCurrentStep(null);
            journey.setStatus(JourneyStatus.COMPLETED);

            // Sync Customer entity status in database
            if (journey.getProspectMobile() != null) {
                customerRepository.findByMobileNumber(journey.getProspectMobile()).ifPresent(c -> {
                    c.setStatus(CustomerStatus.COMPLETED);
                    customerRepository.save(c);
                });
            }

            auditService.log("JOURNEY_COMPLETED", "Onboarding journey completed for " + journey.getProspectMobile(), journey.getProspectMobile());
        } else {
            journey.setCurrentStep(next);
        }

        return toDto(journeyRepository.save(journey));
    }

    @Override
    @Transactional
    public OnboardingJourneyDto skipStep(Long journeyId, OnboardingStep step,
                                         PerformedByType actorType, String actorId) {
        OnboardingJourney journey = findJourney(journeyId);
        writeAudit(journey, step, StepAuditStatus.SKIPPED, actorType, actorId, null);
        return toDto(journey);
    }

    @Override
    @Transactional
    public OnboardingJourneyDto failStep(Long journeyId, OnboardingStep step,
                                         PerformedByType actorType, String actorId,
                                         String reason) {
        OnboardingJourney journey = findJourney(journeyId);
        writeAudit(journey, step, StepAuditStatus.FAILED, actorType, actorId, reason);
        auditService.log("STEP_FAILED", step + " failed for journey " + journeyId + ": " + reason, journey.getProspectMobile());
        return toDto(journey);
    }

    @Override
    @Transactional
    public OnboardingJourneyDto abandonJourney(Long journeyId, PerformedByType actorType, String actorId) {
        OnboardingJourney journey = findJourney(journeyId);
        journey.setStatus(JourneyStatus.ABANDONED);
        updateJourneyActor(journey, actorType, actorId);
        auditService.log("JOURNEY_ABANDONED",
                "Journey " + journeyId + " abandoned at step " + journey.getCurrentStep() + " by " + actorType + " [" + actorId + "]",
                journey.getProspectMobile());
        return toDto(journeyRepository.save(journey));
    }

    @Override
    public OnboardingJourneyDto getJourney(Long journeyId) {
        return toDto(findJourney(journeyId));
    }

    @Override
    public OnboardingJourneyDto resumeByMobile(String prospectMobile) {
        OnboardingJourney journey = journeyRepository
                .findTopByProspectMobileOrderByCreatedAtDesc(prospectMobile)
                .orElseThrow(() -> new IllegalArgumentException("No onboarding journey found for mobile: " + prospectMobile));
        // Mark as IN_PROGRESS if it was abandoned (customer resumes)
        if (journey.getStatus() == JourneyStatus.ABANDONED) {
            journey.setStatus(JourneyStatus.IN_PROGRESS);
            journeyRepository.save(journey);
        }
        return toDto(journey);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private OnboardingJourney findJourney(Long id) {
        return journeyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Journey not found: " + id));
    }

    private void updateJourneyActor(OnboardingJourney journey, PerformedByType actorType, String actorId) {
        journey.setLastActorType(actorType);
        journey.setLastActorId(actorId);
    }

    private OnboardingStepAudit writeAudit(OnboardingJourney journey, OnboardingStep step,
                                            StepAuditStatus status, PerformedByType performedByType,
                                            String performedById, String payload) {
        OnboardingStepAudit audit = OnboardingStepAudit.builder()
                .journey(journey)
                .step(step)
                .status(status)
                .performedByType(performedByType)
                .performedById(performedById)
                .performedAt(LocalDateTime.now())
                .payloadSnapshot(payload)
                .build();
        return auditRepository.save(audit);
    }

    private OnboardingJourneyDto toDto(OnboardingJourney journey) {
        List<OnboardingStepAudit> audits = auditRepository.findByJourneyOrderByPerformedAtAsc(journey);

        List<StepAuditDto> auditDtos = audits.stream()
                .map(a -> StepAuditDto.builder()
                        .id(a.getId())
                        .step(a.getStep())
                        .status(a.getStatus())
                        .performedByType(a.getPerformedByType())
                        .performedById(a.getPerformedById())
                        .performedAt(a.getPerformedAt())
                        .payloadSnapshot(a.getPayloadSnapshot())
                        .build())
                .collect(Collectors.toList());

        // Build step→payload map for form hydration on resume
        Map<String, String> stepPayloads = new LinkedHashMap<>();
        audits.stream()
                .filter(a -> a.getStatus() == StepAuditStatus.COMPLETED && a.getPayloadSnapshot() != null)
                .forEach(a -> stepPayloads.put(a.getStep().name(), a.getPayloadSnapshot()));

        OnboardingStep effectiveStep = journey.getCurrentStep();
        if (effectiveStep == null || journey.getStatus() == JourneyStatus.COMPLETED) {
            effectiveStep = OnboardingStep.EKYC_INITIATION;
        }

        return OnboardingJourneyDto.builder()
                .journeyId(journey.getId())
                .prospectMobile(journey.getProspectMobile())
                .channel(journey.getChannel())
                .currentStep(effectiveStep)
                .status(journey.getStatus())
                .lastActorId(journey.getLastActorId())
                .lastActorType(journey.getLastActorType())
                .createdAt(journey.getCreatedAt())
                .updatedAt(journey.getUpdatedAt())
                .auditTrail(auditDtos)
                .stepPayloads(stepPayloads)
                .build();
    }

}
