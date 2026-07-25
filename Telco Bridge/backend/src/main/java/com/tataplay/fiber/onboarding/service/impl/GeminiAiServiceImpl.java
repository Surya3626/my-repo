package com.tataplay.fiber.onboarding.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tataplay.fiber.onboarding.dto.ChatbotRequest;
import com.tataplay.fiber.onboarding.dto.ChatbotResponse;
import com.tataplay.fiber.onboarding.dto.ChatbotResponse.ActionChip;
import com.tataplay.fiber.onboarding.dto.ChatbotResponse.RichCard;
import com.tataplay.fiber.onboarding.service.ApplicationKnowledgeBase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiAiServiceImpl {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String configuredModel;

    private final ApplicationKnowledgeBase applicationKnowledgeBase;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern JSON_EXTRACT_PATTERN = Pattern.compile("\\{[\\s\\S]*?\"reply\"[\\s\\S]*?\\}");

    private String cachedWorkingModel = null;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.contains("YOUR_");
    }

    public ChatbotResponse generateResponse(ChatbotRequest request) {
        String rawQuery = request.getMessage() != null ? request.getMessage().trim() : "";
        String query = sanitizePiiData(rawQuery);
        String lowerQuery = query.toLowerCase();
        int step = parseStep(request.getCurrentStep());
        String context = request.getPageContext() != null ? request.getPageContext() : "ONBOARDING";
        String lang = request.getLanguage() != null ? request.getLanguage() : "EN";


        // 1. OUT-OF-CONTEXT BOUNDARY PROTECTION
        if (applicationKnowledgeBase.isOutOfContextQuery(query, context)) {
            return buildOutOfContextResponse(query, step, lang);
        }

        // 2. CLOUD GEMINI GENERATIVE AI INTEGRATION WITH PORTAL-AWARE KNOWLEDGE BASE
        if (isConfigured()) {
            List<String> targetModelNames = new ArrayList<>();
            if (cachedWorkingModel != null) {
                targetModelNames.add(cachedWorkingModel);
            }
            targetModelNames.add("models/gemini-1.5-flash");
            targetModelNames.add("models/gemini-1.5-flash-latest");
            targetModelNames.add("models/gemini-2.0-flash");

            String portalKnowledge = applicationKnowledgeBase.getPortalKnowledge(context);
            String systemPrompt = buildSystemPromptWithKnowledgeBase(query, step, context, lang, portalKnowledge);

            for (String fullModelName : targetModelNames) {
                String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/" + fullModelName + ":generateContent?key=" + apiKey.trim();
                try {
                    Map<String, Object> textPart = new HashMap<>();
                    textPart.put("text", systemPrompt);

                    Map<String, Object> contentObj = new HashMap<>();
                    contentObj.put("parts", Collections.singletonList(textPart));

                    Map<String, Object> genConfig = new HashMap<>();
                    genConfig.put("temperature", 0.3);
                    genConfig.put("maxOutputTokens", 800);

                    Map<String, Object> payload = new HashMap<>();
                    payload.put("contents", Collections.singletonList(contentObj));
                    payload.put("generationConfig", genConfig);

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);

                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

                    ResponseEntity<String> responseEntity = restTemplate.exchange(geminiUrl, HttpMethod.POST, entity, String.class);

                    if (responseEntity.getStatusCode() == HttpStatus.OK && responseEntity.getBody() != null) {
                        cachedWorkingModel = fullModelName;
                        ChatbotResponse response = parseGeminiResponseBody(responseEntity.getBody(), query, step);
                        if (response != null && !response.getReply().trim().isEmpty()) {
                            return response;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Gemini API call for '{}' failed: {}", fullModelName, e.getMessage());
                }
            }
        }

        // 3. PORTAL-AWARE KNOWLEDGE BASE SEARCH FALLBACK
        return queryKnowledgeBase(query, lowerQuery, step, context, lang);
    }

    private ChatbotResponse queryKnowledgeBase(String query, String lowerQuery, int step, String context, String lang) {
        List<ActionChip> chips = new ArrayList<>();
        RichCard richCard = null;

        String reply = applicationKnowledgeBase.searchKnowledge(query, step, context, lang);

        if (lowerQuery.contains("back") || lowerQuery.contains("previous") || lowerQuery.contains("next") || lowerQuery.contains("change step") || lowerQuery.contains("go to step")) {
            chips.add(new ActionChip("📍 Step 1 Feasibility", "NAVIGATE_STEP", "1"));
            chips.add(new ActionChip("⚡ Step 6 Broadband Plans", "NAVIGATE_STEP", "6"));
            chips.add(new ActionChip("📄 Step 9 CAF Form", "NAVIGATE_STEP", "9"));
            chips.add(new ActionChip("🚚 Step 10 Dispatch", "NAVIGATE_STEP", "10"));
        } else {
            chips.add(new ActionChip("⚡ View All Broadband Plans", "NAVIGATE_STEP", "6"));
            chips.add(new ActionChip("📍 Check PIN Code 400001", "AUTOFILL", "PIN_400001"));
        }

        return ChatbotResponse.builder()
                .query(query)
                .reply(reply)
                .intent("PORTAL_KNOWLEDGE_SEARCH")
                .stepHint("Portal Context: " + context + " Active")
                .actionChips(chips)
                .richCard(richCard)
                .suggestedPrompts(Arrays.asList("Check PIN 400001 feasibility", "Show all broadband plans", "Explain this step"))
                .build();
    }

    private ChatbotResponse buildOutOfContextResponse(String query, int step, String lang) {
        List<ActionChip> chips = new ArrayList<>();
        chips.add(new ActionChip("📍 Check PIN Feasibility", "NAVIGATE_STEP", "1"));
        chips.add(new ActionChip("⚡ View Broadband Plans", "NAVIGATE_STEP", "6"));

        String reply = getMultilingualText(
            "I am specialized strictly as your TelcoBridge AI Telecom & Onboarding Assistant. I can only assist you with questions regarding your TelcoBridge broadband setup, plans, PIN feasibility, KYC, or support portal. How can I help you with your broadband today?",
            "मैं केवल आपके टाटा प्ले फाइबर ब्रॉडबैंड सहायक के रूप में काम करता हूँ। मैं केवल ब्रॉडबैंड सेटअप, प्लान, पिन उपलब्धता और केवाईसी से जुड़े सवालों के जवाब दे सकता हूँ।",
            "હું માત્ર તમારા ટાટા પ્લે ફાઇબર સહાયક તરીકે કામ કરું છું. હું માત્ર બ્રોડબેન્ડ અને પ્લાન વિશે જ માહિતી આપી શકું છું.",
            "मी फक्त तुमच्या टाटा प्ले फायबर सहाय्यक म्हणून काम करतो.",
            "நான் உங்கள் டெல்கோபிரிட்ஜ் AI உதவியாளர் மட்டுமே.",
            lang
        );

        return ChatbotResponse.builder()
                .query(query)
                .reply(reply)
                .intent("OUT_OF_CONTEXT")
                .stepHint("Telecom Assistant Active")
                .actionChips(chips)
                .suggestedPrompts(Arrays.asList("Check PIN 400001 feasibility", "Show all broadband plans"))
                .build();
    }

    private String buildSystemPromptWithKnowledgeBase(String query, int step, String context, String lang, String portalKnowledge) {
        return """
            You are TelcoBridge AI Assistant and Application Journey Co-Pilot.

            PORTAL AWARENESS MANDATE:
            You are currently operating inside the '%s' portal context.
            Below is the authoritative Knowledge Base for the '%s' portal (including every input field, button, step, and endpoint):

            --- %s PORTAL KNOWLEDGE BASE ---
            %s
            --- END PORTAL KNOWLEDGE BASE ---

            Subscriber State:
            - Page Context: %s
            - Active Step: %d
            - Selected Language: %s
            - Subscriber Query: "%s"

            STRICT OUT-OF-CONTEXT POLICY:
            If the user asks an out-of-context question (cooking, sports, politics, general coding, external trivia), POLITELY DECLINE:
            "I am specialized strictly as your TelcoBridge AI Telecom & Onboarding Assistant. I can only assist you with questions regarding your TelcoBridge broadband setup, plans, PIN feasibility, KYC, or support portal."

            CRITICAL MULTILINGUAL MANDATE:
            You MUST output your 'reply' text in the exact language requested (%s):
            - If SelectedLanguage='HI', reply in natural Hindi (Devanagari script).
            - If SelectedLanguage='GU', reply in natural Gujarati (Gujarati script).
            - If SelectedLanguage='MR', reply in natural Marathi (Devanagari script).
            - If SelectedLanguage='TA', reply in natural Tamil (Tamil script).
            - If SelectedLanguage='EN', reply in English.

            Output ONLY valid JSON:
            {
              "reply": "Clear, accurate answer matching fields and context in requested language...",
              "intent": "GENERAL"
            }
            """.formatted(context, context, context, portalKnowledge, context, step, lang, query, lang);
    }

    private ChatbotResponse parseGeminiResponseBody(String jsonBody, String query, int step) {
        try {
            JsonNode root = objectMapper.readTree(jsonBody);
            JsonNode textNode = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            if (textNode != null && !textNode.isMissingNode()) {
                String rawText = textNode.asText().trim();

                if (rawText.contains("```")) {
                    rawText = rawText.replaceAll("(?s)```[a-zA-Z]*\\s*", "").replaceAll("```$", "").trim();
                }

                String cleanReply = "";
                String intent = "GENERAL";

                Matcher matcher = JSON_EXTRACT_PATTERN.matcher(rawText);
                if (matcher.find()) {
                    String extractedJson = matcher.group();
                    try {
                        JsonNode aiJson = objectMapper.readTree(extractedJson);
                        if (aiJson.has("reply") && !aiJson.path("reply").asText().trim().isEmpty()) {
                            cleanReply = aiJson.path("reply").asText().trim();
                        }
                        if (aiJson.has("intent")) {
                            intent = aiJson.path("intent").asText("GENERAL");
                        }
                    } catch (Exception ignore) {}
                }

                if (cleanReply.isEmpty()) {
                    if (rawText.contains("* reply:")) {
                        cleanReply = rawText.substring(rawText.indexOf("* reply:") + 8).trim();
                    } else if (rawText.contains("\"reply\":")) {
                        int idx = rawText.indexOf("\"reply\":") + 8;
                        cleanReply = rawText.substring(idx).replaceAll("^[\\s\":]+", "").replaceAll("[\"}\\s]+$", "").trim();
                    } else {
                        cleanReply = rawText.replaceAll("(?m)^\\*.*$", "").trim();
                    }
                }

                if (cleanReply.startsWith("*")) {
                    cleanReply = cleanReply.replaceAll("(?m)^\\*.*$", "").trim();
                }

                if (cleanReply.isEmpty() || cleanReply.equals("...") || cleanReply.toLowerCase().contains("user input is empty")) {
                    return null;
                }

                List<ActionChip> chips = new ArrayList<>();
                chips.add(new ActionChip("⚡ View All Broadband Plans", "NAVIGATE_STEP", "6"));
                chips.add(new ActionChip("📍 Check PIN Code 400001", "AUTOFILL", "PIN_400001"));

                return ChatbotResponse.builder()
                        .query(query)
                        .reply(cleanReply)
                        .intent(intent)
                        .stepHint("Step " + step + " Application AI Active")
                        .actionChips(chips)
                        .suggestedPrompts(Arrays.asList("Check PIN 400001 feasibility", "Explain this step", "Show all broadband plans"))
                        .build();
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
        }

        return null;
    }

    private String getMultilingualText(String en, String hi, String gu, String mr, String ta, String lang) {
        if ("HI".equalsIgnoreCase(lang)) return hi;
        if ("GU".equalsIgnoreCase(lang)) return gu;
        if ("MR".equalsIgnoreCase(lang)) return mr;
        if ("TA".equalsIgnoreCase(lang)) return ta;
        return en;
    }

    private String sanitizePiiData(String input) {
        if (input == null) return "";
        String sanitized = input.replaceAll("\\b(?:\\d[ -]*?){13,16}\\b", "[REDACTED_CARD]");
        sanitized = sanitized.replaceAll("(?i)(password|passwd|otp|pin|cvv)\\s*[:=]\\s*\\S+", "$1: [REDACTED]");
        return sanitized;
    }

    private int parseStep(Object rawStep) {
        if (rawStep == null) return 1;
        if (rawStep instanceof Number) return ((Number) rawStep).intValue();
        String s = String.valueOf(rawStep);
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            switch (s) {
                case "FEASIBILITY_CHECK": return 1;
                case "CUSTOMER_DETAILS": return 2;
                case "OTP_VERIFICATION": return 3;
                case "DOCUMENT_COLLECTION": return 4;
                case "BUILD_PROFILE": return 5;
                case "PLANS_ADDONS_COUPONS": return 6;
                case "PAYMENT": return 7;
                case "DOCUMENT_MIGRATION": return 8;
                case "CUSTOMER_CONSENT": return 9;
                case "CAF_GENERATION": return 10;
                case "EKYC_INITIATION": return 11;
                default: return 1;
            }
        }
    }
}

