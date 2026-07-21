package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.entity.InstallationTicket;

import java.time.LocalDateTime;

public interface TicketService {
    InstallationTicket scheduleInstallation(String mobileNumber, LocalDateTime appointmentDate);
    InstallationTicket getTicketByMobile(String mobileNumber);
    InstallationTicket getTicketByNumber(String ticketNumber);
    InstallationTicket simulateEngineerMovement(String ticketNumber);
}
