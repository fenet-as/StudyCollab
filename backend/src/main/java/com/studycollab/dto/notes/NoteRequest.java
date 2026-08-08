package com.studycollab.dto.notes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NoteRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(max = 50000, message = "Note content cannot exceed 50,000 characters")
    private String content;

    private Long groupId; // Optional: If associated with a specific study group
}