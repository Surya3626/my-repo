package com.ticket.booking.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticket.booking.entity.Events;
import com.ticket.booking.entity.Ticket;
import com.ticket.booking.repo.EventsRepo;
import com.ticket.booking.repo.TicketRepo;
import com.ticket.booking.util.EventUtil;
import com.ticket.booking.vo.GenericResponseVo;
import com.ticket.booking.vo.PaymentDetailsVo;
import com.ticket.booking.vo.ResponseVo;
import com.ticket.booking.vo.TicketDetailsVo;
import com.ticket.booking.vo.ViewEventsVo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserEventService {

	private final EventsRepo eventsRepo;
	private final EventUtil eventUtil;
	private final TicketRepo ticketRepo;
	private final KafkaProducerService kafkaProducerService;
	
	@Value("${ticket.cancel.topic}")
	private String ticketCancelTopic;
	
	public ResponseEntity<?> fetchAllEvents(LocalDateTime date, Long eventId){
		try {
			List<Events> list = new ArrayList<>();
			if(eventId!=null) {
				list = eventsRepo.findByEventId(eventId);
			}
			if(date!=null) {
				list = eventsRepo.findByEventDate(date);
			}else {
				list = eventsRepo.findAll();
			}
			
			if(list!=null && !list.isEmpty()) {
				List<ViewEventsVo> eventslist =	eventUtil.mapEventDetails(list);
				
				return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000")
						.statusDescription("Event details fetched Succesfully").statusType("Success").data(eventslist).build());
			}
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0001")
					.statusDescription("No Events available :(").statusType("Error").build());

		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(ResponseVo.builder().statusCode("9999").statusDescription("Technical Exception Occured")
				.statusType("Error").build());
	}

	public ResponseEntity<GenericResponseVo> bookTicket(TicketDetailsVo ticket) {
		try {
			
			Events eventDet = eventsRepo.findByEventIdAndEventStatusIsNot(ticket.getEventId(), "CANCELLED");
			if(eventDet==null) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("No Such Event Present")
						.statusType("Error").build());
			}
			
			if(eventDet.getAvailableTickets()<ticket.getNoOfTickets()) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Tickets not available")
						.statusType("Error").build());
			}
			
			Ticket ticket2 = new Ticket();
			ticket2.setBookingId("TBA_"+System.currentTimeMillis());
			ticket2.setBookingStatus("PENDING");
			ticket2.setConductedBy(eventDet.getConductedBy());
			ticket2.setCreatedBy(SecurityContextHolder.getContext().getAuthentication().getName());
			ticket2.setCreatedOn(LocalDateTime.now());
			ticket2.setEventDate(eventDet.getEventDate());
			ticket2.setEventId(eventDet.getEventId());
			ticket2.setEventLocation(eventDet.getLocation());
			ticket2.setEventName(eventDet.getEventName());
			ticket2.setEventType(eventDet.getEventName());
			ticket2.setNoOfTickets(ticket.getNoOfTickets());
			ticket2.setUserId(SecurityContextHolder.getContext().getAuthentication().getName());
			ticket2.setPrice(eventDet.getPrice() * ticket.getNoOfTickets());
			
			ticketRepo.save(ticket2);
			
			eventDet.setAvailableTickets(eventDet.getAvailableTickets()-ticket2.getNoOfTickets());
			eventsRepo.save(eventDet);
			
			Map<String, Object> data = new HashMap<>();
			data.put("bookingId", ticket2.getBookingId());
			data.put("amount", ticket2.getPrice());
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Please complete payment to confirm your ticket")
					.statusType("Success").data(Arrays.asList(data)).build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

	public ResponseEntity<GenericResponseVo> cancelBooking(TicketDetailsVo ticket) {
		try {
			Optional<Ticket> ticketDet = ticketRepo.findById(ticket.getTicketId());
			if(ticketDet==null || !ticketDet.isPresent() || ticketDet.get()==null) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("No Such Ticket Present")
						.statusType("Error").build());
			}
			
			Ticket ticket2 = ticketDet.get();
			LocalDateTime allowedDate = ticket2.getEventDate().minusDays(1);
			if(LocalDateTime.now().isAfter(allowedDate)) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("Cancellation not allowed")
						.statusType("Error").build());
			}
			
			ticket2.setBookingStatus("CANCELLED");
			ticket.setReasonForCancellation(ticket.getReasonForCancellation());
			ticketRepo.save(ticket2);
			
			List<Events> event = eventsRepo.findByEventId(ticket2.getEventId());
			event.get(0).setAvailableTickets(event.get(0).getAvailableTickets()+ticket2.getNoOfTickets());
			
			String cancellationId = "USER_CAN_"+System.currentTimeMillis();
			
			ObjectMapper mapper = new ObjectMapper();
			
			PaymentDetailsVo paymentDetailsVo = PaymentDetailsVo.builder().bookingId(ticket2.getBookingId())
					.reasonForRefund(ticket.getReasonForCancellation()).amount(ticket2.getPrice()).cancellationId(cancellationId).build();
			kafkaProducerService.sendMessage(ticketCancelTopic, mapper.writeValueAsString(paymentDetailsVo));
			
			Map<String, Object> data = new HashMap<>();
			data.put("cancellationId", cancellationId);
			data.put("refundAmount", ticket2.getPrice());
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Ticket Cancelled Successfully. Refund will be credited within 2 working days.")
					.statusType("Success").data(Arrays.asList(data)).build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

	public ResponseEntity<GenericResponseVo> fetchBookingDetails(String bookingId) {
		try {
			Ticket ticket = ticketRepo.findByBookingId(bookingId);
			if(ticket==null) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("No Such Ticket Present")
						.statusType("Error").build());
			}
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Ticket Cancelled Successfully. Refund will be credited within 2 working days.")
					.statusType("Success").data(Arrays.asList(ticket)).build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

	public ResponseEntity<GenericResponseVo> fetchBookingHistory(String userId) {
		try {
			List<Ticket> tickets = ticketRepo.findByUserId(userId);
			if(tickets.isEmpty()) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("No Ticket booked yet")
						.statusType("Error").build());
			}
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Ticket Cancelled Successfully. Refund will be credited within 2 working days.")
					.statusType("Success").data(tickets).build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

}
