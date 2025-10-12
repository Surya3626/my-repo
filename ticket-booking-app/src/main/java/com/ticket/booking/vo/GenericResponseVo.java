package com.ticket.booking.vo;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GenericResponseVo {

	private String statusCode;
	private String statusDescription;
	private String statusType;
	private List<?> data;
}
