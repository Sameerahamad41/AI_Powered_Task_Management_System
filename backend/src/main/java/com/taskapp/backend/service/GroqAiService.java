package com.taskapp.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskapp.backend.dto.GroqTaskGenerationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroqAiService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    private final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    public GroqTaskGenerationResponse generateTaskDetails(String title) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + groqApiKey);

        String prompt = "You are an AI task assistant. Based on the following task title: '" + title + 
                        "', generate a short task description, suggest a priority (LOW, MEDIUM, or HIGH), and an estimated completion effort in hours/days. " +
                        "Respond ONLY with a JSON object in this exact format: {\"description\": \"...\", \"priority\": \"...\", \"estimatedTime\": \"...\"}";

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.1-8b-instant"); // Use a valid Groq model
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.5);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(GROQ_API_URL, entity, String.class);
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            
            // Clean markdown JSON wrapping if any
            if (content.startsWith("```json")) {
                content = content.substring(7);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }
            content = content.trim();

            return mapper.readValue(content, GroqTaskGenerationResponse.class);

        } catch (Exception e) {
            e.printStackTrace();
            GroqTaskGenerationResponse fallback = new GroqTaskGenerationResponse();
            fallback.setDescription("Failed to generate description. Error: " + e.getMessage());
            fallback.setPriority("MEDIUM");
            fallback.setEstimatedTime("Unknown");
            return fallback;
        }
    }
}
