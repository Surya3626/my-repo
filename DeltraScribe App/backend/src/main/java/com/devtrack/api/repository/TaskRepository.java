package com.devtrack.api.repository;

import com.devtrack.api.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}
