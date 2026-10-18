package com.sovereign.democracy.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Collections;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeminiRequestDto {

    private List<Content> contents;
    private GenerationConfig generationConfig;

    public GeminiRequestDto() {}

    public GeminiRequestDto(String promptText, Integer maxOutputTokens, Double temperature) {
        this.contents = Collections.singletonList(new Content(Collections.singletonList(new Part(promptText))));
        if (maxOutputTokens != null || temperature != null) {
            this.generationConfig = new GenerationConfig(maxOutputTokens, temperature);
        }
    }

    public List<Content> getContents() {
        return contents;
    }

    public void setContents(List<Content> contents) {
        this.contents = contents;
    }

    public GenerationConfig getGenerationConfig() {
        return generationConfig;
    }

    public void setGenerationConfig(GenerationConfig generationConfig) {
        this.generationConfig = generationConfig;
    }

    public static class Content {
        private List<Part> parts;

        public Content() {}

        public Content(List<Part> parts) {
            this.parts = parts;
        }

        public List<Part> getParts() {
            return parts;
        }

        public void setParts(List<Part> parts) {
            this.parts = parts;
        }
    }

    public static class Part {
        private String text;

        public Part() {}

        public Part(String text) {
            this.text = text;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GenerationConfig {
        private Integer maxOutputTokens;
        private Double temperature;

        public GenerationConfig() {}

        public GenerationConfig(Integer maxOutputTokens, Double temperature) {
            this.maxOutputTokens = maxOutputTokens;
            this.temperature = temperature;
        }

        public Integer getMaxOutputTokens() {
            return maxOutputTokens;
        }

        public void setMaxOutputTokens(Integer maxOutputTokens) {
            this.maxOutputTokens = maxOutputTokens;
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }
    }
}
