package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/**
 * CityMaster entity storing operational cities and pincodes.
 * Enables dynamic city addition with zero code changes.
 */
@Entity
@Table(name = "city_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CityMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String cityName;

    @Column(nullable = false)
    private String stateName;

    private String regionZone; // WEST, NORTH, SOUTH, EAST

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "city_pincodes", joinColumns = @JoinColumn(name = "city_id"))
    @Column(name = "pincode")
    @Builder.Default
    private Set<String> pincodes = new HashSet<>();

    @Builder.Default
    private boolean active = true;
}
