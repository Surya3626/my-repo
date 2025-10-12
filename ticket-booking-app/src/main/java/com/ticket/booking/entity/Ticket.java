package com.ticket.booking.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "TICKET")
@JsonIgnoreProperties({"tcktNbr","eventId"})
public class Ticket extends BaseEntity{

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long tcktNbr;
	
	private Long eventId;
	
	private String bookingId;
	
	private String userId;
	
	private String bookingStatus;
	
	private String eventName;
	
	private String eventLocation;
	
	private LocalDateTime eventDate;
	
	private String eventType;
	
	private String conductedBy;
	
	private int noOfTickets;
	
	private double price;
	
	
}
