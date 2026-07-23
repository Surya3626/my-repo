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
    private Double price; // Base monthly price for backward compatibility

    @Column(name = "monthly_price")
    private Double monthlyPrice;

    @Column(name = "quarterly_price")
    private Double quarterlyPrice;

    @Column(name = "semi_annual_price")
    private Double semiAnnualPrice;

    @Column(name = "annual_price")
    private Double annualPrice;

    @Column(name = "validity_days", nullable = false)
    private Integer validityDays;

    @Column(length = 500)
    private String description;

    @Column(name = "tagline")
    private String tagline;

    @Column(name = "badge_text")
    private String badgeText;

    @Column(name = "installation_charges", nullable = false)
    private Double installationCharges;

    @Column(name = "router_included", nullable = false)
    private Boolean routerIncluded;

    @Column(name = "ott_benefits")
    private String ottBenefits; // Comma separated list of OTT apps

    @Column(nullable = false)
    private Boolean recommended;

    @Column(name = "category")
    private String category; // STARTER, VALUE, STREAMER, GAMER, ENTERPRISE_LEASED

    @Column(name = "target_segment")
    private String targetSegment; // RETAIL, ENTERPRISE, BOTH

    @Column(name = "technology")
    private String technology; // FTTH_WIFI5, FTTH_WIFI6, MESH_GIGABIT, DEDICATED_ILL

    @Column(name = "fup_limit_gb")
    private Integer fupLimitGb; // e.g. 3300 GB

    @Column(name = "symmetric_speed")
    private Boolean symmetricSpeed; // 1:1 speed guarantee

    @Column(name = "security_deposit")
    private Double securityDeposit; // Refundable security deposit
}
