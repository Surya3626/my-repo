package com.ticket.booking.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ticket.booking.entity.PaymentDetails;

import jakarta.transaction.Transactional;

@Repository
@Transactional
public interface PaymentRepo extends JpaRepository<PaymentDetails, Long> {

	PaymentDetails findByBookingIdAndPaymentStatusNotIn(String bookingId, List<String> paymentStatus);
	
	PaymentDetails findByPaymentIdAndRefundStatusNotIn(Long paymentId, List<String> refundStatus);
}
