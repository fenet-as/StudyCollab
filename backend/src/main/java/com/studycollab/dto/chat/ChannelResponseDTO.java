package com.studycollab.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.studycollab.model.Channel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelResponseDTO {
    private Long id;
    private Long groupId;
    private String name;
    private String description;

    @JsonProperty("isDefault")
    private boolean isDefault;

    private LocalDateTime createdAt;

    public static ChannelResponseDTO fromEntity(Channel channel) {
        if (channel == null) return null;
        return ChannelResponseDTO.builder()
                .id(channel.getId())
                .groupId(channel.getStudyGroup() != null ? channel.getStudyGroup().getId() : null)
                .name(channel.getName())
                .description(channel.getDescription())
                .isDefault(channel.isDefault())
                .createdAt(channel.getCreatedAt())
                .build();
    }
}
