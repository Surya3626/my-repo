package com.ticket.booking.validation;

import org.springframework.stereotype.Component;

import com.ticket.booking.vo.PaymentDetailsVo;


@Component
public class PaymentValidator implements GenericValidator<PaymentDetailsVo> {

	@Override
	public boolean isValid(PaymentDetailsVo t) {

		if(t.getAmount()==null || t.getAmount()==0.0)
			return false;
		if(t.getBookingId()==null || t.getBookingId().isBlank())
			return false;
		if(t.getPaymentMode()==null || t.getPaymentMode().isBlank())
			return false;
		
		return true;
	}

}
