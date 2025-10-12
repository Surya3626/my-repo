package com.ticket.booking.entity;

import jakarta.persistence.Column;
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
@Table(name="USER_DETAILS")
public class LoginUserDetails extends BaseEntity{

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Long userNbr;
	
	@Column(name = "USER_ID")
	private String userId;

	@Column(name = "USER_NAME")
	private String userName;
	
	@Column(name = "MOBILE_NO")
	private String mobileNo;
	
	@Column(name = "EMAIL_ID")
	private String emailId;
	
	@Column(name = "PASSWORD")
	private String password;
	
	@Column(name = "ROLE")
	private String role;
	
}
