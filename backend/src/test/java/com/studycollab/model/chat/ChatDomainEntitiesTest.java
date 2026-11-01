package com.studycollab.model.chat;

import com.studycollab.dto.group.GroupCreateDto;
import com.studycollab.model.*;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.chat.ChannelRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.service.group.GroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatDomainEntitiesTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChannelRepository channelRepository;

    private GroupService groupService;

    @BeforeEach
    void setUp() {
        groupService = new GroupService(
                groupRepository,
                groupMemberRepository,
                userRepository,
                null,
                channelRepository
        );
    }

    @Test
    @DisplayName("Channel entity initializes correctly with builder and defaults")
    void channelEntity_BuilderAndDefaults() {
        User creator = new User();
        ReflectionTestUtils.setField(creator, "id", 1L);

        StudyGroup group = new StudyGroup();
        ReflectionTestUtils.setField(group, "id", 10L);

        Channel channel = Channel.builder()
                .studyGroup(group)
                .name("general")
                .description("Default group channel")
                .isDefault(true)
                .createdBy(creator)
                .build();

        // trigger onCreate prePersist
        channel.onCreate();

        assertThat(channel.getName()).isEqualTo("general");
        assertThat(channel.getDescription()).isEqualTo("Default group channel");
        assertThat(channel.isDefault()).isTrue();
        assertThat(channel.getStudyGroup().getId()).isEqualTo(10L);
        assertThat(channel.getCreatedBy().getId()).isEqualTo(1L);
        assertThat(channel.getCreatedAt()).isNotNull();
        assertThat(channel.getMessages()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ChatMessage entity supports replies, reactions, pin and soft delete")
    void chatMessageEntity_LifecycleAndRelations() {
        User sender = new User();
        ReflectionTestUtils.setField(sender, "id", 5L);

        Channel channel = Channel.builder().name("general").build();
        ReflectionTestUtils.setField(channel, "id", 20L);

        ChatMessage parentMessage = ChatMessage.builder()
                .channel(channel)
                .sender(sender)
                .content("Parent message content")
                .build();
        parentMessage.onCreate();

        ChatMessage replyMessage = ChatMessage.builder()
                .channel(channel)
                .sender(sender)
                .content("Reply to parent message")
                .replyTo(parentMessage)
                .isPinned(true)
                .build();
        replyMessage.onCreate();

        assertThat(replyMessage.getContent()).isEqualTo("Reply to parent message");
        assertThat(replyMessage.getReplyTo()).isEqualTo(parentMessage);
        assertThat(replyMessage.isPinned()).isTrue();
        assertThat(replyMessage.isDeleted()).isFalse();
        assertThat(replyMessage.getCreatedAt()).isNotNull();

        // test soft delete and update
        replyMessage.setDeleted(true);
        replyMessage.onUpdate();
        assertThat(replyMessage.isDeleted()).isTrue();
        assertThat(replyMessage.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("MessageReaction entity binds message, user, and emoji")
    void messageReactionEntity_Creation() {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 7L);

        ChatMessage message = ChatMessage.builder().content("Great note!").build();
        ReflectionTestUtils.setField(message, "id", 101L);

        MessageReaction reaction = MessageReaction.builder()
                .message(message)
                .user(user)
                .emoji("🚀")
                .build();
        reaction.onCreate();

        assertThat(reaction.getEmoji()).isEqualTo("🚀");
        assertThat(reaction.getMessage().getId()).isEqualTo(101L);
        assertThat(reaction.getUser().getId()).isEqualTo(7L);
        assertThat(reaction.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("GroupService.createGroup automatically seeds default '#general' channel")
    void createGroup_AutomaticallySeedsGeneralChannel() {
        User creator = new User();
        ReflectionTestUtils.setField(creator, "id", 1L);

        when(groupRepository.save(any(StudyGroup.class))).thenAnswer(invocation -> {
            StudyGroup g = invocation.getArgument(0);
            ReflectionTestUtils.setField(g, "id", 50L);
            return g;
        });

        GroupCreateDto dto = new GroupCreateDto();
        dto.setName("Algorithms Study Group");
        dto.setDescription("Preparing for finals");

        StudyGroup created = groupService.createGroup(dto, null, creator);

        assertThat(created).isNotNull();
        assertThat(created.getId()).isEqualTo(50L);

        // Verify channelRepository.save was called for default channel
        ArgumentCaptor<Channel> channelCaptor = ArgumentCaptor.forClass(Channel.class);
        verify(channelRepository, times(1)).save(channelCaptor.capture());

        Channel savedChannel = channelCaptor.getValue();
        assertThat(savedChannel.getName()).isEqualTo("general");
        assertThat(savedChannel.isDefault()).isTrue();
        assertThat(savedChannel.getStudyGroup().getId()).isEqualTo(50L);
        assertThat(savedChannel.getCreatedBy().getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getOrCreateDefaultChannel returns existing channel if present")
    void getOrCreateDefaultChannel_ReturnsExisting_WhenFound() {
        StudyGroup group = new StudyGroup();
        ReflectionTestUtils.setField(group, "id", 99L);

        Channel existing = Channel.builder()
                .studyGroup(group)
                .name("general")
                .isDefault(true)
                .build();

        when(channelRepository.findByStudyGroupIdAndIsDefaultTrue(99L)).thenReturn(Optional.of(existing));

        User user = new User();
        Channel result = groupService.getOrCreateDefaultChannel(99L, user);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("general");
        verify(channelRepository, never()).save(any(Channel.class));
    }

    @Test
    @DisplayName("getOrCreateDefaultChannel creates general channel if absent")
    void getOrCreateDefaultChannel_CreatesGeneral_WhenAbsent() {
        StudyGroup group = new StudyGroup();
        ReflectionTestUtils.setField(group, "id", 88L);

        User user = new User();
        ReflectionTestUtils.setField(user, "id", 15L);

        when(channelRepository.findByStudyGroupIdAndIsDefaultTrue(88L)).thenReturn(Optional.empty());
        when(groupRepository.findById(88L)).thenReturn(Optional.of(group));
        when(channelRepository.save(any(Channel.class))).thenAnswer(i -> i.getArgument(0));

        Channel result = groupService.getOrCreateDefaultChannel(88L, user);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("general");
        assertThat(result.isDefault()).isTrue();
        assertThat(result.getStudyGroup().getId()).isEqualTo(88L);
        verify(channelRepository, times(1)).save(any(Channel.class));
    }
}

