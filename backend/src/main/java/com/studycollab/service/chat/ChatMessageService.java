package com.studycollab.service.chat;

import com.studycollab.dto.chat.*;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.*;
import com.studycollab.repository.chat.ChannelRepository;
import com.studycollab.repository.chat.ChatMessageRepository;
import com.studycollab.repository.chat.MessageReactionRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChannelRepository channelRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
    public ChatMessageResponseDTO sendMessage(SendMessagePayload request, User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new AccessDeniedException("Authentication required to send chat messages");
        }

        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + request.getChannelId()));

        Long groupId = channel.getStudyGroup().getId();
        if (!groupId.equals(request.getGroupId())) {
            throw new CustomExceptions.BadRequestException("Channel does not belong to specified group: " + request.getGroupId());
        }

        GroupMember caller = validateMembership(groupId, currentUser);

        ChatMessage replyTo = null;
        if (request.getReplyToId() != null) {
            replyTo = chatMessageRepository.findById(request.getReplyToId())
                    .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Reply-to message not found with id: " + request.getReplyToId()));
            if (!replyTo.getChannel().getId().equals(request.getChannelId())) {
                throw new CustomExceptions.BadRequestException("Reply-to message does not belong to channel: " + request.getChannelId());
            }
        }

        ChatMessage message = ChatMessage.builder()
                .channel(channel)
                .sender(currentUser)
                .content(request.getContent().trim())
                .replyTo(replyTo)
                .isPinned(false)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        ChatMessageResponseDTO responseDTO = ChatMessageResponseDTO.fromEntity(saved, currentUser.getId(), caller.getRole());

        String destination = "/topic/group." + groupId + ".channel." + channel.getId();
        ChatEventEnvelope<ChatMessageResponseDTO> envelope = ChatEventEnvelope.of(
                ChatEventType.CHAT_MESSAGE,
                channel.getId(),
                responseDTO
        );
        messagingTemplate.convertAndSend(destination, envelope);

        return responseDTO;
    }

    @Transactional
    public MessageEditedPayload editMessage(EditMessagePayload request, User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new AccessDeniedException("Authentication required to edit chat messages");
        }

        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + request.getChannelId()));

        Long groupId = channel.getStudyGroup().getId();
        if (!groupId.equals(request.getGroupId())) {
            throw new CustomExceptions.BadRequestException("Channel does not belong to specified group: " + request.getGroupId());
        }

        validateMembership(groupId, currentUser);

        ChatMessage message = chatMessageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Message not found with id: " + request.getMessageId()));

        if (!message.getChannel().getId().equals(channel.getId())) {
            throw new CustomExceptions.BadRequestException("Message does not belong to channel: " + request.getChannelId());
        }

        if (message.isDeleted()) {
            throw new IllegalStateException("Cannot edit a deleted message");
        }

        if (message.getSender() == null || !message.getSender().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the message author can edit this message");
        }

        message.setContent(request.getContent().trim());
        message.setUpdatedAt(LocalDateTime.now());
        ChatMessage saved = chatMessageRepository.save(message);

        MessageEditedPayload payload = MessageEditedPayload.builder()
                .id(saved.getId())
                .content(saved.getContent())
                .updatedAt(saved.getUpdatedAt())
                .build();

        String destination = "/topic/group." + groupId + ".channel." + channel.getId();
        ChatEventEnvelope<MessageEditedPayload> envelope = ChatEventEnvelope.of(
                ChatEventType.MESSAGE_EDITED,
                channel.getId(),
                payload
        );
        messagingTemplate.convertAndSend(destination, envelope);

        return payload;
    }

    @Transactional
    public MessageDeletedPayload deleteMessage(DeleteMessagePayload request, User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new AccessDeniedException("Authentication required to delete chat messages");
        }

        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + request.getChannelId()));

        Long groupId = channel.getStudyGroup().getId();
        if (!groupId.equals(request.getGroupId())) {
            throw new CustomExceptions.BadRequestException("Channel does not belong to specified group: " + request.getGroupId());
        }

        GroupMember caller = validateMembership(groupId, currentUser);

        ChatMessage message = chatMessageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Message not found with id: " + request.getMessageId()));

        if (!message.getChannel().getId().equals(channel.getId())) {
            throw new CustomExceptions.BadRequestException("Message does not belong to channel: " + request.getChannelId());
        }

        boolean isAuthor = message.getSender() != null && message.getSender().getId().equals(currentUser.getId());
        boolean isAdminOrCreator = caller.getRole() == GroupRole.ADMIN || caller.getRole() == GroupRole.CREATOR;

        if (!isAuthor && !isAdminOrCreator) {
            throw new AccessDeniedException("You do not have permission to delete this message");
        }

        message.setDeleted(true);
        chatMessageRepository.save(message);

        MessageDeletedPayload payload = MessageDeletedPayload.builder()
                .id(message.getId())
                .isDeleted(true)
                .build();

        String destination = "/topic/group." + groupId + ".channel." + channel.getId();
        ChatEventEnvelope<MessageDeletedPayload> envelope = ChatEventEnvelope.of(
                ChatEventType.MESSAGE_DELETED,
                channel.getId(),
                payload
        );
        messagingTemplate.convertAndSend(destination, envelope);

        return payload;
    }

    @Transactional
    public ReactionUpdatedPayload reactToMessage(ReactMessagePayload request, User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new AccessDeniedException("Authentication required to react to chat messages");
        }

        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + request.getChannelId()));

        Long groupId = channel.getStudyGroup().getId();
        if (!groupId.equals(request.getGroupId())) {
            throw new CustomExceptions.BadRequestException("Channel does not belong to specified group: " + request.getGroupId());
        }

        validateMembership(groupId, currentUser);

        ChatMessage message = chatMessageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Message not found with id: " + request.getMessageId()));

        if (!message.getChannel().getId().equals(channel.getId())) {
            throw new CustomExceptions.BadRequestException("Message does not belong to channel: " + request.getChannelId());
        }

        if (message.isDeleted()) {
            throw new IllegalStateException("Cannot react to a deleted message");
        }

        Optional<MessageReaction> existing = messageReactionRepository.findByMessageIdAndUserIdAndEmoji(
                message.getId(), currentUser.getId(), request.getEmoji());

        if (existing.isPresent()) {
            messageReactionRepository.delete(existing.get());
        } else {
            MessageReaction reaction = MessageReaction.builder()
                    .message(message)
                    .user(currentUser)
                    .emoji(request.getEmoji())
                    .createdAt(LocalDateTime.now())
                    .build();
            messageReactionRepository.save(reaction);
        }

        List<MessageReaction> allReactions = messageReactionRepository.findByMessageId(message.getId());
        Map<String, Long> counts = allReactions.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji, Collectors.counting()));

        List<ReactionCountDTO> countDTOs = counts.entrySet().stream()
                .map(e -> new ReactionCountDTO(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(ReactionCountDTO::getEmoji))
                .collect(Collectors.toList());

        ReactionUpdatedPayload payload = ReactionUpdatedPayload.builder()
                .messageId(message.getId())
                .reactions(countDTOs)
                .build();

        String destination = "/topic/group." + groupId + ".channel." + channel.getId();
        ChatEventEnvelope<ReactionUpdatedPayload> envelope = ChatEventEnvelope.of(
                ChatEventType.REACTION_UPDATED,
                channel.getId(),
                payload
        );
        messagingTemplate.convertAndSend(destination, envelope);

        return payload;
    }

    @Transactional
    public ChatMessageResponseDTO pinMessage(Long channelId, Long messageId, boolean isPinned, User currentUser) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + channelId));

        Long groupId = channel.getStudyGroup().getId();
        validateMembership(groupId, currentUser);

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

        PinUpdatedPayload pinPayload = PinUpdatedPayload.builder()
                .messageId(saved.getId())
                .isPinned(saved.isPinned())
                .build();

        String destination = "/topic/group." + groupId + ".channel." + channel.getId();
        ChatEventEnvelope<PinUpdatedPayload> envelope = ChatEventEnvelope.of(
                ChatEventType.PIN_UPDATED,
                channel.getId(),
                pinPayload
        );
        messagingTemplate.convertAndSend(destination, envelope);

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
