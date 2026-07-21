package com.tataplay.fiber.onboarding.exception;

import com.tataplay.fiber.onboarding.config.CorrelationFilter;
import com.tataplay.fiber.onboarding.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        String correlationId = CorrelationFilter.getCorrelationId();
        log.warn("Validation failure: {} - Correlation: {}", errors, correlationId);
        
        ErrorResponse errorResponse = ErrorResponse.of(
                "Input validation failed", correlationId, errors);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        String correlationId = CorrelationFilter.getCorrelationId();
        log.warn("Access Denied exception: {} - Correlation: {}", ex.getMessage(), correlationId);

        ErrorResponse errorResponse = ErrorResponse.of(
                "You are not authorized to access this resource", correlationId, null);
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException ex) {
        String correlationId = CorrelationFilter.getCorrelationId();
        log.error("Runtime exception: {} - Correlation: {}", ex.getMessage(), correlationId, ex);

        ErrorResponse errorResponse = ErrorResponse.of(
                ex.getMessage(), correlationId, null);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        String correlationId = CorrelationFilter.getCorrelationId();
        log.error("Unhandled Exception: {} - Correlation: {}", ex.getMessage(), correlationId, ex);

        ErrorResponse errorResponse = ErrorResponse.of(
                "An internal server error occurred", correlationId, null);
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
