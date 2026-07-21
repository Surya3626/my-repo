package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "broadband_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BroadbandPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "speed_mbps", nullable = false)
    private Integer speedMbps;

    @Column(nullable = false)
    private Double price;

    @Column(name = "validity_days", nullable = false)
    private Integer validityDays;

    @Column(length = 500)
    private String description;

    @Column(name = "installation_charges", nullable = false)
    private Double installationCharges;

    @Column(name = "router_included", nullable = false)
    private Boolean routerIncluded;

    @Column(name = "ott_benefits")
    private String ottBenefits; // Comma separated list of OTT apps

    @Column(nullable = false)
    private Boolean recommended;
}
