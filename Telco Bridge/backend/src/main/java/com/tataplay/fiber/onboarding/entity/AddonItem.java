package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addon_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddonItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // HARDWARE, NETWORK, OTT, SECURITY

    @Column(name = "price_monthly", nullable = false)
    private Double priceMonthly;

    @Column(length = 500)
    private String description;

    @Column(name = "icon_name")
    private String iconName;

    @Column(nullable = false)
    private Boolean active;
}
