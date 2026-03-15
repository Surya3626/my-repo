package com.example.devtrack.repository;

import com.example.devtrack.model.Task;
import com.example.devtrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository
        extends JpaRepository<Task, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Task> {
    List<Task> findByAssignedUser(User user);

    org.springframework.data.domain.Page<Task> findByAssignedUser(User user,
            org.springframework.data.domain.Pageable pageable);
}
