package com.studycollab.controller.tasks;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.studycollab.dto.tasks.TaskRequestDto;
import com.studycollab.dto.tasks.TaskResponseDto;
import com.studycollab.dto.tasks.TaskUpdateDto;
import com.studycollab.model.Task;
import com.studycollab.model.User;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.tasks.TasksService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TasksControllerIntegrationTest {

    @Mock
    private TasksService tasksService;

    @InjectMocks
    private TasksController tasksController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User authenticatedUser;
    private CustomUserDetails userDetails;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tasksController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        authenticatedUser = new User();
        ReflectionTestUtils.setField(authenticatedUser, "id", 42L);
        authenticatedUser.setEmail("developer@studycollab.com");
        authenticatedUser.setFullName("Developer User");
        authenticatedUser.setEnabled(true);

        userDetails = new CustomUserDetails(authenticatedUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateWithCustomUserDetails() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Nested
    @DisplayName("Principal Binding & Regression Tests for ISSUE-04")
    class PrincipalBindingTests {

        @Test
        @DisplayName("GET /api/tasks/group/{id} passes CustomUserDetails.getUser() to TasksService")
        void getTasksByGroup_WithCustomUserDetails_PassesCurrentUserToService() throws Exception {
            authenticateWithCustomUserDetails();

            when(tasksService.getTasksByGroup(eq(10L), any(User.class))).thenReturn(List.of());

            mockMvc.perform(get("/api/tasks/group/10"))
                    .andExpect(status().isOk());

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(tasksService).getTasksByGroup(eq(10L), userCaptor.capture());
            assertThat(userCaptor.getValue()).isNotNull();
            assertThat(userCaptor.getValue().getId()).isEqualTo(42L);
            assertThat(userCaptor.getValue().getEmail()).isEqualTo("developer@studycollab.com");
        }

        @Test
        @DisplayName("GET /api/tasks/group/{id} without authentication passes null to TasksService")
        void getTasksByGroup_WithoutAuthentication_PassesNullCurrentUser() throws Exception {
            SecurityContextHolder.clearContext();

            when(tasksService.getTasksByGroup(eq(10L), isNull())).thenReturn(List.of());

            mockMvc.perform(get("/api/tasks/group/10"))
                    .andExpect(status().isOk());

            verify(tasksService).getTasksByGroup(eq(10L), isNull());
        }

        @Test
        @DisplayName("POST /api/tasks passes CustomUserDetails.getUser() and validated DTO to TasksService")
        void createTask_WithCustomUserDetails_PassesCurrentUserAndDto() throws Exception {
            authenticateWithCustomUserDetails();

            TaskRequestDto dto = new TaskRequestDto();
            dto.setTitle("Implement Service Tests");
            dto.setDescription("Add unit and integration tests for all services");
            dto.setGroupId(10L);
            dto.setPriority(Task.Priority.HIGH);
            dto.setStatus(Task.Status.TODO);
            dto.setDueDate(LocalDate.now().plusDays(7));

            TaskResponseDto responseDto = mock(TaskResponseDto.class);

            when(tasksService.createTask(any(TaskRequestDto.class), any(User.class))).thenReturn(responseDto);

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isCreated());

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(tasksService).createTask(any(TaskRequestDto.class), userCaptor.capture());
            assertThat(userCaptor.getValue()).isNotNull();
            assertThat(userCaptor.getValue().getId()).isEqualTo(42L);
        }

        @Test
        @DisplayName("POST /api/tasks with invalid payload fails Bean Validation (400 Bad Request)")
        void createTask_InvalidDto_ReturnsBadRequest() throws Exception {
            authenticateWithCustomUserDetails();

            TaskRequestDto invalidDto = new TaskRequestDto();
            // title is null/blank, groupId is null -> violates @NotBlank and @NotNull

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidDto)))
                    .andExpect(status().isBadRequest());

            verify(tasksService, never()).createTask(any(), any());
        }

        @Test
        @DisplayName("PUT /api/tasks/{taskId} passes taskId and CustomUserDetails.getUser() to TasksService")
        void updateTask_WithCustomUserDetails_PassesCurrentUser() throws Exception {
            authenticateWithCustomUserDetails();

            TaskUpdateDto updateDto = new TaskUpdateDto();
            updateDto.setTitle("Updated Task Title");

            TaskResponseDto responseDto = mock(TaskResponseDto.class);

            when(tasksService.updateTask(eq(5L), any(TaskUpdateDto.class), any(User.class))).thenReturn(responseDto);

            mockMvc.perform(put("/api/tasks/5")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateDto)))
                    .andExpect(status().isOk());

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(tasksService).updateTask(eq(5L), any(TaskUpdateDto.class), userCaptor.capture());
            assertThat(userCaptor.getValue().getId()).isEqualTo(42L);
        }

        @Test
        @DisplayName("DELETE /api/tasks/{taskId} passes taskId and CustomUserDetails.getUser() to TasksService")
        void deleteTask_WithCustomUserDetails_PassesCurrentUser() throws Exception {
            authenticateWithCustomUserDetails();

            mockMvc.perform(delete("/api/tasks/5"))
                    .andExpect(status().isNoContent());

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(tasksService).deleteTask(eq(5L), userCaptor.capture());
            assertThat(userCaptor.getValue().getId()).isEqualTo(42L);
        }
    }
}
