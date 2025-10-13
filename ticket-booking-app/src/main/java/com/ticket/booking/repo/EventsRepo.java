package com.ticket.booking.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ticket.booking.entity.Events;

import jakarta.transaction.Transactional;

import java.util.List;
import java.time.LocalDateTime;

@Repository
@Transactional
public interface EventsRepo extends JpaRepository<Events, Long> {

	List<Events> findByEventDate(LocalDateTime eventDate);

	List<Events> findByEventId(Long eventId);
	
	Events findByEventIdAndEventStatusIsNot(Long eventId, String status);
	
	List<Events> findByEventDateAndLocation(LocalDateTime eventDate, String location);
	
}
