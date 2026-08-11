package com.taskapp.backend.repository;

import com.taskapp.backend.model.TaskAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TaskAuditRepository extends JpaRepository<TaskAudit, Long> {
    List<TaskAudit> findByTaskIdOrderByTimestampDesc(Long taskId);
    Optional<TaskAudit> findTopByOrderByIdDesc();
}
