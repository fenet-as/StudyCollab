package com.studycollab.service.tasks;

import com.studycollab.dto.tasks.TaskRequestDto;
import com.studycollab.dto.tasks.TaskResponseDto;
import com.studycollab.dto.tasks.TaskUpdateDto;
import com.studycollab.exception.CustomExceptions.BadRequestException;
import com.studycollab.model.GroupMember;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.Task;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.repository.tasks.TasksRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TasksServiceTest {

    private final Map<Long, StudyGroup> groupMap = new HashMap<>();
    private final Map<Long, Task> taskMap = new HashMap<>();
    private final Map<Long, User> userMap = new HashMap<>();

    private TasksService tasksService;

    @BeforeEach
    void setUp() {
        groupMap.clear();
        taskMap.clear();
        userMap.clear();

        TasksRepository tasksRepository = (TasksRepository) Proxy.newProxyInstance(
                TasksRepository.class.getClassLoader(),
                new Class<?>[]{TasksRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findById".equals(methodName)) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(taskMap.get(id));
                    } else if ("findByStudyGroupId".equals(methodName)) {
                        Long groupId = (Long) args[0];
                        List<Task> matching = new ArrayList<>();
                        for (Task t : taskMap.values()) {
                            if (t.getStudyGroup() != null && groupId.equals(t.getStudyGroup().getId())) {
                                matching.add(t);
                            }
                        }
                        return matching;
                    } else if ("save".equals(methodName)) {
                        Task task = (Task) args[0];
                        if (task.getId() == null) {
                            task.setId(new Random().nextLong(1, 100000));
                        }
                        taskMap.put(task.getId(), task);
                        return task;
                    } else if ("delete".equals(methodName)) {
                        Task task = (Task) args[0];
                        taskMap.remove(task.getId());
                        return null;
                    }
                    return null;
                }
        );

        GroupRepository groupRepository = (GroupRepository) Proxy.newProxyInstance(
                GroupRepository.class.getClassLoader(),
                new Class<?>[]{GroupRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(groupMap.get(id));
                    }
                    return null;
                }
        );

        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(userMap.get(id));
                    }
                    return null;
                }
        );

        tasksService = new TasksService(tasksRepository, userRepository, groupRepository);
    }

    private User createUser(Long id, String email) {
        User user = new User();
        try {
            java.lang.reflect.Field idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        user.setEmail(email);
        userMap.put(id, user);
        return user;
    }

    private StudyGroup createGroupWithMembers(Long groupId, User... members) {
        StudyGroup group = new StudyGroup();
        group.setId(groupId);
        group.setName("Test Group");

        List<GroupMember> memberList = new ArrayList<>();
        for (User user : members) {
            GroupMember member = new GroupMember();
            member.setId(new Random().nextLong(1, 10000));
            member.setUser(user);
            member.setStudyGroup(group);
            memberList.add(member);
        }
        group.setMembers(memberList);
        groupMap.put(groupId, group);
        return group;
    }

    private Task createTaskInGroup(Long taskId, StudyGroup group, User creator) {
        Task task = new Task("Task Title", "Task Desc", Task.Status.TODO, Task.Priority.HIGH, null, null, creator, group);
        task.setId(taskId);
        taskMap.put(taskId, task);
        return task;
    }

    @Nested
    @DisplayName("getTasksByGroup tests")
    class GetTasksByGroupTests {

        @Test
        @DisplayName("Should throw BadRequestException when currentUser is null")
        void nullUser_throwsBadRequestException() {
            createGroupWithMembers(1L);

            assertThatThrownBy(() -> tasksService.getTasksByGroup(1L, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Authenticated user is required");
        }

        @Test
        @DisplayName("Should throw BadRequestException when currentUser is not a group member")
        void nonMemberUser_throwsBadRequestException() {
            User member = createUser(10L, "member@test.com");
            User nonMember = createUser(99L, "nonmember@test.com");
            createGroupWithMembers(1L, member);

            assertThatThrownBy(() -> tasksService.getTasksByGroup(1L, nonMember))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("is not a member of group 1");
        }

        @Test
        @DisplayName("Should return tasks successfully when currentUser is a member")
        void memberUser_returnsTasksSuccessfully() {
            User member = createUser(10L, "member@test.com");
            StudyGroup group = createGroupWithMembers(1L, member);
            createTaskInGroup(101L, group, member);

            List<TaskResponseDto> tasks = tasksService.getTasksByGroup(1L, member);
            assertThat(tasks).hasSize(1);
            assertThat(tasks.get(0).getId()).isEqualTo(101L);
        }
    }

    @Nested
    @DisplayName("createTask tests")
    class CreateTaskTests {

        @Test
        @DisplayName("Should throw BadRequestException when creator is null")
        void nullCreator_throwsBadRequestException() {
            createGroupWithMembers(1L);
            TaskRequestDto dto = new TaskRequestDto();
            dto.setGroupId(1L);
            dto.setTitle("New Task");

            assertThatThrownBy(() -> tasksService.createTask(dto, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Authenticated user is required");
        }

        @Test
        @DisplayName("Should throw BadRequestException when creator is not a member")
        void nonMemberCreator_throwsBadRequestException() {
            User member = createUser(10L, "member@test.com");
            User nonMember = createUser(99L, "nonmember@test.com");
            createGroupWithMembers(1L, member);

            TaskRequestDto dto = new TaskRequestDto();
            dto.setGroupId(1L);
            dto.setTitle("New Task");

            assertThatThrownBy(() -> tasksService.createTask(dto, nonMember))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("is not a member of group 1");
        }

        @Test
        @DisplayName("Should create task successfully when creator is a member")
        void memberCreator_createsTaskSuccessfully() {
            User member = createUser(10L, "member@test.com");
            createGroupWithMembers(1L, member);

            TaskRequestDto dto = new TaskRequestDto();
            dto.setGroupId(1L);
            dto.setTitle("New Task");
            dto.setDescription("Task Description");
            dto.setPriority(Task.Priority.HIGH);
            dto.setStatus(Task.Status.TODO);
            dto.setDueDate(LocalDate.now().plusDays(5));

            TaskResponseDto response = tasksService.createTask(dto, member);
            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("New Task");
            assertThat(response.getCreatorId()).isEqualTo(10L);
        }
    }

    @Nested
    @DisplayName("updateTask tests")
    class UpdateTaskTests {

        @Test
        @DisplayName("Should throw BadRequestException when user updating task is null")
        void nullUser_throwsBadRequestException() {
            User member = createUser(10L, "member@test.com");
            StudyGroup group = createGroupWithMembers(1L, member);
            createTaskInGroup(101L, group, member);

            TaskUpdateDto dto = new TaskUpdateDto();
            dto.setTitle("Updated Title");

            assertThatThrownBy(() -> tasksService.updateTask(101L, dto, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Authenticated user is required");
        }

        @Test
        @DisplayName("Should throw BadRequestException when user updating task is not a member")
        void nonMemberUser_throwsBadRequestException() {
            User member = createUser(10L, "member@test.com");
            User nonMember = createUser(99L, "nonmember@test.com");
            StudyGroup group = createGroupWithMembers(1L, member);
            createTaskInGroup(101L, group, member);

            TaskUpdateDto dto = new TaskUpdateDto();
            dto.setTitle("Updated Title");

            assertThatThrownBy(() -> tasksService.updateTask(101L, dto, nonMember))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("is not a member of group 1");
        }
    }

    @Nested
    @DisplayName("deleteTask tests")
    class DeleteTaskTests {

        @Test
        @DisplayName("Should throw BadRequestException when user deleting task is null")
        void nullUser_throwsBadRequestException() {
            User member = createUser(10L, "member@test.com");
            StudyGroup group = createGroupWithMembers(1L, member);
            createTaskInGroup(101L, group, member);

            assertThatThrownBy(() -> tasksService.deleteTask(101L, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Authenticated user is required");
        }

        @Test
        @DisplayName("Should throw BadRequestException when user deleting task is not a member")
        void nonMemberUser_throwsBadRequestException() {
            User member = createUser(10L, "member@test.com");
            User nonMember = createUser(99L, "nonmember@test.com");
            StudyGroup group = createGroupWithMembers(1L, member);
            createTaskInGroup(101L, group, member);

            assertThatThrownBy(() -> tasksService.deleteTask(101L, nonMember))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("is not a member of group 1");
        }

        @Test
        @DisplayName("Should delete task successfully when user is a member")
        void memberUser_deletesTaskSuccessfully() {
            User member = createUser(10L, "member@test.com");
            StudyGroup group = createGroupWithMembers(1L, member);
            createTaskInGroup(101L, group, member);

            tasksService.deleteTask(101L, member);
            assertThat(taskMap).doesNotContainKey(101L);
        }
    }
}
