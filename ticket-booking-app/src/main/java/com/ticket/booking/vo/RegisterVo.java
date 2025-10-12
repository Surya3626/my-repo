package com.ticket.booking.vo;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterVo {

//	@NotNull(message = "User Id should not be null")
//	@NotBlank(message = "User Id should not be null")
//	@NotEmpty(message = "User Id should not be null")
//	private final String userId;

	@NotNull(message = "Mobile number should not be null")
	@NotBlank
	@NotEmpty
	@Digits(fraction = 0, integer = 10)
	private final String rmn;
	
	@NotNull(message = "Email Id should not be null")
	@NotBlank
	@NotEmpty
	@Email
	private final String emailId;
	
	@NotNull(message = "Password not be null")
	@NotBlank
	@NotEmpty
	private final String password;
	
	@NotNull(message = "Name not be null")
	@NotBlank
	@NotEmpty
	private final String name;
	
	@NotNull
	@NotBlank
	private final String role;
}
