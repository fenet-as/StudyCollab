package com.studycollab.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionUpdatedPayload {
    private Long messageId;
    private List<ReactionCountDTO> reactions;
}
