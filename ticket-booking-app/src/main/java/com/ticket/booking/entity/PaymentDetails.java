package com.ticket.booking.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "PAYMENT_DETAILS")
public class PaymentDetails extends BaseEntity{

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long paymentId;
	
	private String userId;
	
	private String bookingId;
	
	private String paymentStatus;
	
	private String paymentMode;
	
	private String cancellationId;
	
	private String cancellationReason;
	
	private String refundStatus;
	
}
