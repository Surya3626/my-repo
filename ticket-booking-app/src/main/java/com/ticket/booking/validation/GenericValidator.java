package com.ticket.booking.validation;

public interface GenericValidator<T> {

	public boolean isValid(T t);
}
