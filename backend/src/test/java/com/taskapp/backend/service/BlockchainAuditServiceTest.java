package com.taskapp.backend.service;

import com.taskapp.backend.model.Task;
import com.taskapp.backend.model.TaskAudit;
import com.taskapp.backend.model.TaskStatus;
import com.taskapp.backend.model.User;
import com.taskapp.backend.repository.TaskAuditRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class BlockchainAuditServiceTest {

    @Mock
    private TaskAuditRepository taskAuditRepository;

    @InjectMocks
    private BlockchainAuditService blockchainAuditService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testLogTaskAction_FirstAction_HasZeroPreviousHash() {
        Task task = new Task();
        task.setId(1L);
        task.setTitle("Test Title");
        task.setDescription("Test Desc");
        task.setStatus(TaskStatus.TODO);
        
        User user = new User();
        user.setEmail("test@test.com");
        task.setUser(user);

        when(taskAuditRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());

        blockchainAuditService.logAction(task, "CREATED");

        verify(taskAuditRepository, times(1)).save(argThat(audit -> 
            audit.getPreviousHash().equals("0") && 
            audit.getAction().equals("CREATED") &&
            audit.getTaskId().equals(1L) &&
            audit.getHash() != null
        ));
    }
}
