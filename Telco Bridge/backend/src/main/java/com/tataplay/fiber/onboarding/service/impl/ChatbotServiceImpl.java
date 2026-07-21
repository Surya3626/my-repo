package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.service.ChatbotService;
import org.springframework.stereotype.Service;

@Service
public class ChatbotServiceImpl implements ChatbotService {

    @Override
    public String getReply(String query) {
        if (query == null || query.trim().isEmpty()) {
            return "Hello! I am your Tata Play Fiber Assistant. How can I help you today?";
        }

        String lowerQuery = query.toLowerCase();

        if (lowerQuery.contains("plan") || lowerQuery.contains("pack") || lowerQuery.contains("speed")) {
            return "We offer high-speed unlimited plans starting from 50 Mbps (Rs. 549/mo) up to 300 Mbps (Rs. 1499/mo). Our most popular plan is the 100 Mbps Super Premium Value Pack (Rs. 799/mo) which comes with Disney+ Hotstar and ZEE5 subscriptions included! You can pick your plan in the Plan Selection step.";
        }
        
        if (lowerQuery.contains("feasib") || lowerQuery.contains("cover") || lowerQuery.contains("pincode") || lowerQuery.contains("gps")) {
            return "Feasibility tells you if Tata Play Fiber is active in your building. Just enter your 6-digit Indian PIN code or tap 'Detect Current Location' using GPS on the Address screen. (Note: PIN codes ending in 9 simulate out-of-coverage areas for testing!)";
        }
        
        if (lowerQuery.contains("document") || lowerQuery.contains("kyc") || lowerQuery.contains("aadhaar") || lowerQuery.contains("pan")) {
            return "To approve your broadband connection, Indian telecom regulations require Proof of Identity and Address. You can drag and drop your Aadhaar or PAN card and capture a quick selfie using your webcam. We secure all sensitive data using AES encryption.";
        }
        
        if (lowerQuery.contains("pay") || lowerQuery.contains("charge") || lowerQuery.contains("price") || lowerQuery.contains("tax")) {
            return "You can pay using UPI (GPay, PhonePe, Paytm), Credit/Debit cards, or Net banking. All pricing includes 18% standard GST. Use the promo code 'WELCOME100' during checkout to get Rs. 100 off your first plan!";
        }
        
        if (lowerQuery.contains("engineer") || lowerQuery.contains("track") || lowerQuery.contains("technician") || lowerQuery.contains("ticket")) {
            return "After payment, you choose your preferred appointment date and time. An installation engineer will be assigned. You can track their coordinates and ETA in real time on the 'Track Connection' page or inside the Self-Care portal.";
        }

        if (lowerQuery.contains("help") || lowerQuery.contains("support") || lowerQuery.contains("contact")) {
            return "You can contact our support team at 1800-120-8686 or email help@tataplayfiber.com. You can also raise support tickets directly inside the Customer Self-Care dashboard.";
        }

        return "I'm sorry, I didn't quite get that. You can ask me about 'plans', 'feasibility checks', 'required documents', 'payment modes', or 'technician tracking'.";
    }
}
