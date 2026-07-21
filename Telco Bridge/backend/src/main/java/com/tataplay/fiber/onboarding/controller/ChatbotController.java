package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(@RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        String reply = chatbotService.getReply(message);

        Map<String, String> response = new HashMap<>();
        response.put("query", message);
        response.put("reply", reply);

        return ResponseEntity.ok(ApiResponse.success("Reply generated successfully", response));
    }
}
