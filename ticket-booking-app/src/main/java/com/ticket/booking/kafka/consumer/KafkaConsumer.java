package com.ticket.booking.kafka.consumer;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticket.booking.entity.PaymentDetails;
import com.ticket.booking.repo.PaymentRepo;
import com.ticket.booking.vo.PaymentDetailsVo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class KafkaConsumer {
	
	private final PaymentRepo paymentRepo;

	@KafkaListener(topics = "${payment.cancel.topic}")
	public void consume(String message) {
		log.info("message {}",message);
		try {
			ObjectMapper mapper = new ObjectMapper();
			PaymentDetailsVo detailsVo = mapper.readValue(message, PaymentDetailsVo.class);
			PaymentDetails paymentDetails = paymentRepo.findByPaymentIdAndRefundStatusNotIn(detailsVo.getPaymentId(), List.of("CANCELLED"));
			if(paymentDetails!=null) {
				paymentDetails.setPaymentStatus("CANCELLED");
				paymentDetails.setUpdateddBy("CancelEvent");
				paymentDetails.setUpdatedOn(LocalDateTime.now());
				paymentDetails.setCancellationId(detailsVo.getCancellationId());
				paymentRepo.save(paymentDetails);
				
				log.info("Refund succesfull");
			}else {
				log.error("Details not found");
			}
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}
	}
	
	@KafkaListener(topics = "${ticket.cancel.topic}")
	public void consumeCancelBooking(String message) {
		log.info("message {}",message);
		try {
			ObjectMapper mapper = new ObjectMapper();
			PaymentDetailsVo detailsVo = mapper.readValue(message, PaymentDetailsVo.class);
			PaymentDetails paymentDetails = paymentRepo.findByBookingIdAndPaymentStatusNotIn(detailsVo.getBookingId(), List.of("CANCELLED"));
			if(paymentDetails!=null) {
				paymentDetails.setPaymentStatus("CANCELLED");
				paymentDetails.setUpdateddBy("CancelEvent");
				paymentDetails.setUpdatedOn(LocalDateTime.now());
				paymentDetails.setCancellationId(detailsVo.getCancellationId());
				paymentDetails.setCancellationReason(detailsVo.getReasonForRefund());
				paymentDetails.setRefundStatus("COMPLETED");
				
				paymentRepo.save(paymentDetails);
				
				log.info("Refund succesfull");
				
			}
			log.error("Details not found");
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}
	}
	
	@KafkaListener(topics = "${event.cancel.topic}")
	public void cosumeEventCancel(String message) {
		log.info("message {}",message);
		try {
			ObjectMapper mapper = new ObjectMapper();
			PaymentDetailsVo detailsVo = mapper.readValue(message, PaymentDetailsVo.class);
			PaymentDetails paymentDetails = paymentRepo.findByBookingIdAndPaymentStatusNotIn(detailsVo.getBookingId(), List.of("CANCELLED"));
			if(paymentDetails!=null) {
				paymentDetails.setPaymentStatus("CANCELLED");
				paymentDetails.setUpdateddBy("CancelEvent");
				paymentDetails.setUpdatedOn(LocalDateTime.now());
				paymentDetails.setCancellationId(detailsVo.getCancellationId());
				paymentDetails.setCancellationReason(detailsVo.getReasonForRefund());
				paymentDetails.setRefundStatus("COMPLETED");
				
				paymentRepo.save(paymentDetails);
				
				log.info("Refund succesfull");
				
			}
			log.error("Details not found");
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}
	}
	
}
