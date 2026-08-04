// backend/src/main/java/com/studycollab/controller/tasks/TasksController.java
package com.studycollab.controller.tasks;

import com.studycollab.dto.tasks.TaskRequestDto;
import com.studycollab.dto.tasks.TaskResponseDto;
import com.studycollab.service.tasks.TasksService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*", allowedHeaders = "*") // Cross-origin handling for React integration
public class TasksController {

    @Autowired
    private TasksService tasksService;

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<TaskResponseDto>> getTasksByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(tasksService.getTasksByGroup(groupId));
    }

    @PostMapping
    public ResponseEntity<TaskResponseDto> createTask(@RequestBody TaskRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tasksService.createTask(dto));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponseDto> updateTask(
            @PathVariable Long taskId,
            @RequestBody TaskRequestDto dto
    ) {
        return ResponseEntity.ok(tasksService.updateTask(taskId, dto));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        tasksService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}