package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.entity.Address;
import com.tataplay.fiber.onboarding.entity.Customer;
import com.tataplay.fiber.onboarding.entity.CustomerStatus;
import com.tataplay.fiber.onboarding.entity.InstallationTicket;
import com.tataplay.fiber.onboarding.repository.AddressRepository;
import com.tataplay.fiber.onboarding.repository.CustomerRepository;
import com.tataplay.fiber.onboarding.repository.InstallationTicketRepository;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.CustomerService;
import com.tataplay.fiber.onboarding.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketServiceImpl.class);
    private final InstallationTicketRepository ticketRepository;
    private final CustomerService customerService;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final AuditService auditService;
    private final Random random = new Random();

    @Override
    @Transactional
    public InstallationTicket scheduleInstallation(String mobileNumber, LocalDateTime appointmentDate) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        Optional<InstallationTicket> existingOpt = ticketRepository.findByCustomerId(customer.getId());
        if (existingOpt.isPresent()) {
            InstallationTicket existing = existingOpt.get();
            existing.setAppointmentDate(appointmentDate);
            existing.setExpectedInstallationDate(appointmentDate.plusHours(4));
            return ticketRepository.save(existing);
        }

        int randomNum = random.nextInt(900000) + 100000;
        String ticketNumber = "TPF-TKT-" + randomNum;

        // Default engineer values near Mumbai
        double startLat = 19.0760;
        double startLon = 72.8777;

        Optional<Address> addrOpt = addressRepository.findByCustomerId(customer.getId());
        if (addrOpt.isPresent()) {
            Address address = addrOpt.get();
            if (address.getLatitude() != null && address.getLongitude() != null) {
                // position technician 0.02 degrees away
                startLat = address.getLatitude() - 0.015;
                startLon = address.getLongitude() - 0.015;
            }
        }

        InstallationTicket ticket = InstallationTicket.builder()
                .customer(customer)
                .ticketNumber(ticketNumber)
                .appointmentDate(appointmentDate)
                .expectedInstallationDate(appointmentDate.plusHours(4))
                .engineerName("Rajesh Kumar")
                .engineerPhone("+91 98765 43210")
                .engineerLatitude(startLat)
                .engineerLongitude(startLon)
                .status("ASSIGNED")
                .build();

        InstallationTicket savedTicket = ticketRepository.save(ticket);

        // Update customer status
        customer.setStatus(CustomerStatus.APPOINTMENT_SCHEDULED);
        customerRepository.save(customer);

        // Trigger SMS/WhatsApp mocks
        log.info("-----------------------------------------------------------------");
        log.info("TPF CONFIRMATION BROADCAST");
        log.info("Channels: WhatsApp, SMS, Email");
        log.info("Sent to: {} / {}", customer.getMobileNumber(), customer.getEmail());
        log.info("Message: Dear {}, your Tata Play Fiber installation is confirmed for {}. Ticket: {}.", 
                customer.getFirstName(), appointmentDate, ticketNumber);
        log.info("-----------------------------------------------------------------");

        auditService.log("TICKET_CREATED", 
                "Installation ticket " + ticketNumber + " booked for " + appointmentDate, 
                mobileNumber);

        return savedTicket;
    }

    @Override
    public InstallationTicket getTicketByMobile(String mobileNumber) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);
        return ticketRepository.findByCustomerId(customer.getId())
                .orElseThrow(() -> new RuntimeException("No installation ticket found for this customer."));
    }

    @Override
    public InstallationTicket getTicketByNumber(String ticketNumber) {
        return ticketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new RuntimeException("No installation ticket found with ticket number: " + ticketNumber));
    }

    @Override
    @Transactional
    public InstallationTicket simulateEngineerMovement(String ticketNumber) {
        InstallationTicket ticket = getTicketByNumber(ticketNumber);
        
        Optional<Address> addrOpt = addressRepository.findByCustomerId(ticket.getCustomer().getId());
        if (addrOpt.isPresent()) {
            Address address = addrOpt.get();
            if (address.getLatitude() != null && address.getLongitude() != null) {
                double destLat = address.getLatitude();
                double destLon = address.getLongitude();

                double currentLat = ticket.getEngineerLatitude();
                double currentLon = ticket.getEngineerLongitude();

                // Move 10% closer to destination
                double nextLat = currentLat + (destLat - currentLat) * 0.15;
                double nextLon = currentLon + (destLon - currentLon) * 0.15;

                ticket.setEngineerLatitude(nextLat);
                ticket.setEngineerLongitude(nextLon);

                // Update status depending on proximity
                double distance = Math.sqrt(Math.pow(destLat - nextLat, 2) + Math.pow(destLon - nextLon, 2));
                if (distance < 0.002) {
                    ticket.setStatus("ARRIVED");
                } else {
                    ticket.setStatus("IN_PROGRESS");
                }
                
                return ticketRepository.save(ticket);
            }
        }
        
        ticket.setStatus("IN_PROGRESS");
        return ticketRepository.save(ticket);
    }
}
