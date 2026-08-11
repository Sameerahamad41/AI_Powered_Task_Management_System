package com.taskapp.backend.dto;

import lombok.Data;

@Data
public class GroqTaskGenerationResponse {
    private String description;
    private String priority;
    private String estimatedTime;
}
