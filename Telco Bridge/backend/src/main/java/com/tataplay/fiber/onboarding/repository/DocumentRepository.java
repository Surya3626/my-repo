package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByCustomerId(Long customerId);
}
