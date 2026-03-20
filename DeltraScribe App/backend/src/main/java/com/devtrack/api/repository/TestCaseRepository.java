package com.devtrack.api.repository;

import com.devtrack.api.model.TestCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    Page<TestCase> findAll(Pageable pageable);
    Page<TestCase> findByStatusNot(String status, Pageable pageable);
}
