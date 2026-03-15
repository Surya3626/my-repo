package com.example.devtrack.repository;

import com.example.devtrack.model.Bug;
import com.example.devtrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BugRepository extends JpaRepository<Bug, Long> {
    List<Bug> findByAssignedTo(User user);

    org.springframework.data.domain.Page<Bug> findByAssignedTo(User user,
            org.springframework.data.domain.Pageable pageable);

    List<Bug> findByRaisedBy(User user);

    org.springframework.data.domain.Page<Bug> findByChangeRequestId(Long changeRequestId,
            org.springframework.data.domain.Pageable pageable);
}
