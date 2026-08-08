package com.studycollab.dto.tasks;

import com.studycollab.model.Task;
import java.time.LocalDate;

public class TaskResponseDto {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private Long assigneeId;
    private String assigneeName;
    private Long creatorId;      // ADDED
    private String creatorName;  // ADDED
    private Long groupId;

    public TaskResponseDto(Task task) {
        this.id = task.getId();
        this.title = task.getTitle();
        this.description = task.getDescription();
        this.status = task.getStatus().name();
        this.priority = task.getPriority().name();
        this.dueDate = (task.getDueDate() != null) ? task.getDueDate().toLocalDate() : null;
        this.groupId = task.getStudyGroup().getId();

        if (task.getAssignee() != null) {
            this.assigneeId = task.getAssignee().getId();
            this.assigneeName = task.getAssignee().getFullName();
        }

        // ADDED: Map creator database properties
        if (task.getCreator() != null) {
            this.creatorId = task.getCreator().getId();
            this.creatorName = task.getCreator().getFullName();
        }
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public String getPriority() { return priority; }
    public LocalDate getDueDate() { return dueDate; }
    public Long getAssigneeId() { return assigneeId; }
    public String getAssigneeName() { return assigneeName; }
    public Long getCreatorId() { return creatorId; } // ADDED
    public String getCreatorName() { return creatorName; } // ADDED
    public Long getGroupId() { return groupId; }
}