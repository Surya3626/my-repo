package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Append-only audit log of every step transition in an onboarding journey.
 *
 * <ul>
 *   <li>Never update existing rows — always insert a new row.</li>
 *   <li>Every start, complete, skip, and fail produces a row.</li>
 *   <li>DOCUMENT_MIGRATION produces STARTED + COMPLETED rows with performedByType=SYSTEM,
 *       even though there is no UI step for it.</li>
 * </ul>
 */
@Entity
@Table(name = "onboarding_step_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingStepAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journey_id", nullable = false)
    private OnboardingJourney journey;

    @Enumerated(EnumType.STRING)
    @Column(name = "step", nullable = false)
    private OnboardingStep step;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StepAuditStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "performed_by_type", nullable = false)
    private PerformedByType performedByType;

    /** Agent ID, customer mobile, or "SYSTEM". */
    @Column(name = "performed_by_id")
    private String performedById;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    /**
     * Optional JSON snapshot of the data captured at this step (e.g. address, plan selection).
     * Used to hydrate forms on resume.
     */
    @Lob
    @Column(name = "payload_snapshot", length = 10000)
    private String payloadSnapshot;
}
