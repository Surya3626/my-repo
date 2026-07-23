package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.AddonItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddonItemRepository extends JpaRepository<AddonItem, Long> {
    List<AddonItem> findByActiveTrue();
    List<AddonItem> findByCategoryAndActiveTrue(String category);
}
