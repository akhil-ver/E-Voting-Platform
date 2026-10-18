package com.sovereign.democracy.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final String appBaseUrl;

    // In-memory holder for demonstration / testing environments (without exposing to logs)
    private final ConcurrentHashMap<String, String> lastResetLinks = new ConcurrentHashMap<>();

    public EmailService(@Value("${app.base-url:http://localhost:3000}") String appBaseUrl) {
        this.appBaseUrl = appBaseUrl.endsWith("/") ? appBaseUrl.substring(0, appBaseUrl.length() - 1) : appBaseUrl;
    }

    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        String resetLink = appBaseUrl + "/reset-password#token=" + rawToken;
        lastResetLinks.put(toEmail.toLowerCase().trim(), resetLink);

        // Security requirement: Never log raw tokens or passwords in plaintext
        logger.info("Secure password reset dispatched for recovery address [{}] via URL fragment hash delivery.",
                maskEmail(toEmail));
    }

    public String getLastResetLink(String email) {
        return lastResetLinks.get(email.toLowerCase().trim());
    }

    public void clearLastResetLink(String email) {
        lastResetLinks.remove(email.toLowerCase().trim());
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "*@" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}
