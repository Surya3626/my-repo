package com.devtrack.api.repository;

import com.devtrack.api.model.Bug;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query(value = "SELECT DISTINCT b FROM Bug b " +
           "LEFT JOIN FETCH b.bugTask " +
           "LEFT JOIN FETCH b.raisedBy " +
           "LEFT JOIN FETCH b.assignedDeveloper " +
           "LEFT JOIN FETCH b.workflow " +
           "LEFT JOIN FETCH b.tester",
           countQuery = "SELECT COUNT(b) FROM Bug b")
    Page<Bug> findAllOptimized(Pageable pageable);

    @Query(value = "SELECT DISTINCT b FROM Bug b " +
           "LEFT JOIN FETCH b.bugTask " +
           "LEFT JOIN FETCH b.raisedBy " +
           "LEFT JOIN FETCH b.assignedDeveloper " +
           "LEFT JOIN FETCH b.workflow " +
           "LEFT JOIN FETCH b.tester " +
           "WHERE b.status NOT IN ('CLOSED', 'VERIFIED', 'INVALID_BUG')",
           countQuery = "SELECT COUNT(b) FROM Bug b WHERE b.status NOT IN ('CLOSED', 'VERIFIED', 'INVALID_BUG')")
    Page<Bug> findAllOptimizedActive(Pageable pageable);

    @Query(value = "SELECT DISTINCT b FROM Bug b " +
           "LEFT JOIN FETCH b.bugTask " +
           "LEFT JOIN FETCH b.raisedBy " +
           "LEFT JOIN FETCH b.assignedDeveloper " +
           "LEFT JOIN FETCH b.workflow " +
           "LEFT JOIN FETCH b.tester " +
           "WHERE b.assignedDeveloper.id = :devId",
           countQuery = "SELECT COUNT(b) FROM Bug b WHERE b.assignedDeveloper.id = :devId")
    Page<Bug> findAllOptimizedByAssignedDeveloperId(@Param("devId") Long devId, Pageable pageable);

    @Query(value = "SELECT DISTINCT b FROM Bug b " +
           "LEFT JOIN FETCH b.bugTask " +
           "LEFT JOIN FETCH b.raisedBy " +
           "LEFT JOIN FETCH b.assignedDeveloper " +
           "LEFT JOIN FETCH b.workflow " +
           "LEFT JOIN FETCH b.tester " +
           "WHERE b.assignedDeveloper.id = :devId AND b.status NOT IN ('CLOSED', 'VERIFIED', 'INVALID_BUG')",
           countQuery = "SELECT COUNT(b) FROM Bug b WHERE b.assignedDeveloper.id = :devId AND b.status NOT IN ('CLOSED', 'VERIFIED', 'INVALID_BUG')")
    Page<Bug> findAllOptimizedByAssignedDeveloperIdAndActive(@Param("devId") Long devId, Pageable pageable);
}
