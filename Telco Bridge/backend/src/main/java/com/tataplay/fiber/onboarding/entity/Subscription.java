package com.tataplay.fiber.onboarding.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private BroadbandPlan plan;

    @Column(nullable = false)
    private String status; // PENDING_PAYMENT, ACTIVE, SUSPENDED, EXPIRED

    @Column(name = "billing_type")
    private String billingType; // PREPAID, POSTPAID

    @Column(name = "customer_category")
    private String customerCategory; // RETAIL, ENTERPRISE

    @Column(name = "billing_cycle_months")
    private Integer billingCycleMonths; // 1, 3, 6, 12

    @Column(name = "credit_period_days")
    private Integer creditPeriodDays; // 0, 15, 30, 60

    @Column(name = "po_number")
    private String poNumber;

    @Column(name = "corporate_gstin")
    private String corporateGstin;

    @Column(name = "applied_coupon")
    private String appliedCoupon;

    @Column(name = "selected_addons")
    private String selectedAddons; // Comma-separated addon IDs or JSON

    @Column(name = "security_deposit")
    private Double securityDeposit;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;
}
