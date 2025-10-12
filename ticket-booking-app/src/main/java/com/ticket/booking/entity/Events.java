package com.ticket.booking.entity;

import java.time.LocalDateTime;

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
@Table(name = "EVENTS")
public class Events extends BaseEntity{

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long eventId;
	
	private String eventName;
	
	private String eventType;
	
	private String location;
	
	private String conductedBy;
	
	private LocalDateTime eventDate;
	
	private String eventStatus;
	
	private int availableTickets;
	
	private String reason;
	
	private double price;
	
}
