package com.devtrack.api.repository;

import com.devtrack.api.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    @Query("SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.assignedDeveloper " +
           "LEFT JOIN FETCH t.createdBy " +
           "LEFT JOIN FETCH t.workflow " +
           "LEFT JOIN FETCH t.tester")
    List<Task> findAllOptimized();

    @Query(value = "SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.assignedDeveloper " +
           "LEFT JOIN FETCH t.createdBy " +
           "LEFT JOIN FETCH t.workflow " +
           "LEFT JOIN FETCH t.tester",
           countQuery = "SELECT COUNT(t) FROM Task t")
    Page<Task> findAllOptimized(Pageable pageable);

    @Query(value = "SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.assignedDeveloper " +
           "LEFT JOIN FETCH t.createdBy " +
           "LEFT JOIN FETCH t.workflow " +
           "LEFT JOIN FETCH t.tester " +
           "WHERE t.status != :status",
           countQuery = "SELECT COUNT(t) FROM Task t WHERE t.status != :status")
    Page<Task> findAllOptimizedByStatusNot(@Param("status") String status, Pageable pageable);

    @Query(value = "SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.assignedDeveloper " +
           "LEFT JOIN FETCH t.createdBy " +
           "LEFT JOIN FETCH t.workflow " +
           "LEFT JOIN FETCH t.tester " +
           "WHERE t.assignedDeveloper.id = :devId",
           countQuery = "SELECT COUNT(t) FROM Task t WHERE t.assignedDeveloper.id = :devId")
    Page<Task> findAllOptimizedByAssignedDeveloperId(@Param("devId") Long devId, Pageable pageable);

    @Query(value = "SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.assignedDeveloper " +
           "LEFT JOIN FETCH t.createdBy " +
           "LEFT JOIN FETCH t.workflow " +
           "LEFT JOIN FETCH t.tester " +
           "WHERE t.assignedDeveloper.id = :devId AND t.status != :status",
           countQuery = "SELECT COUNT(t) FROM Task t WHERE t.assignedDeveloper.id = :devId AND t.status != :status")
    Page<Task> findAllOptimizedByAssignedDeveloperIdAndStatusNot(@Param("devId") Long devId, @Param("status") String status, Pageable pageable);
}
