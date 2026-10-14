package com.studycollab.service.group;

import com.studycollab.dto.group.GroupOverviewDto;
import com.studycollab.exception.CustomExceptions.ResourceNotFoundException;
import com.studycollab.model.GroupMember;
import com.studycollab.repository.files.FilesRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.repository.notes.NotesRepository;
import com.studycollab.repository.tasks.TasksRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Proxy;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GroupOverviewServiceTest {

    private final Set<Long> existingGroups = new HashSet<>();
    private final Set<String> groupMemberSet = new HashSet<>();

    private GroupOverviewService groupOverviewService;

    @BeforeEach
    void setUp() {
        existingGroups.clear();
        groupMemberSet.clear();

        GroupRepository groupRepository = (GroupRepository) Proxy.newProxyInstance(
                GroupRepository.class.getClassLoader(),
                new Class<?>[]{GroupRepository.class},
                (proxy, method, args) -> {
                    if ("existsById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        return existingGroups.contains(id);
                    }
                    return null;
                }
        );

        GroupMemberRepository groupMemberRepository = (GroupMemberRepository) Proxy.newProxyInstance(
                GroupMemberRepository.class.getClassLoader(),
                new Class<?>[]{GroupMemberRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findByGroupIdAndUserId".equals(methodName)) {
                        Long groupId = (Long) args[0];
                        Long userId = (Long) args[1];
                        if (groupMemberSet.contains(groupId + ":" + userId)) {
                            return Optional.of(new GroupMember());
                        }
                        return Optional.empty();
                    } else if ("countByStudyGroupId".equals(methodName)) {
                        return 4L;
                    } else if ("findTop4ByStudyGroupIdOrderByJoinedAtAsc".equals(methodName)) {
                        return Collections.emptyList();
                    }
                    return null;
                }
        );

        NotesRepository notesRepository = (NotesRepository) Proxy.newProxyInstance(
                NotesRepository.class.getClassLoader(),
                new Class<?>[]{NotesRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("countByStudyGroupId".equals(methodName)) {
                        return 10L;
                    } else if ("findTop5ByStudyGroupIdOrderByUpdatedAtDesc".equals(methodName)) {
                        return Collections.emptyList();
                    }
                    return null;
                }
        );

        TasksRepository tasksRepository = (TasksRepository) Proxy.newProxyInstance(
                TasksRepository.class.getClassLoader(),
                new Class<?>[]{TasksRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("countByStudyGroupIdAndStatus".equals(methodName)) {
                        return 3L;
                    } else if ("findTop5ByStudyGroupIdAndStatusOrderByDueDateAsc".equals(methodName)) {
                        return Collections.emptyList();
                    }
                    return null;
                }
        );

        FilesRepository filesRepository = (FilesRepository) Proxy.newProxyInstance(
                FilesRepository.class.getClassLoader(),
                new Class<?>[]{FilesRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("countByStudyGroupId".equals(methodName)) {
                        return 7L;
                    } else if ("findTop5ByStudyGroupIdOrderByCreatedAtDesc".equals(methodName)) {
                        return Collections.emptyList();
                    }
                    return null;
                }
        );

        groupOverviewService = new GroupOverviewService(
                groupRepository,
                groupMemberRepository,
                notesRepository,
                tasksRepository,
                filesRepository
        );
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when group does not exist")
    void groupNotFound_throwsResourceNotFoundException() {
        assertThatThrownBy(() -> groupOverviewService.getGroupOverview(999L, 42L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Group not found with id: 999");
    }

    @Test
    @DisplayName("Should throw AccessDeniedException when requesting user is not a group member")
    void nonMember_throwsAccessDeniedException() {
        existingGroups.add(10L);
        // User 99 is not in groupMemberSet

        assertThatThrownBy(() -> groupOverviewService.getGroupOverview(10L, 99L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("User 99 is not a member of group 10");
    }

    @Test
    @DisplayName("Should return group overview successfully when user is an active group member")
    void member_returnsExpectedOverview() {
        Long groupId = 10L;
        Long userId = 42L;
        existingGroups.add(groupId);
        groupMemberSet.add(groupId + ":" + userId);

        GroupOverviewDto overview = groupOverviewService.getGroupOverview(groupId, userId);

        assertThat(overview).isNotNull();
        assertThat(overview.getStats()).isNotNull();
        assertThat(overview.getStats().getTotalNotes()).isEqualTo(10L);
        assertThat(overview.getStats().getPendingTasks()).isEqualTo(3L);
        assertThat(overview.getStats().getCompletedTasks()).isEqualTo(3L);
        assertThat(overview.getStats().getTotalFiles()).isEqualTo(7L);
        assertThat(overview.getStats().getTotalMembers()).isEqualTo(4L);
    }
}
