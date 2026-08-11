package com.taskapp.backend.controller;

import com.taskapp.backend.model.Task;
import com.taskapp.backend.model.TaskStatus;
import com.taskapp.backend.model.User;
import com.taskapp.backend.repository.TaskRepository;
import com.taskapp.backend.repository.UserRepository;
import com.taskapp.backend.service.GroqAiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class TaskControllerTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private GroqAiService groqAiService;

    @InjectMocks
    private TaskController taskController;

    private User testUser;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        
        testUser = new User();
        testUser.setEmail("test@test.com");
        
        Authentication auth = new UsernamePasswordAuthenticationToken("test@test.com", "password");
        SecurityContextHolder.getContext().setAuthentication(auth);
        
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
    }

    @Test
    public void testGetAllTasks_ReturnsPagedTasks() {
        Task task = new Task();
        task.setTitle("Test Task");
        Page<Task> taskPage = new PageImpl<>(Collections.singletonList(task));

        when(taskRepository.findByUserWithFilters(eq(testUser), isNull(), isNull(), any(Pageable.class)))
            .thenReturn(taskPage);

        ResponseEntity<Page<Task>> response = taskController.getAllTasks(0, 10, null, null);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals("Test Task", response.getBody().getContent().get(0).getTitle());
    }
}
