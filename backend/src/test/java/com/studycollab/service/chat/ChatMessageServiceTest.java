package com.studycollab.service.chat;

import com.studycollab.dto.chat.*;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.*;
import com.studycollab.repository.chat.ChannelRepository;
import com.studycollab.repository.chat.ChatMessageRepository;
import com.studycollab.repository.chat.MessageReactionRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ChannelRepository channelRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private MessageReactionRepository messageReactionRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private ChatMessageService chatMessageService;

    private User testUser;
    private User otherUser;
    private StudyGroup testGroup;
    private Channel testChannel;

    @BeforeEach
    void setUp() {
        chatMessageService = new ChatMessageService(
                chatMessageRepository,
                channelRepository,
                groupMemberRepository,
                messageReactionRepository,
                messagingTemplate
        );

        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setFullName("Alice Tester");

        otherUser = new User();
        ReflectionTestUtils.setField(otherUser, "id", 2L);
        otherUser.setFullName("Bob Member");

        testGroup = new StudyGroup();
        ReflectionTestUtils.setField(testGroup, "id", 10L);

        testChannel = Channel.builder()
                .studyGroup(testGroup)
                .name("general")
                .isDefault(true)
                .build();
        ReflectionTestUtils.setField(testChannel, "id", 50L);
    }

    @Nested
    @DisplayName("getMessageHistory Tests")
    class GetMessageHistoryTests {

        @Test
        @DisplayName("Returns messages and cursor correctly")
        void getMessageHistory_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage m1 = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("Message 2")
                    .build();
            ReflectionTestUtils.setField(m1, "id", 20L);

            ChatMessage m2 = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("Message 1")
                    .build();
            ReflectionTestUtils.setField(m2, "id", 19L);

            List<ChatMessage> queryResult = List.of(m1, m2);

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findByChannelIdOrderByIdDesc(eq(50L), any(Pageable.class))).thenReturn(queryResult);

            ChatMessageHistoryResponse response = chatMessageService.getMessageHistory(50L, null, 10, testUser);

            assertThat(response).isNotNull();
            assertThat(response.getChannelId()).isEqualTo(50L);
            assertThat(response.isHasMore()).isFalse();
            assertThat(response.getNextCursor()).isNull();
            assertThat(response.getMessages()).hasSize(2);
            assertThat(response.getMessages().get(0).getContent()).isEqualTo("Message 2");
        }

        @Test
        @DisplayName("Masks deleted message content")
        void getMessageHistory_DeletedMessage_MaskedContent() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage m = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("Secret sensitive text")
                    .isDeleted(true)
                    .build();
            ReflectionTestUtils.setField(m, "id", 30L);

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findByChannelIdOrderByIdDesc(eq(50L), any(Pageable.class))).thenReturn(List.of(m));

            ChatMessageHistoryResponse response = chatMessageService.getMessageHistory(50L, null, 10, testUser);

            assertThat(response.getMessages().get(0).getContent()).isEqualTo("This message was deleted");
            assertThat(response.getMessages().get(0).isDeleted()).isTrue();
        }

        @Test
        @DisplayName("Throws AccessDeniedException if caller is not a group member")
        void getMessageHistory_NonMember_ThrowsForbidden() {
            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> chatMessageService.getMessageHistory(50L, null, 10, testUser))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("sendMessage Tests")
    class SendMessageTests {

        @Test
        @DisplayName("Successfully creates message and broadcasts CHAT_MESSAGE event")
        void sendMessage_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            SendMessagePayload payload = SendMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .content("Hello World!")
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(i -> {
                ChatMessage msg = i.getArgument(0);
                ReflectionTestUtils.setField(msg, "id", 101L);
                return msg;
            });

            ChatMessageResponseDTO result = chatMessageService.sendMessage(payload, testUser);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(101L);
            assertThat(result.getContent()).isEqualTo("Hello World!");
            assertThat(result.getSender().getName()).isEqualTo("Alice Tester");

            ArgumentCaptor<ChatEventEnvelope> captor = ArgumentCaptor.forClass(ChatEventEnvelope.class);
            verify(messagingTemplate).convertAndSend(eq("/topic/group.10.channel.50"), captor.capture());
            assertThat(captor.getValue().getType()).isEqualTo(ChatEventType.CHAT_MESSAGE);
            assertThat(captor.getValue().getChannelId()).isEqualTo(50L);
        }

        @Test
        @DisplayName("Attaches replyTo when valid replyToId is provided")
        void sendMessage_WithReplyTo_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage originalMsg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(otherUser)
                    .content("Original question")
                    .build();
            ReflectionTestUtils.setField(originalMsg, "id", 80L);

            SendMessagePayload payload = SendMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .content("Here is my answer")
                    .replyToId(80L)
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(80L)).thenReturn(Optional.of(originalMsg));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(i -> {
                ChatMessage msg = i.getArgument(0);
                ReflectionTestUtils.setField(msg, "id", 102L);
                return msg;
            });

            ChatMessageResponseDTO result = chatMessageService.sendMessage(payload, testUser);

            assertThat(result.getReplyTo()).isNotNull();
            assertThat(result.getReplyTo().getId()).isEqualTo(80L);
            assertThat(result.getReplyTo().getSenderName()).isEqualTo("Bob Member");
            assertThat(result.getReplyTo().getContentSnippet()).isEqualTo("Original question");
        }

        @Test
        @DisplayName("Throws AccessDeniedException if caller is not in group")
        void sendMessage_NonMember_ThrowsForbidden() {
            SendMessagePayload payload = SendMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .content("Hi")
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> chatMessageService.sendMessage(payload, testUser))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("editMessage Tests")
    class EditMessageTests {

        @Test
        @DisplayName("Author can edit message and broadcasts MESSAGE_EDITED event")
        void editMessage_Author_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("Old content")
                    .build();
            ReflectionTestUtils.setField(msg, "id", 99L);

            EditMessagePayload payload = EditMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(99L)
                    .content("Edited new content")
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(99L)).thenReturn(Optional.of(msg));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(i -> i.getArgument(0));

            MessageEditedPayload result = chatMessageService.editMessage(payload, testUser);

            assertThat(result.getContent()).isEqualTo("Edited new content");
            assertThat(result.getId()).isEqualTo(99L);

            ArgumentCaptor<ChatEventEnvelope> captor = ArgumentCaptor.forClass(ChatEventEnvelope.class);
            verify(messagingTemplate).convertAndSend(eq("/topic/group.10.channel.50"), captor.capture());
            assertThat(captor.getValue().getType()).isEqualTo(ChatEventType.MESSAGE_EDITED);
        }

        @Test
        @DisplayName("Non-author cannot edit message and throws AccessDeniedException")
        void editMessage_NonAuthor_ThrowsForbidden() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(otherUser)
                    .content("Bob's message")
                    .build();
            ReflectionTestUtils.setField(msg, "id", 99L);

            EditMessagePayload payload = EditMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(99L)
                    .content("Trying to edit")
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(99L)).thenReturn(Optional.of(msg));

            assertThatThrownBy(() -> chatMessageService.editMessage(payload, testUser))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("author");
        }

        @Test
        @DisplayName("Editing deleted message throws IllegalStateException")
        void editMessage_DeletedMessage_ThrowsException() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("Deleted message")
                    .isDeleted(true)
                    .build();
            ReflectionTestUtils.setField(msg, "id", 99L);

            EditMessagePayload payload = EditMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(99L)
                    .content("Trying to edit deleted")
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(99L)).thenReturn(Optional.of(msg));

            assertThatThrownBy(() -> chatMessageService.editMessage(payload, testUser))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("deleteMessage Tests")
    class DeleteMessageTests {

        @Test
        @DisplayName("Author can soft-delete message and broadcasts MESSAGE_DELETED event")
        void deleteMessage_Author_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("To be deleted")
                    .build();
            ReflectionTestUtils.setField(msg, "id", 77L);

            DeleteMessagePayload payload = DeleteMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(77L)
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(77L)).thenReturn(Optional.of(msg));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(i -> i.getArgument(0));

            MessageDeletedPayload result = chatMessageService.deleteMessage(payload, testUser);

            assertThat(result.isDeleted()).isTrue();
            assertThat(msg.isDeleted()).isTrue();

            ArgumentCaptor<ChatEventEnvelope> captor = ArgumentCaptor.forClass(ChatEventEnvelope.class);
            verify(messagingTemplate).convertAndSend(eq("/topic/group.10.channel.50"), captor.capture());
            assertThat(captor.getValue().getType()).isEqualTo(ChatEventType.MESSAGE_DELETED);
        }

        @Test
        @DisplayName("Group ADMIN can delete another user's message")
        void deleteMessage_Admin_Success() {
            GroupMember adminMember = new GroupMember();
            adminMember.setRole(GroupRole.ADMIN);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(otherUser)
                    .content("Inappropriate content")
                    .build();
            ReflectionTestUtils.setField(msg, "id", 78L);

            DeleteMessagePayload payload = DeleteMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(78L)
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(adminMember));
            when(chatMessageRepository.findById(78L)).thenReturn(Optional.of(msg));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(i -> i.getArgument(0));

            MessageDeletedPayload result = chatMessageService.deleteMessage(payload, testUser);

            assertThat(result.isDeleted()).isTrue();
            assertThat(msg.isDeleted()).isTrue();
        }

        @Test
        @DisplayName("Non-admin member cannot delete another user's message")
        void deleteMessage_NonAdminNonAuthor_ThrowsForbidden() {
            GroupMember regularMember = new GroupMember();
            regularMember.setRole(GroupRole.MEMBER);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(otherUser)
                    .content("Bob's post")
                    .build();
            ReflectionTestUtils.setField(msg, "id", 79L);

            DeleteMessagePayload payload = DeleteMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(79L)
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(regularMember));
            when(chatMessageRepository.findById(79L)).thenReturn(Optional.of(msg));

            assertThatThrownBy(() -> chatMessageService.deleteMessage(payload, testUser))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("reactToMessage Tests")
    class ReactToMessageTests {

        @Test
        @DisplayName("Toggles reaction on when reaction does not exist")
        void reactToMessage_AddReaction_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(otherUser)
                    .content("Great work!")
                    .build();
            ReflectionTestUtils.setField(msg, "id", 60L);

            ReactMessagePayload payload = ReactMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(60L)
                    .emoji("👍")
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(60L)).thenReturn(Optional.of(msg));
            when(messageReactionRepository.findByMessageIdAndUserIdAndEmoji(60L, 1L, "👍"))
                    .thenReturn(Optional.empty());

            MessageReaction savedReaction = MessageReaction.builder()
                    .message(msg)
                    .user(testUser)
                    .emoji("👍")
                    .build();
            when(messageReactionRepository.findByMessageId(60L)).thenReturn(List.of(savedReaction));

            ReactionUpdatedPayload result = chatMessageService.reactToMessage(payload, testUser);

            verify(messageReactionRepository).save(any(MessageReaction.class));
            assertThat(result.getMessageId()).isEqualTo(60L);
            assertThat(result.getReactions()).hasSize(1);
            assertThat(result.getReactions().get(0).getEmoji()).isEqualTo("👍");
            assertThat(result.getReactions().get(0).getCount()).isEqualTo(1L);

            ArgumentCaptor<ChatEventEnvelope> captor = ArgumentCaptor.forClass(ChatEventEnvelope.class);
            verify(messagingTemplate).convertAndSend(eq("/topic/group.10.channel.50"), captor.capture());
            assertThat(captor.getValue().getType()).isEqualTo(ChatEventType.REACTION_UPDATED);
        }

        @Test
        @DisplayName("Toggles reaction off when reaction already exists")
        void reactToMessage_RemoveReaction_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage msg = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(otherUser)
                    .content("Nice job!")
                    .build();
            ReflectionTestUtils.setField(msg, "id", 61L);

            MessageReaction existingReaction = MessageReaction.builder()
                    .message(msg)
                    .user(testUser)
                    .emoji("❤️")
                    .build();

            ReactMessagePayload payload = ReactMessagePayload.builder()
                    .groupId(10L)
                    .channelId(50L)
                    .messageId(61L)
                    .emoji("❤️")
                    .build();

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(61L)).thenReturn(Optional.of(msg));
            when(messageReactionRepository.findByMessageIdAndUserIdAndEmoji(61L, 1L, "❤️"))
                    .thenReturn(Optional.of(existingReaction));
            when(messageReactionRepository.findByMessageId(61L)).thenReturn(List.of());

            ReactionUpdatedPayload result = chatMessageService.reactToMessage(payload, testUser);

            verify(messageReactionRepository).delete(existingReaction);
            assertThat(result.getMessageId()).isEqualTo(61L);
            assertThat(result.getReactions()).isEmpty();
        }
    }

    @Nested
    @DisplayName("pinMessage Tests")
    class PinMessageTests {

        @Test
        @DisplayName("Pins message successfully and broadcasts PIN_UPDATED event")
        void pinMessage_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.ADMIN);

            ChatMessage m = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("Important notice")
                    .isPinned(false)
                    .build();
            ReflectionTestUtils.setField(m, "id", 100L);

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findById(100L)).thenReturn(Optional.of(m));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(i -> i.getArgument(0));

            ChatMessageResponseDTO result = chatMessageService.pinMessage(50L, 100L, true, testUser);

            assertThat(result.isPinned()).isTrue();
            verify(chatMessageRepository, times(1)).save(m);

            ArgumentCaptor<ChatEventEnvelope> captor = ArgumentCaptor.forClass(ChatEventEnvelope.class);
            verify(messagingTemplate).convertAndSend(eq("/topic/group.10.channel.50"), captor.capture());
            assertThat(captor.getValue().getType()).isEqualTo(ChatEventType.PIN_UPDATED);
        }
    }

    @Nested
    @DisplayName("getPinnedMessages Tests")
    class GetPinnedMessagesTests {

        @Test
        @DisplayName("Returns only pinned messages for the channel")
        void getPinnedMessages_Success() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            ChatMessage m = ChatMessage.builder()
                    .channel(testChannel)
                    .sender(testUser)
                    .content("Pinned announcement")
                    .isPinned(true)
                    .build();
            ReflectionTestUtils.setField(m, "id", 100L);

            when(channelRepository.findById(50L)).thenReturn(Optional.of(testChannel));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(chatMessageRepository.findByChannelIdAndIsPinnedTrueOrderByIdDesc(50L)).thenReturn(List.of(m));

            List<ChatMessageResponseDTO> pinned = chatMessageService.getPinnedMessages(50L, testUser);

            assertThat(pinned).hasSize(1);
            assertThat(pinned.get(0).getContent()).isEqualTo("Pinned announcement");
            assertThat(pinned.get(0).isPinned()).isTrue();
        }
    }
}
