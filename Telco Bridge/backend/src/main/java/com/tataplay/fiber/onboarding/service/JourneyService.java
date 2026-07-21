package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.entity.JourneyTracking;

public interface JourneyService {
    JourneyTracking saveProgress(String mobileNumber, String page, int step, String draftData, 
                                 String sessionId, String browser, String device, String ipAddress);

    JourneyTracking saveProgressWithActor(String mobileNumber, String page, int step, String draftData, 
                                          String sessionId, String browser, String device, String ipAddress,
                                          String role, String actorId, String actorName, String stepHistoryJson);

    JourneyTracking getProgress(String mobileNumber);
    void clearProgress(String mobileNumber);
}
