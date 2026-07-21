package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.entity.InstallationTicket;
import com.tataplay.fiber.onboarding.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/ticket")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/schedule")
    public ResponseEntity<ApiResponse<InstallationTicket>> schedule(
            @RequestBody Map<String, String> payload) {
        
        String dateStr = payload.get("appointmentDate");
        if (dateStr == null || dateStr.trim().isEmpty()) {
            throw new RuntimeException("Appointment date and time is required");
        }

        LocalDateTime date = LocalDateTime.parse(dateStr);
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        InstallationTicket ticket = ticketService.scheduleInstallation(mobileNumber, date);
        return ResponseEntity.ok(ApiResponse.success("Installation appointment scheduled", ticket));
    }

    @GetMapping("/track")
    public ResponseEntity<ApiResponse<InstallationTicket>> track() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        InstallationTicket ticket = ticketService.getTicketByMobile(mobileNumber);
        
        // Simulate engineer movement automatically when tracked
        InstallationTicket updatedTicket = ticketService.simulateEngineerMovement(ticket.getTicketNumber());
        
        return ResponseEntity.ok(ApiResponse.success("Technician location updated", updatedTicket));
    }
}
