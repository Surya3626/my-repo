package com.ticket.booking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ticket.booking.service.PaymentService;
import com.ticket.booking.service.UserEventService;
import com.ticket.booking.validation.CancelTicketValidator;
import com.ticket.booking.validation.PaymentValidator;
import com.ticket.booking.validation.TicketDetailsValidator;
import com.ticket.booking.vo.GenericResponseVo;
import com.ticket.booking.vo.PaymentDetailsVo;
import com.ticket.booking.vo.TicketDetailsVo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/user")
@Slf4j
@RequiredArgsConstructor
public class UserEventControllerImpl {
	
	private final UserEventService eventService;
	private final TicketDetailsValidator ticketDetailsValidator;
	private final CancelTicketValidator cancelTicketValidator;
	private final PaymentValidator paymentValidator;
	private final PaymentService paymentService;

	@PostMapping("/bookTicket")
	public ResponseEntity<GenericResponseVo> bookTicket(@RequestBody TicketDetailsVo ticket) {
		
		if(ticketDetailsValidator.isValid(ticket)) {
			return eventService.bookTicket(ticket);
		}
		
		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}
	
	@DeleteMapping("/cancelTicket")
	public ResponseEntity<GenericResponseVo> cancelTicket(@RequestBody TicketDetailsVo ticket) {
		
		if(cancelTicketValidator.isValid(ticket)) {
			return eventService.cancelBooking(ticket);
		}
		
		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}
	
	@PostMapping("/pay")
	public ResponseEntity<GenericResponseVo> pay(@RequestBody PaymentDetailsVo payment) {
	
		if(paymentValidator.isValid(payment)) {
			return paymentService.processPayment(payment);
		}
		
		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}
	
	@GetMapping("/bookingDetails")
	public ResponseEntity<GenericResponseVo> bookingDetails(@RequestParam String bookingId) {
		
		if(bookingId!=null) {
			return eventService.fetchBookingDetails(bookingId);
		}
		
		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}
	
	@GetMapping("/bookingHistory")
	public ResponseEntity<GenericResponseVo> bookingHistory(@RequestParam(required = true) String userId) {
		
		return eventService.fetchBookingHistory(userId);

	}
}
