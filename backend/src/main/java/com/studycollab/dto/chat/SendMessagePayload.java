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
public class SendMessagePayload {
    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotNull(message = "Channel ID is required")
    private Long channelId;

    @NotBlank(message = "Message content must not be blank")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    private String content;

    private Long replyToId;
}
