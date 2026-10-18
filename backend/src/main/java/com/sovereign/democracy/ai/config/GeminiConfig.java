package com.sovereign.democracy.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class GeminiConfig {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.8-flash}")
    private String model;

    @Value("${gemini.enabled:true}")
    private boolean enabled;

    @Value("${gemini.timeout-seconds:15}")
    private int timeoutSeconds;

    @Value("${gemini.rate-limit-per-minute:30}")
    private int rateLimitPerMinute;

    @Bean
    public RestClient geminiRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(timeoutSeconds));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

        return RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .requestFactory(factory)
                .build();
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getModel() {
        return model;
    }

    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.trim().isEmpty();
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public int getRateLimitPerMinute() {
        return rateLimitPerMinute;
    }
}
