package com.studycollab.service.chat;

import com.studycollab.dto.chat.ChatMessageHistoryResponse;
import com.studycollab.dto.chat.ChatMessageResponseDTO;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.*;
import com.studycollab.repository.chat.ChannelRepository;
import com.studycollab.repository.chat.ChatMessageRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChannelRepository channelRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional(readOnly = true)
    public ChatMessageHistoryResponse getMessageHistory(Long channelId, Long beforeId, Integer limit, User currentUser) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + channelId));

        Long groupId = channel.getStudyGroup().getId();
        validateMembership(groupId, currentUser);

        int queryLimit = (limit == null || limit <= 0) ? 50 : Math.min(limit, 100);
        Pageable pageable = PageRequest.of(0, queryLimit + 1);

        List<ChatMessage> queryResult;
        if (beforeId != null && beforeId > 0) {
            queryResult = chatMessageRepository.findByChannelIdAndIdLessThanOrderByIdDesc(channelId, beforeId, pageable);
        } else {
            queryResult = chatMessageRepository.findByChannelIdOrderByIdDesc(channelId, pageable);
        }

        boolean hasMore = queryResult.size() > queryLimit;
        List<ChatMessage> pageMessages = hasMore ? queryResult.subList(0, queryLimit) : queryResult;
        Long nextCursor = (hasMore && !pageMessages.isEmpty()) ? pageMessages.get(pageMessages.size() - 1).getId() : null;

        Map<Long, GroupRole> senderRoles = resolveSenderRoles(groupId, pageMessages);

        List<ChatMessageResponseDTO> dtos = pageMessages.stream()
                .map(msg -> {
                    GroupRole role = msg.getSender() != null ? senderRoles.get(msg.getSender().getId()) : null;
                    return ChatMessageResponseDTO.fromEntity(msg, currentUser.getId(), role);
                })
                .collect(Collectors.toList());

        return ChatMessageHistoryResponse.builder()
                .channelId(channelId)
                .hasMore(hasMore)
                .nextCursor(nextCursor)
                .messages(dtos)
                .build();
    }

    @Transactional
    public ChatMessageResponseDTO pinMessage(Long channelId, Long messageId, boolean isPinned, User currentUser) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + channelId));

        Long groupId = channel.getStudyGroup().getId();
        GroupMember callerMember = validateMembership(groupId, currentUser);

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Message not found with id: " + messageId));

        if (!message.getChannel().getId().equals(channelId)) {
            throw new CustomExceptions.ResourceNotFoundException("Message " + messageId + " does not belong to channel " + channelId);
        }

        message.setPinned(isPinned);
        ChatMessage saved = chatMessageRepository.save(message);

        GroupRole senderRole = message.getSender() != null
                ? groupMemberRepository.findByGroupIdAndUserId(groupId, message.getSender().getId())
                    .map(GroupMember::getRole)
                    .orElse(null)
                : null;

        return ChatMessageResponseDTO.fromEntity(saved, currentUser.getId(), senderRole);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDTO> getPinnedMessages(Long channelId, User currentUser) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + channelId));

        Long groupId = channel.getStudyGroup().getId();
        validateMembership(groupId, currentUser);

        List<ChatMessage> pinned = chatMessageRepository.findByChannelIdAndIsPinnedTrueOrderByIdDesc(channelId);
        Map<Long, GroupRole> senderRoles = resolveSenderRoles(groupId, pinned);

        return pinned.stream()
                .map(msg -> {
                    GroupRole role = msg.getSender() != null ? senderRoles.get(msg.getSender().getId()) : null;
                    return ChatMessageResponseDTO.fromEntity(msg, currentUser.getId(), role);
                })
                .collect(Collectors.toList());
    }

    private GroupMember validateMembership(Long groupId, User user) {
        if (user == null || user.getId() == null) {
            throw new AccessDeniedException("Authentication required to access chat messages");
        }
        return groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("User is not an active member of this study group"));
    }

    private Map<Long, GroupRole> resolveSenderRoles(Long groupId, List<ChatMessage> messages) {
        Set<Long> senderUserIds = messages.stream()
                .map(ChatMessage::getSender)
                .filter(Objects::nonNull)
                .map(User::getId)
                .collect(Collectors.toSet());

        Map<Long, GroupRole> roles = new HashMap<>();
        for (Long userId : senderUserIds) {
            groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                    .ifPresent(gm -> roles.put(userId, gm.getRole()));
        }
        return roles;
    }
}

