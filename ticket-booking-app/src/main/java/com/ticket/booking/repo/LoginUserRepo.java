package com.ticket.booking.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ticket.booking.entity.LoginUserDetails;

import jakarta.transaction.Transactional;


@Repository
@Transactional
public interface LoginUserRepo extends JpaRepository<LoginUserDetails, Long> {

	LoginUserDetails findByUserId(String userId);
}
