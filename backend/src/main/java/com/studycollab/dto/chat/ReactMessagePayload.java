package com.studycollab.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactMessagePayload {
    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotNull(message = "Channel ID is required")
    private Long channelId;

    @NotNull(message = "Message ID is required")
    private Long messageId;

    @NotBlank(message = "Emoji is required")
    @Size(max = 32, message = "Emoji length cannot exceed 32 characters")
    private String emoji;
}
