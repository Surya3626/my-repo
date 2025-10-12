package com.ticket.booking.validation;

import org.springframework.stereotype.Component;

import com.ticket.booking.vo.EventDetVo;

@Component
public class CancleEventValidator implements GenericValidator<EventDetVo> {

	@Override
	public boolean isValid(EventDetVo t) {
		
		if(t.getEventId()==null) {
			return false;
		}
		if(t.getReason()==null || t.getReason().isBlank())
			return false;
		if(t.getRequestedBy()==null || t.getRequestedBy().isBlank())
			return false;
		
		return true;
	}

}
