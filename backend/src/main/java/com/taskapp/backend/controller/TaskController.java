package com.taskapp.backend.controller;

import com.taskapp.backend.dto.GroqTaskGenerationRequest;
import com.taskapp.backend.dto.GroqTaskGenerationResponse;
import com.taskapp.backend.model.Task;
import com.taskapp.backend.model.TaskStatus;
import com.taskapp.backend.model.TaskAudit;
import org.springframework.security.access.prepost.PreAuthorize;
import com.taskapp.backend.model.User;
import com.taskapp.backend.repository.TaskRepository;
import com.taskapp.backend.repository.UserRepository;
import com.taskapp.backend.service.GroqAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroqAiService groqAiService;
    
    @Autowired
    private com.taskapp.backend.service.BlockchainAuditService blockchainAuditService;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<Page<Task>> getAllTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Task> tasks = taskRepository.findByUserWithFilters(getCurrentUser(), search, status, pageable);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        task.setUser(getCurrentUser());
        Task savedTask = taskRepository.save(task);
        blockchainAuditService.logAction(savedTask, "CREATED");
        return ResponseEntity.ok(savedTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        Optional<Task> existingTaskOpt = taskRepository.findById(id);
        if (existingTaskOpt.isEmpty() || !existingTaskOpt.get().getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.notFound().build();
        }

        Task existingTask = existingTaskOpt.get();
        existingTask.setTitle(updatedTask.getTitle());
        existingTask.setDescription(updatedTask.getDescription());
        existingTask.setPriority(updatedTask.getPriority());
        existingTask.setDueDate(updatedTask.getDueDate());
        existingTask.setStatus(updatedTask.getStatus());
        
        Task savedTask = taskRepository.save(existingTask);
        blockchainAuditService.logAction(savedTask, "UPDATED");
        return ResponseEntity.ok(savedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        Optional<Task> existingTaskOpt = taskRepository.findById(id);
        if (existingTaskOpt.isEmpty() || !existingTaskOpt.get().getUser().getId().equals(getCurrentUser().getId())) {
            return ResponseEntity.notFound().build();
        }
        
        Task taskToDelete = existingTaskOpt.get();
        taskRepository.delete(taskToDelete);
        blockchainAuditService.logAction(taskToDelete, "DELETED");
        return ResponseEntity.ok().build();
    }

    @Autowired
    private com.taskapp.backend.repository.TaskAuditRepository taskAuditRepository;

    @GetMapping("/{taskId}/audit")
    public ResponseEntity<List<TaskAudit>> getAuditLogs(@PathVariable Long taskId) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User currentUser = getCurrentUser();
        boolean isAdmin = currentUser.getRole().name().equals("ROLE_ADMIN");
        
        if (!taskOpt.get().getUser().getId().equals(currentUser.getId()) && !isAdmin) {
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(taskAuditRepository.findByTaskIdOrderByTimestampDesc(taskId));
    }

    @PostMapping("/generate-details")
    public ResponseEntity<GroqTaskGenerationResponse> generateTaskDetails(@RequestBody GroqTaskGenerationRequest request) {
        return ResponseEntity.ok(groqAiService.generateTaskDetails(request.getTitle()));
    }
}
