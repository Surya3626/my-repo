package com.ticket.booking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ticket.booking.service.AdminService;
import com.ticket.booking.service.PaymentService;
import com.ticket.booking.validation.AddEventReqValidator;
import com.ticket.booking.validation.CancleEventValidator;
import com.ticket.booking.validation.RefundPaymentValidator;
import com.ticket.booking.validation.UpdateEventValidator;
import com.ticket.booking.vo.EventDetVo;
import com.ticket.booking.vo.GenericResponseVo;
import com.ticket.booking.vo.PaymentDetailsVo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AdminController", description = "Admin APIs")
public class AdminControllerImpl {

	private final AdminService adminService;
	private final AddEventReqValidator reqValidator;
	private final CancleEventValidator cancleEventValidator;
	private final UpdateEventValidator updateEventValidator;
	private final RefundPaymentValidator refunfPaymentValidator;
	private final PaymentService paymentService;

	@PostMapping("/addEvent")
	@Operation(summary = "API to add new Event")
	public ResponseEntity<GenericResponseVo> addEvent(@RequestBody EventDetVo event) {

		if(reqValidator.isValid(event))
			return adminService.addEvent(event);

		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}

	@DeleteMapping("/deleteEvent/{eventId}")
	public ResponseEntity<GenericResponseVo> deleteEvent(@PathVariable(required = true) Long eventId) {

		return adminService.deleteEvent(eventId);

	}

	@PostMapping("/cancelEvent")
	public ResponseEntity<GenericResponseVo> cancelEvent(@RequestBody EventDetVo event) {

		if(cancleEventValidator.isValid(event)) {
			return adminService.cancelEvent(event);
		}
		
		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}

	@PatchMapping("/updateEvent")
	public ResponseEntity<GenericResponseVo> updateEvent(@RequestBody EventDetVo event) {

		if(updateEventValidator.isValid(event)) {
			return adminService.updateEvent(event);
		}
		
		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}

	@PostMapping("/refundPayment")
	public ResponseEntity<GenericResponseVo> refundPayment(@RequestBody PaymentDetailsVo payment) {

		if(refunfPaymentValidator.isValid(payment)) {
			return paymentService.processRefund(payment);
		}
		
		return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Request is not valid")
				.statusType("Error").build());
	}

}
