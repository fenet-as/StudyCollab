package com.studycollab.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteMessagePayload {
    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotNull(message = "Channel ID is required")
    private Long channelId;

    @NotNull(message = "Message ID is required")
    private Long messageId;
}

