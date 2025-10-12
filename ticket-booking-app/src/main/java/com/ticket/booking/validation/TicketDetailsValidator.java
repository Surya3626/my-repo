package com.ticket.booking.validation;

import org.springframework.stereotype.Component;

import com.ticket.booking.vo.TicketDetailsVo;

@Component
public class TicketDetailsValidator implements GenericValidator<TicketDetailsVo> {

	@Override
	public boolean isValid(TicketDetailsVo t) {

		if(t.getNoOfTickets()==0)
			return false;
		if(t.getEventId()==null) {
			return false;
		}
		
		return true;
	}

}
