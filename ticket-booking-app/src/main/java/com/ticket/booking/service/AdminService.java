package com.ticket.booking.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticket.booking.entity.Events;
import com.ticket.booking.entity.Ticket;
import com.ticket.booking.repo.EventsRepo;
import com.ticket.booking.repo.TicketRepo;
import com.ticket.booking.vo.EventDetVo;
import com.ticket.booking.vo.GenericResponseVo;
import com.ticket.booking.vo.PaymentDetailsVo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
	
	private final EventsRepo eventsRepo;
	private final TicketRepo ticketRepo;
	private final KafkaProducerService kafkaProducerService;
	
	@Value("${event.cancel.topic}")
	private String eventCancelTopic;
	
	public ResponseEntity<GenericResponseVo> addEvent(EventDetVo event) {
		try {
			
			List<Events> list = eventsRepo.findByEventDateAndLocation(event.getEventDate(), event.getLocation());
			if(list!=null && !list.isEmpty()) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("0001").statusDescription("An event at same location and at same date already exist")
						.statusType("Error").build());
			}
			
			Events events = new Events();
			events.setAvailableTickets(event.getAvailableTickets());
			events.setConductedBy(event.getConductedBy());
			events.setCreatedBy(event.getRequestedBy());
			events.setEventDate(event.getEventDate());
			events.setEventName(event.getEventName());
			events.setEventStatus(event.getEventStatus());
			events.setEventType(event.getEventType());
			events.setLocation(event.getLocation());
			events.setPrice(event.getPricePerTicket());
			eventsRepo.save(events);

			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Event Added successfully")
					.statusType("Success").build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

	public ResponseEntity<GenericResponseVo> deleteEvent(Long eventId) {
		try {
			
			Events events = eventsRepo.findByEventIdAndEventStatusIsNot(eventId, "CANCELLED");
			if(events!=null) {
				events.setEventStatus("CANCELLED");
				events.setUpdateddBy("delete Event");
				events.setUpdatedOn(LocalDateTime.now());
				events.setReason("delete Event");
				
				eventsRepo.save(events);
				
				//payment refund
				
				ObjectMapper mapper = new ObjectMapper();
				List<Ticket> bookingDetails = ticketRepo.findByEventIdAndBookingStatus(eventId, "CONFIRMED");
				if(bookingDetails!=null && !bookingDetails.isEmpty()) {
					for(Ticket ticket :bookingDetails) {
						ticket.setBookingStatus("CANCELLED");
						ticket.setUpdateddBy("system");
						
						PaymentDetailsVo paymentDetailsVo = PaymentDetailsVo.builder().bookingId(ticket.getBookingId()).reasonForRefund("Event Cancelled").build();
						kafkaProducerService.sendMessage(eventCancelTopic, mapper.writeValueAsString(paymentDetailsVo));
					}
					
					ticketRepo.saveAll(bookingDetails);
				}
			}
			
			eventsRepo.deleteById(eventId);
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Event Deleted successfully")
					.statusType("Success").build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

	public ResponseEntity<GenericResponseVo> cancelEvent(EventDetVo event) {
		try {
			Events events = eventsRepo.findByEventIdAndEventStatusIsNot(event.getEventId(), "CANCELLED");
			if(events==null) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("No Such Event Present")
						.statusType("Error").build());
			}
			
			events.setEventStatus("CANCELLED");
			events.setUpdateddBy(event.getRequestedBy());
			events.setUpdatedOn(LocalDateTime.now());
			events.setReason(event.getReason());
			
			eventsRepo.save(events);
			
			//payment refund
			
			ObjectMapper mapper = new ObjectMapper();
			List<Ticket> bookingDetails = ticketRepo.findByEventIdAndBookingStatus(event.getEventId(), "CONFIRMED");
			if(bookingDetails!=null && !bookingDetails.isEmpty()) {
				for(Ticket ticket :bookingDetails) {
					ticket.setBookingStatus("CANCELLED");
					ticket.setUpdateddBy("system");
					
					PaymentDetailsVo paymentDetailsVo = PaymentDetailsVo.builder().bookingId(ticket.getBookingId()).reasonForRefund("Event Cancelled").build();
					kafkaProducerService.sendMessage(eventCancelTopic, mapper.writeValueAsString(paymentDetailsVo));
				}
				
				ticketRepo.saveAll(bookingDetails);
			}
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Event Cancelled Successfully")
					.statusType("Success").build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

	public ResponseEntity<GenericResponseVo> updateEvent(EventDetVo event) {
		try {
			Optional<Events> eventDet = eventsRepo.findById(event.getEventId());
			if(eventDet==null || !eventDet.isPresent() || eventDet.get()==null) {
				return ResponseEntity.badRequest().body(GenericResponseVo.builder().statusCode("1111").statusDescription("No Such Event Present")
						.statusType("Error").build());
			}			
			
			Events events = eventDet.get();
			
			if(event.getConductedBy()!=null && !event.getConductedBy().isBlank()) {
				events.setConductedBy(event.getConductedBy());
			}
			if(event.getEventDate()!=null && !event.getEventDate().isAfter(LocalDateTime.now())) {
				events.setEventDate(event.getEventDate());
			}
			if(event.getEventStatus()!=null && !event.getEventStatus().isBlank()) {
				events.setEventStatus(event.getEventStatus());
			}
			if(event.getLocation()!=null && !event.getLocation().isBlank()) {
				events.setLocation(event.getLocation());
			}
			if(event.getReason()!=null && !event.getReason().isBlank()) {
				events.setReason(event.getReason());
			}
			
			eventsRepo.save(events);
			
			List<Ticket> list = ticketRepo.findByEventId(event.getEventId());
			for(Ticket ticket : list) {
				if(event.getConductedBy()!=null && !event.getConductedBy().isBlank()) {
					ticket.setConductedBy(event.getConductedBy());
				}
				if(event.getEventDate()!=null && !event.getEventDate().isAfter(LocalDateTime.now())) {
					ticket.setEventDate(event.getEventDate());
				}
				if(event.getLocation()!=null && !event.getLocation().isBlank()) {
					ticket.setEventLocation(event.getLocation());
				}
			}
			
			//notify user if possible
			
			return ResponseEntity.ok().body(GenericResponseVo.builder().statusCode("0000").statusDescription("Event Updated Successfully")
					.statusType("Success").build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Failure")
				.statusType("Error").build());
	}

}
