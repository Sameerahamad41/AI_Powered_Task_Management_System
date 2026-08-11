package com.taskapp.backend.repository;

import com.taskapp.backend.model.Task;
import com.taskapp.backend.model.User;
import com.taskapp.backend.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT t FROM Task t WHERE t.user = :user AND " +
           "(:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR t.status = :status)")
    Page<Task> findByUserWithFilters(
        @Param("user") User user, 
        @Param("search") String search, 
        @Param("status") TaskStatus status, 
        Pageable pageable
    );
}
