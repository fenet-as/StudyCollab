package com.studycollab.dto.notes;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class NoteRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String content;
    private Long groupId; // Optional: If associated with a specific study group
}