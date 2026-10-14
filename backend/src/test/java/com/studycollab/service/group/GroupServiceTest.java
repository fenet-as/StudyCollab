package com.studycollab.service.group;

import com.studycollab.dto.group.GroupCreateDto;
import com.studycollab.dto.group.GroupResponseDto;
import com.studycollab.dto.group.InviteLinkResponseDto;
import com.studycollab.dto.group.JoinGroupRequest;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.GroupMember;
import com.studycollab.model.GroupRole;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GroupServiceTest {

    private GroupRepository groupRepository;
    private GroupMemberRepository groupMemberRepository;
    private UserRepository userRepository;
    private GroupService groupService;

    private Map<Long, StudyGroup> groupMap;
    private Map<String, User> userEmailMap;
    private Map<String, GroupMember> membershipMap;
    private AtomicLong nextGroupId;

    private AtomicBoolean groupDeleted;
    private AtomicBoolean memberDeleted;

    @BeforeEach
    void setUp() {
        groupMap = new HashMap<>();
        userEmailMap = new HashMap<>();
        membershipMap = new HashMap<>();
        nextGroupId = new AtomicLong(100L);

        groupDeleted = new AtomicBoolean(false);
        memberDeleted = new AtomicBoolean(false);

        groupRepository = (GroupRepository) Proxy.newProxyInstance(
                GroupRepository.class.getClassLoader(),
                new Class<?>[]{GroupRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(groupMap.get(id));
                    } else if ("findByInviteCode".equals(name)) {
                        String code = (String) args[0];
                        return groupMap.values().stream()
                                .filter(g -> code != null && code.equalsIgnoreCase(g.getInviteCode()))
                                .findFirst();
                    } else if ("save".equals(name)) {
                        StudyGroup g = (StudyGroup) args[0];
                        if (g.getId() == null) {
                            g.setId(nextGroupId.incrementAndGet());
                        }
                        groupMap.put(g.getId(), g);
                        return g;
                    } else if ("delete".equals(name)) {
                        groupDeleted.set(true);
                        return null;
                    }
                    return null;
                }
        );

        groupMemberRepository = (GroupMemberRepository) Proxy.newProxyInstance(
                GroupMemberRepository.class.getClassLoader(),
                new Class<?>[]{GroupMemberRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findByGroupIdAndUserId".equals(name)) {
                        Long groupId = (Long) args[0];
                        Long userId = (Long) args[1];
                        return Optional.ofNullable(membershipMap.get(groupId + ":" + userId));
                    } else if ("save".equals(name)) {
                        GroupMember gm = (GroupMember) args[0];
                        if (gm.getStudyGroup() != null && gm.getUser() != null) {
                            membershipMap.put(gm.getStudyGroup().getId() + ":" + gm.getUser().getId(), gm);
                        }
                        return gm;
                    } else if ("delete".equals(name)) {
                        memberDeleted.set(true);
                        return null;
                    }
                    return null;
                }
        );

        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("findByEmail".equals(method.getName())) {
                        String email = (String) args[0];
                        return Optional.ofNullable(userEmailMap.get(email.toLowerCase()));
                    }
                    return null;
                }
        );

        groupService = new GroupService(groupRepository, groupMemberRepository, userRepository, null);
    }

    private User createUser(Long id, String email, String name) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setEmail(email);
        user.setFullName(name);
        userEmailMap.put(email.toLowerCase(), user);
        return user;
    }

    private GroupMember createMembership(StudyGroup group, User user, GroupRole role) {
        GroupMember member = new GroupMember();
        member.setStudyGroup(group);
        member.setUser(user);
        member.setRole(role);
        group.getMembers().add(member);
        membershipMap.put(group.getId() + ":" + user.getId(), member);
        return member;
    }

    private StudyGroup createGroup(Long id, String name) {
        StudyGroup group = new StudyGroup();
        group.setId(id);
        group.setName(name);
        group.setInviteCode("INV" + id);
        group.setMembers(new ArrayList<>());
        groupMap.put(id, group);
        return group;
    }

    @Nested
    @DisplayName("createGroup Tests")
    class CreateGroupTests {

        @Test
        @DisplayName("Successfully creates study group with CREATOR membership and generated invite code")
        void createGroup_Success() {
            User creator = createUser(10L, "creator@example.com", "Alice Creator");

            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("New Study Group");
            dto.setDescription("Study group for distributed systems");

            StudyGroup created = groupService.createGroup(dto, null, creator);

            assertThat(created).isNotNull();
            assertThat(created.getId()).isNotNull();
            assertThat(created.getName()).isEqualTo("New Study Group");
            assertThat(created.getDescription()).isEqualTo("Study group for distributed systems");
            assertThat(created.getInviteCode()).isNotBlank().hasSize(8);
            assertThat(created.getMembers()).hasSize(1);

            GroupMember member = created.getMembers().get(0);
            assertThat(member.getUser().getId()).isEqualTo(10L);
            assertThat(member.getRole()).isEqualTo(GroupRole.CREATOR);
        }
    }

    @Nested
    @DisplayName("getGroupById Tests")
    class GetGroupByIdTests {

        @Test
        @DisplayName("Returns group response DTO when group exists")
        void getGroupById_Found_ReturnsDto() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User creator = createUser(10L, "creator@example.com", "Alice Creator");
            createMembership(group, creator, GroupRole.CREATOR);

            GroupResponseDto dto = groupService.getGroupById(1L);

            assertThat(dto).isNotNull();
            assertThat(dto.getId()).isEqualTo(1L);
            assertThat(dto.getName()).isEqualTo("Algorithms Group");
            assertThat(dto.getMembers()).hasSize(1);
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when group does not exist")
        void getGroupById_NotFound_ThrowsResourceNotFoundException() {
            assertThatThrownBy(() -> groupService.getGroupById(999L))
                    .isInstanceOf(CustomExceptions.ResourceNotFoundException.class)
                    .hasMessageContaining("Study group not found with id: 999");
        }
    }

    @Nested
    @DisplayName("joinGroupByInviteCode Tests")
    class JoinGroupByInviteCodeTests {

        @Test
        @DisplayName("Successfully joins group with valid code as MEMBER")
        void joinGroupByInviteCode_ValidCode_Success() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            group.setInviteCode("ABC12345");
            User newStudent = createUser(20L, "new@example.com", "New Student");

            JoinGroupRequest request = new JoinGroupRequest("ABC12345");

            GroupResponseDto dto = groupService.joinGroupByInviteCode(request, "new@example.com");

            assertThat(dto).isNotNull();
            assertThat(dto.getId()).isEqualTo(1L);
            assertThat(group.getMembers()).anyMatch(m -> m.getUser().getId().equals(20L) && m.getRole() == GroupRole.MEMBER);
        }

        @Test
        @DisplayName("Successfully sanitizes and extracts code from full invite URL")
        void joinGroupByInviteCode_FullUrl_ExtractsCodeAndJoins() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            group.setInviteCode("JOINME99");
            User newStudent = createUser(20L, "new@example.com", "New Student");

            JoinGroupRequest request = new JoinGroupRequest("https://studycollab.com/join/JOINME99");

            GroupResponseDto dto = groupService.joinGroupByInviteCode(request, "new@example.com");

            assertThat(dto).isNotNull();
            assertThat(dto.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException for invalid or non-existent invite code")
        void joinGroupByInviteCode_InvalidCode_ThrowsResourceNotFoundException() {
            createUser(20L, "new@example.com", "New Student");
            JoinGroupRequest request = new JoinGroupRequest("UNKNOWN1");

            assertThatThrownBy(() -> groupService.joinGroupByInviteCode(request, "new@example.com"))
                    .isInstanceOf(CustomExceptions.ResourceNotFoundException.class)
                    .hasMessageContaining("Invalid or expired invite code");
        }

        @Test
        @DisplayName("Throws BadRequestException when user is already a group member")
        void joinGroupByInviteCode_AlreadyMember_ThrowsBadRequestException() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            group.setInviteCode("ABC12345");
            User existing = createUser(20L, "existing@example.com", "Existing Member");
            createMembership(group, existing, GroupRole.MEMBER);

            JoinGroupRequest request = new JoinGroupRequest("ABC12345");

            assertThatThrownBy(() -> groupService.joinGroupByInviteCode(request, "existing@example.com"))
                    .isInstanceOf(CustomExceptions.BadRequestException.class)
                    .hasMessageContaining("already a member of this study group");
        }

        @Test
        @DisplayName("Throws BadRequestException when invite code is empty or null")
        void joinGroupByInviteCode_EmptyCode_ThrowsBadRequestException() {
            JoinGroupRequest request = new JoinGroupRequest("   ");

            assertThatThrownBy(() -> groupService.joinGroupByInviteCode(request, "user@example.com"))
                    .isInstanceOf(CustomExceptions.BadRequestException.class)
                    .hasMessageContaining("Invite code cannot be empty");
        }
    }

    @Nested
    @DisplayName("regenerateInviteCode Tests")
    class RegenerateInviteCodeTests {

        @Test
        @DisplayName("CREATOR can regenerate invite code successfully")
        void regenerateInviteCode_asCreator_Success() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            group.setInviteCode("OLD_CODE");
            User creator = createUser(10L, "creator@example.com", "Alice Creator");
            createMembership(group, creator, GroupRole.CREATOR);

            InviteLinkResponseDto response = groupService.regenerateInviteCode(1L, "creator@example.com");

            assertThat(response).isNotNull();
            assertThat(response.getInviteCode()).isNotBlank().isNotEqualTo("OLD_CODE").hasSize(8);
            assertThat(group.getInviteCode()).isEqualTo(response.getInviteCode());
        }

        @Test
        @DisplayName("ADMIN can regenerate invite code successfully")
        void regenerateInviteCode_asAdmin_Success() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            group.setInviteCode("OLD_CODE");
            User admin = createUser(11L, "admin@example.com", "Bob Admin");
            createMembership(group, admin, GroupRole.ADMIN);

            InviteLinkResponseDto response = groupService.regenerateInviteCode(1L, "admin@example.com");

            assertThat(response).isNotNull();
            assertThat(response.getInviteCode()).isNotBlank().isNotEqualTo("OLD_CODE");
        }

        @Test
        @DisplayName("MEMBER cannot regenerate invite code and throws UnauthorizedException")
        void regenerateInviteCode_asMember_ThrowsUnauthorizedException() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User member = createUser(12L, "member@example.com", "Charlie Member");
            createMembership(group, member, GroupRole.MEMBER);

            assertThatThrownBy(() -> groupService.regenerateInviteCode(1L, "member@example.com"))
                    .isInstanceOf(CustomExceptions.UnauthorizedException.class)
                    .hasMessageContaining("administrative permission");
        }
    }

    @Nested
    @DisplayName("deleteGroup Tests")
    class DeleteGroupTests {

        @Test
        @DisplayName("CREATOR is authorized and successfully deletes group")
        void deleteGroup_asCreator_deletesSuccessfully() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User creator = createUser(10L, "creator@example.com", "Alice Creator");
            createMembership(group, creator, GroupRole.CREATOR);

            groupService.deleteGroup(1L, "creator@example.com");

            assertThat(groupDeleted.get()).isTrue();
        }

        @Test
        @DisplayName("ADMIN is not authorized to delete group and throws UnauthorizedException")
        void deleteGroup_asAdmin_throwsUnauthorizedException() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User admin = createUser(11L, "admin@example.com", "Bob Admin");
            createMembership(group, admin, GroupRole.ADMIN);

            assertThatThrownBy(() -> groupService.deleteGroup(1L, "admin@example.com"))
                    .isInstanceOf(CustomExceptions.UnauthorizedException.class)
                    .hasMessageContaining("Only the group owner is authorized to delete");

            assertThat(groupDeleted.get()).isFalse();
        }

        @Test
        @DisplayName("MEMBER is not authorized to delete group and throws UnauthorizedException")
        void deleteGroup_asMember_throwsUnauthorizedException() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User member = createUser(12L, "member@example.com", "Charlie Member");
            createMembership(group, member, GroupRole.MEMBER);

            assertThatThrownBy(() -> groupService.deleteGroup(1L, "member@example.com"))
                    .isInstanceOf(CustomExceptions.UnauthorizedException.class)
                    .hasMessageContaining("Only the group owner is authorized to delete");

            assertThat(groupDeleted.get()).isFalse();
        }

        @Test
        @DisplayName("Non-member throws UnauthorizedException")
        void deleteGroup_asNonMember_throwsUnauthorizedException() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User creator = createUser(10L, "creator@example.com", "Alice Creator");
            createMembership(group, creator, GroupRole.CREATOR);

            assertThatThrownBy(() -> groupService.deleteGroup(1L, "stranger@example.com"))
                    .isInstanceOf(CustomExceptions.UnauthorizedException.class);

            assertThat(groupDeleted.get()).isFalse();
        }

        @Test
        @DisplayName("Non-existent group throws ResourceNotFoundException")
        void deleteGroup_groupNotFound_throwsResourceNotFoundException() {
            assertThatThrownBy(() -> groupService.deleteGroup(999L, "creator@example.com"))
                    .isInstanceOf(CustomExceptions.ResourceNotFoundException.class)
                    .hasMessageContaining("Study group not found with id: 999");
        }
    }

    @Nested
    @DisplayName("leaveGroup Tests")
    class LeaveGroupTests {

        @Test
        @DisplayName("CREATOR cannot leave group and throws BadRequestException")
        void leaveGroup_asCreator_throwsBadRequestException() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User creator = createUser(10L, "creator@example.com", "Alice Creator");
            createMembership(group, creator, GroupRole.CREATOR);

            assertThatThrownBy(() -> groupService.leaveGroup(1L, "creator@example.com"))
                    .isInstanceOf(CustomExceptions.BadRequestException.class)
                    .hasMessageContaining("Group owners cannot leave the group");

            assertThat(memberDeleted.get()).isFalse();
            assertThat(group.getMembers()).hasSize(1);
        }

        @Test
        @DisplayName("ADMIN can leave group successfully")
        void leaveGroup_asAdmin_succeeds() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User admin = createUser(11L, "admin@example.com", "Bob Admin");
            GroupMember membership = createMembership(group, admin, GroupRole.ADMIN);

            groupService.leaveGroup(1L, "admin@example.com");

            assertThat(memberDeleted.get()).isTrue();
            assertThat(group.getMembers()).doesNotContain(membership);
        }

        @Test
        @DisplayName("MEMBER can leave group successfully")
        void leaveGroup_asMember_succeeds() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User member = createUser(12L, "member@example.com", "Charlie Member");
            GroupMember membership = createMembership(group, member, GroupRole.MEMBER);

            groupService.leaveGroup(1L, "member@example.com");

            assertThat(memberDeleted.get()).isTrue();
            assertThat(group.getMembers()).doesNotContain(membership);
        }

        @Test
        @DisplayName("Non-member throws UnauthorizedException")
        void leaveGroup_asNonMember_throwsUnauthorizedException() {
            StudyGroup group = createGroup(1L, "Algorithms Group");
            User stranger = createUser(99L, "stranger@example.com", "Stranger");

            assertThatThrownBy(() -> groupService.leaveGroup(1L, "stranger@example.com"))
                    .isInstanceOf(CustomExceptions.UnauthorizedException.class)
                    .hasMessageContaining("You are not a member of this study group");

            assertThat(memberDeleted.get()).isFalse();
        }

        @Test
        @DisplayName("Non-existent group throws ResourceNotFoundException")
        void leaveGroup_groupNotFound_throwsResourceNotFoundException() {
            createUser(10L, "user@example.com", "User");

            assertThatThrownBy(() -> groupService.leaveGroup(999L, "user@example.com"))
                    .isInstanceOf(CustomExceptions.ResourceNotFoundException.class)
                    .hasMessageContaining("Study group not found with id: 999");
        }
    }
}
