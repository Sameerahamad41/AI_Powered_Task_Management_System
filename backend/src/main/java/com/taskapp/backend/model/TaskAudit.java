package com.taskapp.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_audits")
@Data
@NoArgsConstructor
public class TaskAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long taskId;
    
    private String action; // e.g., "CREATED", "UPDATED", "DELETED"

    @Column(columnDefinition = "TEXT")
    private String taskDataSnapshot;

    @Column(nullable = false)
    private String hash; // The hash of this record

    private String previousHash; // Hash of the previous record to form a chain

    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
