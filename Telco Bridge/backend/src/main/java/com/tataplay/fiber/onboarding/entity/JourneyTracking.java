package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "journey_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JourneyTracking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mobile_number", nullable = false, unique = true)
    private String mobileNumber;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "current_page", nullable = false)
    private String currentPage;

    @Column(name = "current_step", nullable = false)
    private Integer currentStep;

    private String browser;
    private String device;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "last_active_at", nullable = false)
    private LocalDateTime lastActiveAt;

    @Lob
    @Column(name = "draft_data", length = 5000)
    private String draftData; // Serialized JSON payload containing state variables

    @Column(name = "last_performed_by_role")
    private String lastPerformedByRole; // SOC_ADMIN or CUSTOMER

    @Column(name = "last_performed_by_id")
    private String lastPerformedById; // Admin ID or Customer/Prospect ID

    @Column(name = "last_performed_by_name")
    private String lastPerformedByName; // Display name of actor

    @Lob
    @Column(name = "step_history_json", length = 8000)
    private String stepHistoryJson; // JSON array of step audit history records
}
