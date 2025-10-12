package com.ticket.booking.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDetailsVo {

	private String bookingId;
	private Long paymentId;
	private Double amount;
	private String reasonForRefund;
	private String cancellationId;
	private String paymentMode;
}
