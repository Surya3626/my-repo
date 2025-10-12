package com.ticket.booking.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Data;

@MappedSuperclass
@Data
@JsonIgnoreProperties({"createdBy","createdOn","updateddBy","updatedOn"})
public class BaseEntity {

	@Column(name = "CREATED_BY")
	private String createdBy;
	
	@Column(name = "CREATED_ON")
	private LocalDateTime createdOn = LocalDateTime.now();
	
	@Column(name = "UPDATED_BY")
	private String updateddBy;
	
	@Column(name = "UPDATED_ON")
	private LocalDateTime updatedOn;
}
