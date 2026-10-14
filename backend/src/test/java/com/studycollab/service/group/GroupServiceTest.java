package com.studycollab.service.group;

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

    private AtomicBoolean groupDeleted;
    private AtomicBoolean memberDeleted;

    @BeforeEach
    void setUp() {
        groupMap = new HashMap<>();
        userEmailMap = new HashMap<>();
        membershipMap = new HashMap<>();

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
        group.setMembers(new ArrayList<>());
        groupMap.put(id, group);
        return group;
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
