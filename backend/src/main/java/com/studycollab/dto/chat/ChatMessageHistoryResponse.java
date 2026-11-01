package com.studycollab.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageHistoryResponse {
    private Long channelId;
    private boolean hasMore;
    private Long nextCursor;
    @Builder.Default
    private List<ChatMessageResponseDTO> messages = new ArrayList<>();
}

