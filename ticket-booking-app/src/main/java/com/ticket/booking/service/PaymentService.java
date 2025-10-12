package com.ticket.booking.service;

import java.util.Arrays;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.ticket.booking.entity.PaymentDetails;
import com.ticket.booking.entity.Ticket;
import com.ticket.booking.repo.PaymentRepo;
import com.ticket.booking.repo.TicketRepo;
import com.ticket.booking.vo.GenericResponseVo;
import com.ticket.booking.vo.PaymentDetailsVo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
	
	private final TicketRepo ticketRepo;
	private final PaymentRepo paymentRepo;
	
	public ResponseEntity<GenericResponseVo> processRefund(PaymentDetailsVo payment) {
		// TODO Auto-generated method stub
		return null;
	}

	public ResponseEntity<GenericResponseVo> processPayment(PaymentDetailsVo payment) {
		try {
			Ticket ticket = ticketRepo.findByBookingId(payment.getBookingId());
			if(ticket==null || payment.getAmount()<ticket.getPrice()) {
				
			}
			
			PaymentDetails paymentDet = new PaymentDetails();
			paymentDet.setBookingId(payment.getBookingId());
			paymentDet.setCreatedBy(SecurityContextHolder.getContext().getAuthentication().getName());
			paymentDet.setPaymentMode(payment.getPaymentMode());
			paymentDet.setPaymentStatus("COMPLETED");
			paymentDet.setUserId(SecurityContextHolder.getContext().getAuthentication().getName());
			
			PaymentDetails save = paymentRepo.save(paymentDet);
			Map<String, String> data = Map.of("transactionId", String.valueOf(save.getPaymentId()));
			
			ticket.setBookingStatus("COMPLETED");
			ticketRepo.save(ticket);
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Payment Successful")
					.statusType("Success").data(Arrays.asList(data)).build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}
		return null;
	}

}
