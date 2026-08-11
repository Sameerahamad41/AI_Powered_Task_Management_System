package com.taskapp.backend.controller;

import com.taskapp.backend.model.Task;
import com.taskapp.backend.model.User;
import com.taskapp.backend.repository.TaskAuditRepository;
import com.taskapp.backend.repository.TaskRepository;
import com.taskapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAuditRepository taskAuditRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Nullify passwords before sending to frontend
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        
        // Find and delete all task audits for all tasks owned by this user
        List<Task> userTasks = taskRepository.findByUserOrderByCreatedAtDesc(user);
        for (Task task : userTasks) {
            taskAuditRepository.deleteAll(taskAuditRepository.findByTaskIdOrderByTimestampDesc(task.getId()));
        }

        // Delete tasks
        taskRepository.deleteAll(userTasks);

        // Delete user
        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "User and all associated data deleted successfully."));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User existingUser = userOpt.get();
        if (updatedUser.getEmail() != null && !updatedUser.getEmail().trim().isEmpty()) {
            existingUser.setEmail(updatedUser.getEmail());
        }
        if (updatedUser.getRole() != null) {
            existingUser.setRole(updatedUser.getRole());
        }
        
        userRepository.save(existingUser);
        return ResponseEntity.ok(Map.of("message", "User updated successfully."));
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<?> getUserTasks(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<Task> tasks = taskRepository.findByUserOrderByCreatedAtDesc(userOpt.get());
        return ResponseEntity.ok(tasks);
    }
}
