package com.studycollab.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChannelRequest {

    @NotBlank(message = "Channel name cannot be empty")
    @Size(min = 2, max = 50, message = "Channel name must be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Channel name may only contain alphanumeric characters, hyphens, and underscores")
    private String name;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
}

