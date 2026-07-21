package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.CityMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityMasterRepository extends JpaRepository<CityMaster, Long> {
    Optional<CityMaster> findByCityNameIgnoreCase(String cityName);
    List<CityMaster> findByActiveTrue();
}
