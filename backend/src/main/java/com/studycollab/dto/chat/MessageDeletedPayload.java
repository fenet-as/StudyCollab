package com.studycollab.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDeletedPayload {
    private Long id;

    @JsonProperty("isDeleted")
    private boolean isDeleted;
}
