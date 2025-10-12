package com.ticket.booking.validation;

import org.springframework.stereotype.Component;

import com.ticket.booking.vo.PaymentDetailsVo;

@Component
public class RefundPaymentValidator implements GenericValidator<PaymentDetailsVo> {

	@Override
	public boolean isValid(PaymentDetailsVo t) {
		if(t.getBookingId()==null || t.getBookingId().isBlank())
			return false;
		if(t.getCancellationId()==null || t.getCancellationId().isBlank())
			return false;
		if(t.getPaymentId()==null)
			return false;
		if(t.getReasonForRefund()==null || t.getReasonForRefund().isBlank())
			return false;
		
		return true;
	}

}
