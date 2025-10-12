package com.ticket.booking.validation;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.ticket.booking.vo.EventDetVo;

@Component
public class AddEventReqValidator implements GenericValidator<EventDetVo> {

	@Override
	public boolean isValid(EventDetVo t) {
		
		if(t.getConductedBy()==null || t.getConductedBy().isBlank())
			return false;
		if(t.getEventDate()==null || t.getEventDate().isBefore(LocalDateTime.now()))
			return false;
		if(t.getEventName()==null || t.getEventName().isBlank())
			return false;
		if(t.getEventStatus()==null || t.getEventStatus().isBlank())
			return false;
		if(t.getEventType()==null || t.getEventType().isBlank())
			return false;
		if(t.getLocation()==null || t.getLocation().isBlank())
			return false;
		if(t.getAvailableTickets()==0)
			return false;
		if(t.getPricePerTicket()==null)
			return false;
		
		return true;
	}

}
