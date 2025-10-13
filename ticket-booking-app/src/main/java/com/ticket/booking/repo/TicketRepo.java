package com.ticket.booking.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ticket.booking.entity.Ticket;

import jakarta.transaction.Transactional;
import java.util.List;


@Repository
@Transactional
public interface TicketRepo extends JpaRepository<Ticket, Long> {

	 List<Ticket> findByEventIdAndBookingStatus(Long eventId, String bookingStatus);
	 
	 List<Ticket> findByUserId(String userId);
	 
	 Ticket findByBookingId(String bookingId);
	 
	 List<Ticket> findByEventId(Long eventId);
	 
	 Ticket findByBookingIdAndBookingStatusNotIn(String bookingId, List<String> bookingStatus);
	 
}
