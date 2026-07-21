package com.tataplay.fiber.onboarding.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Broadcasts real-time events to WebSocket subscribers.
 * Used to push live updates to the Admin Dashboard without polling.
 */
@Service
@RequiredArgsConstructor
public class OnboardingEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast a customer onboarding status update to admin dashboard
     */
    public void publishCustomerUpdate(String mobileNumber, String status, int currentStep, String actorRole) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "CUSTOMER_UPDATE");
        event.put("mobileNumber", mobileNumber);
        event.put("status", status);
        event.put("currentStep", currentStep);
        event.put("actorRole", actorRole);
        event.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/admin/customers", event);
    }

    /**
     * Broadcast a KYC event to admin dashboard
     */
    public void publishKycEvent(String mobileNumber, Long documentId, String verificationStatus) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "KYC_EVENT");
        event.put("mobileNumber", mobileNumber);
        event.put("documentId", documentId);
        event.put("verificationStatus", verificationStatus);
        event.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/admin/kyc", event);
    }

    /**
     * Broadcast a new payment event
     */
    public void publishPaymentEvent(String mobileNumber, String transactionId, double amount, String status) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "PAYMENT_EVENT");
        event.put("mobileNumber", mobileNumber);
        event.put("transactionId", transactionId);
        event.put("amount", amount);
        event.put("status", status);
        event.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/admin/payments", event);
    }

    /**
     * Broadcast a notification (WhatsApp/SMS simulation)
     */
    public void publishNotification(String mobileNumber, String channel, String message) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "NOTIFICATION");
        event.put("mobileNumber", mobileNumber);
        event.put("channel", channel);
        event.put("message", message);
        event.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/admin/notifications", event);
    }
}
