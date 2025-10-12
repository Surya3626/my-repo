package com.ticket.booking.validation;

import org.springframework.stereotype.Component;

import com.ticket.booking.vo.TicketDetailsVo;

@Component
public class CancelTicketValidator implements GenericValidator<TicketDetailsVo> {

	@Override
	public boolean isValid(TicketDetailsVo t) {

		if(t.getTicketId()==null )
			return false;
		if(t.getReasonForCancellation()==null || t.getReasonForCancellation().isBlank())
			return false;
		
		return true;
	}

}
