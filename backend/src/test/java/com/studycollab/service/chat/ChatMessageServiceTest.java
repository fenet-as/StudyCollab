package com.studycollab.service.chat;

import com.studycollab.dto.chat.ChatMessageHistoryResponse;
import com.studycollab.dto.chat.ChatMessageResponseDTO;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.*;
import com.studycollab.repository.chat.ChannelRepository;
import com.studycollab.repository.chat.ChatMessageRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
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

    private ChatMessageService chatMessageService;

    private User testUser;
    private StudyGroup testGroup;
    private Channel testChannel;

    @BeforeEach
    void setUp() {
        chatMessageService = new ChatMessageService(chatMessageRepository, channelRepository, groupMemberRepository);

        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setFullName("Alice Tester");

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
    @DisplayName("pinMessage Tests")
    class PinMessageTests {

        @Test
        @DisplayName("Pins message successfully and returns updated DTO")
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

