package com.ticket.booking.vo;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ViewEventsVo {

	private Long eventId;
	
	private String eventName;
	
	private String eventType;
	
	private String location;
	
	private String conductedBy;
	
	private LocalDateTime eventDate;
	
	private String eventStatus;
	
	private int availableTickets;
	
}
