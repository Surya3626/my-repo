package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.dto.ChatbotRequest;
import com.tataplay.fiber.onboarding.dto.ChatbotResponse;
import com.tataplay.fiber.onboarding.dto.ChatbotResponse.ActionChip;
import com.tataplay.fiber.onboarding.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatbotServiceImpl implements ChatbotService {

    private final GeminiAiServiceImpl geminiAiService;

    @Override
    public String getReply(String query) {
        ChatbotRequest request = new ChatbotRequest();
        request.setMessage(query);
        ChatbotResponse res = processMessage(request);
        return res.getReply();
    }

    @Override
    public ChatbotResponse processMessage(ChatbotRequest request) {
        // 1. Delegate to Live Google Gemini AI Provider if Configured
        if (geminiAiService != null && geminiAiService.isConfigured()) {
            return geminiAiService.generateResponse(request);
        }

        // 2. If Gemini is unconfigured/offline, return explicit Offline Message
        List<ActionChip> offlineChips = new ArrayList<>();
        offlineChips.add(new ActionChip("⚡ View All Broadband Plans", "NAVIGATE_STEP", "6"));
        offlineChips.add(new ActionChip("📍 Check PIN Code 400001", "AUTOFILL", "PIN_400001"));

        return ChatbotResponse.builder()
                .query(request.getMessage() != null ? request.getMessage() : "")
                .reply("AI Assistant is currently offline. Please configure your Gemini API Key in application.properties or call support at 1800-120-8686.")
                .intent("OFFLINE")
                .actionChips(offlineChips)
                .suggestedPrompts(Arrays.asList("Check PIN 400001 feasibility", "Show all broadband plans"))
                .build();
    }
}
