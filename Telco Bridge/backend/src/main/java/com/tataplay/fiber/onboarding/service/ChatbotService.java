package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.dto.ChatbotRequest;
import com.tataplay.fiber.onboarding.dto.ChatbotResponse;

public interface ChatbotService {
    String getReply(String query);
    ChatbotResponse processMessage(ChatbotRequest request);
}
