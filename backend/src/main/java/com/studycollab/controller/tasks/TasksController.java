package com.studycollab.controller.tasks;

import com.studycollab.dto.tasks.TaskRequestDto;
import com.studycollab.dto.tasks.TaskResponseDto;
import com.studycollab.dto.tasks.TaskUpdateDto;
import com.studycollab.model.User;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.tasks.TasksService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class TasksController {

    private final TasksService tasksService;

    public TasksController(TasksService tasksService) {
        this.tasksService = tasksService;
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<TaskResponseDto>> getTasksByGroup(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User currentUser = userDetails != null ? userDetails.getUser() : null;
        return ResponseEntity.ok(tasksService.getTasksByGroup(groupId, currentUser));
    }

    @PostMapping
    public ResponseEntity<TaskResponseDto> createTask(
            @Valid @RequestBody TaskRequestDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User currentUser = userDetails != null ? userDetails.getUser() : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tasksService.createTask(dto, currentUser));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponseDto> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskUpdateDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User currentUser = userDetails != null ? userDetails.getUser() : null;
        return ResponseEntity.ok(tasksService.updateTask(taskId, dto, currentUser));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User currentUser = userDetails != null ? userDetails.getUser() : null;
        tasksService.deleteTask(taskId, currentUser);
        return ResponseEntity.noContent().build();
    }
}