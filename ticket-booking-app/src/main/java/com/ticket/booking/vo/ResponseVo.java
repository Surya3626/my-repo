package com.ticket.booking.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResponseVo {

	private String statusCode;
	private String statusDescription;
	private String statusType;
	private String token;
}
