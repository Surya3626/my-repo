package com.ticket.booking.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoginVo {

	@NotBlank(message = "userID should not be null")
	@NotNull(message = "userID should not be null")
	private String userId;
	
	@NotBlank(message = "password should not be null")
	@NotNull(message = "password should not be null")
	private String password;
}
