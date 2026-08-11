package com.taskapp.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskapp.backend.model.Task;
import com.taskapp.backend.model.TaskAudit;
import com.taskapp.backend.repository.TaskAuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;

@Service
public class BlockchainAuditService {

    @Autowired
    private TaskAuditRepository taskAuditRepository;

    // Removed ObjectMapper to bypass serialization issues

    public void logAction(Task task, String action) {
        TaskAudit audit = new TaskAudit();
        audit.setTaskId(task.getId());
        audit.setAction(action);

        try {
            // Create a manual snapshot to completely avoid Hibernate/Jackson proxy issues
            String taskSnapshot = String.format(
                "{\"id\":%d,\"title\":\"%s\",\"priority\":\"%s\",\"status\":\"%s\"}",
                task.getId(),
                task.getTitle() != null ? task.getTitle().replace("\"", "\\\"") : "",
                task.getPriority(),
                task.getStatus()
            );
            
            audit.setTaskDataSnapshot(taskSnapshot);
            
            // Get the previous hash to maintain the chain
            Optional<TaskAudit> previousAudit = taskAuditRepository.findTopByOrderByIdDesc();
            String previousHash = previousAudit.map(TaskAudit::getHash).orElse("0");
            audit.setPreviousHash(previousHash);

            // Calculate current hash based on previous hash + snapshot + action
            String dataToHash = previousHash + taskSnapshot + action + System.currentTimeMillis();
            audit.setHash(calculateHash(dataToHash));

            taskAuditRepository.save(audit);
            
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR IN AUDIT LOGGING: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String calculateHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
