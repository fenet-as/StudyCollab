// backend/src/main/java/com/studycollab/service/tasks/TasksService.java
package com.studycollab.service.tasks;

import com.studycollab.dto.tasks.TaskRequestDto;
import com.studycollab.dto.tasks.TaskResponseDto;
import com.studycollab.exception.CustomExceptions.ResourceNotFoundException;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.Task;
import com.studycollab.model.User;
import com.studycollab.repository.tasks.TasksRepository;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TasksService {

    @Autowired
    private TasksRepository tasksRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Transactional(readOnly = true)
    public List<TaskResponseDto> getTasksByGroup(Long groupId) {
        return tasksRepository.findByStudyGroupId(groupId)
                .stream()
                .map(TaskResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponseDto createTask(TaskRequestDto dto) {
        StudyGroup group = groupRepository.findById(dto.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Study group not found with id: " + dto.getGroupId()));

        User assignee = null;
        if (dto.getAssigneeId() != null) {
            assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found with id: " + dto.getAssigneeId()));
        }

        User creator = null;
        if (dto.getCreatorId() != null) {
            creator = userRepository.findById(dto.getCreatorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Creator user not found with id: " + dto.getCreatorId()));
        }

        Task task = new Task(
                dto.getTitle(),
                dto.getDescription(),
                dto.getStatus() != null ? dto.getStatus() : Task.Status.TODO,
                dto.getPriority() != null ? dto.getPriority() : Task.Priority.MEDIUM,
                dto.getDueDate(),
                assignee,
                creator,
                group
        );

        Task saved = tasksRepository.save(task);
        return new TaskResponseDto(saved);
    }

    @Transactional
    public TaskResponseDto updateTask(Long taskId, TaskRequestDto dto) {
        Task task = tasksRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        if (dto.getTitle() != null) task.setTitle(dto.getTitle());
        if (dto.getDescription() != null) task.setDescription(dto.getDescription());
        if (dto.getStatus() != null) task.setStatus(dto.getStatus());
        if (dto.getPriority() != null) task.setPriority(dto.getPriority());
        if (dto.getDueDate() != null) task.setDueDate(dto.getDueDate());

        // FIX: Only modify assignee if assigneeId is explicitly provided in the payload.
        // This prevents drag-and-drop status changes from wiping out the assignee.
        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found with id: " + dto.getAssigneeId()));
            task.setAssignee(assignee);
        }

        if (dto.getCreatorId() != null) {
            User creator = userRepository.findById(dto.getCreatorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Creator user not found with id: " + dto.getCreatorId()));
            task.setCreator(creator);
        }

        Task updated = tasksRepository.save(task);
        return new TaskResponseDto(updated);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        if (!tasksRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found with id: " + taskId);
        }
        tasksRepository.deleteById(taskId);
    }
}