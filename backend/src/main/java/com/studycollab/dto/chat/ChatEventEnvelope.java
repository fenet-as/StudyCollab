package com.studycollab.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatEventEnvelope<T> {
    private ChatEventType type;
    private Long channelId;
    private LocalDateTime timestamp;
    private T payload;

    public static <T> ChatEventEnvelope<T> of(ChatEventType type, Long channelId, T payload) {
        return ChatEventEnvelope.<T>builder()
                .type(type)
                .channelId(channelId)
                .timestamp(LocalDateTime.now())
                .payload(payload)
                .build();
    }
}

