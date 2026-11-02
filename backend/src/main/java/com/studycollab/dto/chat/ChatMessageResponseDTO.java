package com.studycollab.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.studycollab.model.ChatMessage;
import com.studycollab.model.GroupRole;
import com.studycollab.model.MessageReaction;
import com.studycollab.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponseDTO {
    private Long id;
    private Long channelId;
    private String content;
    private SenderDTO sender;

    @JsonProperty("isPinned")
    private boolean isPinned;

    @JsonProperty("isDeleted")
    private boolean isDeleted;

    private ReplySnippetDTO replyTo;
    private List<ReactionSummaryDTO> reactions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SenderDTO {
        private Long id;
        private String name;
        private String avatarUrl;
        private GroupRole groupRole;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplySnippetDTO {
        private Long id;
        private String senderName;
        private String contentSnippet;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionSummaryDTO {
        private String emoji;
        private int count;
        private boolean reactedByMe;
    }

    public static ChatMessageResponseDTO fromEntity(ChatMessage msg, Long currentUserId, GroupRole senderRole) {
        if (msg == null) return null;

        User sender = msg.getSender();
        SenderDTO senderDTO = null;
        if (sender != null) {
            senderDTO = SenderDTO.builder()
                    .id(sender.getId())
                    .name(sender.getFullName())
                    .avatarUrl(sender.getAvatarUrl())
                    .groupRole(senderRole)
                    .build();
        }

        ReplySnippetDTO replyDTO = null;
        ChatMessage replyTo = msg.getReplyTo();
        if (replyTo != null) {
            String snippet = replyTo.isDeleted()
                    ? "This message was deleted"
                    : (replyTo.getContent().length() > 60
                        ? replyTo.getContent().substring(0, 57) + "..."
                        : replyTo.getContent());

            replyDTO = ReplySnippetDTO.builder()
                    .id(replyTo.getId())
                    .senderName(replyTo.getSender() != null ? replyTo.getSender().getFullName() : "Unknown")
                    .contentSnippet(snippet)
                    .build();
        }

        // Aggregate reactions
        List<ReactionSummaryDTO> reactionSummaries = new ArrayList<>();
        if (msg.getReactions() != null && !msg.getReactions().isEmpty()) {
            Map<String, List<MessageReaction>> grouped = msg.getReactions().stream()
                    .collect(Collectors.groupingBy(MessageReaction::getEmoji));

            for (Map.Entry<String, List<MessageReaction>> entry : grouped.entrySet()) {
                String emoji = entry.getKey();
                List<MessageReaction> list = entry.getValue();
                boolean reactedByMe = currentUserId != null && list.stream()
                        .anyMatch(r -> r.getUser() != null && currentUserId.equals(r.getUser().getId()));

                reactionSummaries.add(ReactionSummaryDTO.builder()
                        .emoji(emoji)
                        .count(list.size())
                        .reactedByMe(reactedByMe)
                        .build());
            }
        }

        String displayedContent = msg.isDeleted() ? "This message was deleted" : msg.getContent();

        return ChatMessageResponseDTO.builder()
                .id(msg.getId())
                .channelId(msg.getChannel() != null ? msg.getChannel().getId() : null)
                .content(displayedContent)
                .sender(senderDTO)
                .isPinned(msg.isPinned())
                .isDeleted(msg.isDeleted())
                .replyTo(replyDTO)
                .reactions(reactionSummaries)
                .createdAt(msg.getCreatedAt())
                .updatedAt(msg.getUpdatedAt())
                .build();
    }
}
