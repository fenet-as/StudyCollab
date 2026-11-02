package com.studycollab.service.chat;

import com.studycollab.dto.chat.ChannelResponseDTO;
import com.studycollab.dto.chat.CreateChannelRequest;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.Channel;
import com.studycollab.model.GroupMember;
import com.studycollab.model.GroupRole;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.chat.ChannelRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChannelServiceTest {

    @Mock
    private ChannelRepository channelRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    private ChannelService channelService;

    private User testUser;
    private StudyGroup testGroup;

    @BeforeEach
    void setUp() {
        channelService = new ChannelService(channelRepository, groupRepository, groupMemberRepository);

        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setFullName("Alice Smith");
        testUser.setEmail("alice@example.com");

        testGroup = new StudyGroup();
        ReflectionTestUtils.setField(testGroup, "id", 10L);
        testGroup.setName("Computer Science Group");
    }

    @Nested
    @DisplayName("getChannelsByGroupId Tests")
    class GetChannelsTests {

        @Test
        @DisplayName("Returns channels when user is an active member")
        void getChannels_Success() {
            GroupMember member = new GroupMember();
            member.setStudyGroup(testGroup);
            member.setUser(testUser);
            member.setRole(GroupRole.MEMBER);

            Channel ch = Channel.builder()
                    .studyGroup(testGroup)
                    .name("general")
                    .isDefault(true)
                    .build();
            ReflectionTestUtils.setField(ch, "id", 101L);

            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(channelRepository.findByStudyGroupIdOrderByIdAsc(10L)).thenReturn(List.of(ch));

            List<ChannelResponseDTO> channels = channelService.getChannelsByGroupId(10L, testUser);

            assertThat(channels).hasSize(1);
            assertThat(channels.get(0).getName()).isEqualTo("general");
            assertThat(channels.get(0).isDefault()).isTrue();
        }

        @Test
        @DisplayName("Throws AccessDeniedException when user is not a group member")
        void getChannels_NonMember_ThrowsForbidden() {
            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> channelService.getChannelsByGroupId(10L, testUser))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("Auto-seeds #general channel if group has no channels")
        void getChannels_Empty_AutoSeedsGeneral() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
            when(channelRepository.findByStudyGroupIdOrderByIdAsc(10L)).thenReturn(Collections.emptyList());
            when(channelRepository.save(any(Channel.class))).thenAnswer(i -> {
                Channel c = i.getArgument(0);
                ReflectionTestUtils.setField(c, "id", 105L);
                return c;
            });

            List<ChannelResponseDTO> channels = channelService.getChannelsByGroupId(10L, testUser);

            assertThat(channels).hasSize(1);
            assertThat(channels.get(0).getName()).isEqualTo("general");
            assertThat(channels.get(0).isDefault()).isTrue();
            verify(channelRepository, times(1)).save(any(Channel.class));
        }
    }

    @Nested
    @DisplayName("createChannel Tests")
    class CreateChannelTests {

        @Test
        @DisplayName("Admin or Creator can create a new channel successfully")
        void createChannel_Success() {
            GroupMember admin = new GroupMember();
            admin.setRole(GroupRole.ADMIN);

            CreateChannelRequest request = CreateChannelRequest.builder()
                    .name("homework-help")
                    .description("Q&A for problem sets")
                    .build();

            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(admin));
            when(channelRepository.existsByStudyGroupIdAndName(10L, "homework-help")).thenReturn(false);
            when(channelRepository.save(any(Channel.class))).thenAnswer(i -> {
                Channel c = i.getArgument(0);
                ReflectionTestUtils.setField(c, "id", 200L);
                return c;
            });

            ChannelResponseDTO created = channelService.createChannel(10L, request, testUser);

            assertThat(created).isNotNull();
            assertThat(created.getId()).isEqualTo(200L);
            assertThat(created.getName()).isEqualTo("homework-help");
            assertThat(created.getDescription()).isEqualTo("Q&A for problem sets");
            assertThat(created.isDefault()).isFalse();
        }

        @Test
        @DisplayName("Standard member cannot create channels (throws 403)")
        void createChannel_StandardMember_ThrowsForbidden() {
            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);

            CreateChannelRequest request = CreateChannelRequest.builder()
                    .name("exam-prep")
                    .build();

            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));

            assertThatThrownBy(() -> channelService.createChannel(10L, request, testUser))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only group admins or creators");
        }

        @Test
        @DisplayName("Duplicate channel name throws BadRequestException")
        void createChannel_DuplicateName_ThrowsBadRequest() {
            GroupMember creator = new GroupMember();
            creator.setRole(GroupRole.CREATOR);

            CreateChannelRequest request = CreateChannelRequest.builder()
                    .name("general")
                    .build();

            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(creator));
            when(channelRepository.existsByStudyGroupIdAndName(10L, "general")).thenReturn(true);

            assertThatThrownBy(() -> channelService.createChannel(10L, request, testUser))
                    .isInstanceOf(CustomExceptions.BadRequestException.class)
                    .hasMessageContaining("already exists");
        }
    }

    @Nested
    @DisplayName("deleteChannel Tests")
    class DeleteChannelTests {

        @Test
        @DisplayName("Admin can delete a custom channel successfully")
        void deleteChannel_Success() {
            GroupMember admin = new GroupMember();
            admin.setRole(GroupRole.ADMIN);

            Channel ch = Channel.builder()
                    .studyGroup(testGroup)
                    .name("old-project")
                    .isDefault(false)
                    .build();
            ReflectionTestUtils.setField(ch, "id", 300L);

            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(admin));
            when(channelRepository.findById(300L)).thenReturn(Optional.of(ch));

            channelService.deleteChannel(10L, 300L, testUser);

            verify(channelRepository, times(1)).delete(ch);
        }

        @Test
        @DisplayName("Cannot delete the default channel")
        void deleteChannel_DefaultChannel_ThrowsBadRequest() {
            GroupMember creator = new GroupMember();
            creator.setRole(GroupRole.CREATOR);

            Channel ch = Channel.builder()
                    .studyGroup(testGroup)
                    .name("general")
                    .isDefault(true)
                    .build();
            ReflectionTestUtils.setField(ch, "id", 101L);

            when(groupRepository.findById(10L)).thenReturn(Optional.of(testGroup));
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(creator));
            when(channelRepository.findById(101L)).thenReturn(Optional.of(ch));

            assertThatThrownBy(() -> channelService.deleteChannel(10L, 101L, testUser))
                    .isInstanceOf(CustomExceptions.BadRequestException.class)
                    .hasMessageContaining("Cannot delete the default channel");
        }
    }
}

