package com.ticket.booking.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TicketDetailsVo {

	private Long ticketId;
	private Long eventId;
	private int noOfTickets;
	private String reasonForCancellation;
}
