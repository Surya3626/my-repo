package com.ticket.booking.validation;

import org.springframework.stereotype.Component;

import com.ticket.booking.vo.EventDetVo;

@Component
public class UpdateEventValidator implements GenericValidator<EventDetVo> {

	@Override
	public boolean isValid(EventDetVo t) {

		if(t.getEventId()==null)
			return false;
		
		return true;
	}

}
