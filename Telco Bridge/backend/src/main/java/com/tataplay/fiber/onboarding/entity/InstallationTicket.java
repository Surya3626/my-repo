package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "installation_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstallationTicket extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "ticket_number", unique = true, nullable = false)
    private String ticketNumber;

    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate;

    @Column(name = "engineer_name")
    private String engineerName;

    @Column(name = "engineer_phone")
    private String engineerPhone;

    @Column(name = "engineer_latitude")
    private Double engineerLatitude;

    @Column(name = "engineer_longitude")
    private Double engineerLongitude;

    @Column(nullable = false)
    private String status; // ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "expected_installation_date")
    private LocalDateTime expectedInstallationDate;
}
