package com.studycollab.service.tasks;

import com.studycollab.dto.tasks.TaskRequestDto;
import com.studycollab.dto.tasks.TaskResponseDto;
import com.studycollab.dto.tasks.TaskUpdateDto;
import com.studycollab.exception.CustomExceptions.BadRequestException;
import com.studycollab.exception.CustomExceptions.ResourceNotFoundException;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.Task;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.repository.tasks.TasksRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TasksService {

    private final TasksRepository tasksRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public TasksService(TasksRepository tasksRepository,
                        UserRepository userRepository,
                        GroupRepository groupRepository) {
        this.tasksRepository = tasksRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDto> getTasksByGroup(Long groupId, User currentUser) {
        StudyGroup group = findGroupById(groupId);
        validateMembership(currentUser, group);

        return tasksRepository.findByStudyGroupId(group.getId())
                .stream()
                .map(TaskResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponseDto createTask(TaskRequestDto dto, User creator) {
        StudyGroup group = findGroupById(dto.getGroupId());
        validateMembership(creator, group);

        User assignee = null;
        if (dto.getAssigneeId() != null) {
            assignee = findUserById(dto.getAssigneeId());
            validateMembership(assignee, group);
        }

        LocalDateTime dueDateTime = (dto.getDueDate() != null) ? dto.getDueDate().atStartOfDay() : null;

        Task task = new Task(
                dto.getTitle(),
                dto.getDescription(),
                dto.getStatus() != null ? dto.getStatus() : Task.Status.TODO,
                dto.getPriority() != null ? dto.getPriority() : Task.Priority.MEDIUM,
                dueDateTime,
                assignee,
                creator,
                group
        );

        return new TaskResponseDto(tasksRepository.save(task));
    }

    @Transactional
    public TaskResponseDto updateTask(Long taskId, TaskUpdateDto dto, User currentUser) {
        Task task = findTaskById(taskId);
        validateMembership(currentUser, task.getStudyGroup());

        if (dto.getTitle() != null) task.setTitle(dto.getTitle());
        if (dto.getDescription() != null) task.setDescription(dto.getDescription());
        if (dto.getStatus() != null) task.setStatus(dto.getStatus());
        if (dto.getPriority() != null) task.setPriority(dto.getPriority());
        if (dto.getDueDate() != null) task.setDueDate(dto.getDueDate().atStartOfDay());

        if (dto.getAssigneeId() != null) {
            User assignee = findUserById(dto.getAssigneeId());
            validateMembership(assignee, task.getStudyGroup());
            task.setAssignee(assignee);
        }

        return new TaskResponseDto(tasksRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long taskId, User currentUser) {
        Task task = findTaskById(taskId);
        validateMembership(currentUser, task.getStudyGroup());

        tasksRepository.delete(task);
    }

    // --- Private Helper Methods ---

    private Task findTaskById(Long id) {
        return tasksRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private StudyGroup findGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Study group not found with id: " + id));
    }

    private void validateMembership(User user, StudyGroup group) {
        if (user == null) {
            return;
        }

        boolean isMember = group.getMembers() != null && group.getMembers().stream()
                .anyMatch(member -> member.getUser() != null
                        && member.getUser().getId().equals(user.getId()));

        if (!isMember) {
            throw new BadRequestException("User " + user.getId() + " is not a member of group " + group.getId());
        }
    }
}