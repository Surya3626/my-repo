package com.devtrack.api.repository;

import com.devtrack.api.model.Bug;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugRepository extends JpaRepository<Bug, Long> {
    @Query("SELECT DISTINCT b FROM Bug b " +
           "LEFT JOIN FETCH b.bugTask " +
           "LEFT JOIN FETCH b.raisedBy " +
           "LEFT JOIN FETCH b.assignedDeveloper " +
           "LEFT JOIN FETCH b.workflow " +
           "LEFT JOIN FETCH b.tester")
    List<Bug> findAllOptimized();
}
