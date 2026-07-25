package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Single source of truth for where a customer's onboarding is in the flow.
 *
 * <ul>
 *   <li>One row per prospect/customer.</li>
 *   <li>currentStep always reflects the next incomplete step (furthest completed + 1).</li>
 *   <li>All step transitions are recorded in OnboardingStepAudit (append-only).</li>
 * </ul>
 */
@Entity
@Table(name = "onboarding_journeys")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingJourney {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Customer's mobile number used as the prospect identifier. */
    @Column(name = "prospect_mobile", nullable = false)
    private String prospectMobile;

    /** Which portal/channel started this journey. */
    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    private OnboardingChannel channel;

    /**
     * The next step that needs to be completed.
     * Advances on every completeStep() call.
     * Null means the journey is COMPLETED.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "current_step")
    private OnboardingStep currentStep;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private JourneyStatus status = JourneyStatus.IN_PROGRESS;

    /** ID of the actor who last touched this journey (agentId or mobile number). */
    @Column(name = "last_actor_id")
    private String lastActorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_actor_type")
    private PerformedByType lastActorType;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
