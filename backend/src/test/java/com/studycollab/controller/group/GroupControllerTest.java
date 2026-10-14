package com.studycollab.controller.group;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studycollab.dto.group.*;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.exception.GlobalExceptionHandler;
import com.studycollab.service.group.GroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class GroupControllerTest {

    @Mock
    private GroupService groupService;

    @InjectMocks
    private GroupController groupController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private Principal mockPrincipal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(groupController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
        mockPrincipal = () -> "student@studycollab.com";
    }

    private GroupResponseDto createSampleGroupResponse(Long id, String name) {
        return new GroupResponseDto(
                id,
                name,
                "Description for " + name,
                null,
                "INV12345",
                LocalDateTime.now(),
                List.of()
        );
    }

    @Nested
    @DisplayName("DELETE /api/groups/{id} Tests")
    class DeleteGroupTests {

        @Test
        @DisplayName("Returns 204 No Content when group is deleted by creator")
        void deleteGroup_asCreator_returnsNoContent() throws Exception {
            doNothing().when(groupService).deleteGroup(10L, "student@studycollab.com");

            mockMvc.perform(delete("/api/groups/10").principal(mockPrincipal))
                    .andExpect(status().isNoContent());

            verify(groupService).deleteGroup(10L, "student@studycollab.com");
        }

        @Test
        @DisplayName("Returns structured 401 ErrorResponse when non-creator attempts deletion")
        void deleteGroup_asNonCreator_returnsStructuredErrorResponse() throws Exception {
            doThrow(new CustomExceptions.UnauthorizedException("Only the group owner is authorized to delete this study group."))
                    .when(groupService).deleteGroup(10L, "student@studycollab.com");

            mockMvc.perform(delete("/api/groups/10").principal(mockPrincipal))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.error").value("Unauthorized"))
                    .andExpect(jsonPath("$.message").value("Only the group owner is authorized to delete this study group."))
                    .andExpect(jsonPath("$.path").value("/api/groups/10"))
                    .andExpect(jsonPath("$.timestamp").exists());
        }

        @Test
        @DisplayName("Returns structured 404 ErrorResponse when group does not exist")
        void deleteGroup_notFound_returnsStructuredErrorResponse() throws Exception {
            doThrow(new CustomExceptions.ResourceNotFoundException("Study group not found with id: 999"))
                    .when(groupService).deleteGroup(999L, "student@studycollab.com");

            mockMvc.perform(delete("/api/groups/999").principal(mockPrincipal))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Not Found"))
                    .andExpect(jsonPath("$.message").value("Study group not found with id: 999"))
                    .andExpect(jsonPath("$.path").value("/api/groups/999"));
        }
    }

    @Nested
    @DisplayName("POST /api/groups/{groupId}/leave Tests")
    class LeaveGroupTests {

        @Test
        @DisplayName("Returns 200 with structured JSON message when leaving group successfully")
        void leaveGroup_member_returnsOk() throws Exception {
            doNothing().when(groupService).leaveGroup(10L, "student@studycollab.com");

            mockMvc.perform(post("/api/groups/10/leave").principal(mockPrincipal))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Successfully left the study group."));
        }

        @Test
        @DisplayName("Returns structured 400 ErrorResponse when creator attempts to leave")
        void leaveGroup_asCreator_returnsStructuredBadRequest() throws Exception {
            doThrow(new CustomExceptions.BadRequestException("Group owners cannot leave the group. You must delete the group if you no longer wish to maintain it."))
                    .when(groupService).leaveGroup(10L, "student@studycollab.com");

            mockMvc.perform(post("/api/groups/10/leave").principal(mockPrincipal))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Bad Request"))
                    .andExpect(jsonPath("$.message", containsString("Group owners cannot leave the group")))
                    .andExpect(jsonPath("$.path").value("/api/groups/10/leave"));
        }

        @Test
        @DisplayName("Returns structured 401 ErrorResponse when non-member calls leave")
        void leaveGroup_asNonMember_returnsStructuredUnauthorized() throws Exception {
            doThrow(new CustomExceptions.UnauthorizedException("You are not a member of this study group."))
                    .when(groupService).leaveGroup(10L, "student@studycollab.com");

            mockMvc.perform(post("/api/groups/10/leave").principal(mockPrincipal))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.message").value("You are not a member of this study group."));
        }
    }

    @Nested
    @DisplayName("POST /api/groups/join Tests")
    class JoinGroupTests {

        @Test
        @DisplayName("Returns 200 OK with GroupResponseDto when joining with valid invite code")
        void joinGroup_validCode_returnsOk() throws Exception {
            JoinGroupRequest request = new JoinGroupRequest("ABC12345");
            GroupResponseDto responseDto = createSampleGroupResponse(10L, "Joined Group");

            when(groupService.joinGroupByInviteCode(any(JoinGroupRequest.class), eq("student@studycollab.com")))
                    .thenReturn(responseDto);

            mockMvc.perform(post("/api/groups/join")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(10))
                    .andExpect(jsonPath("$.name").value("Joined Group"));
        }

        @Test
        @DisplayName("Returns structured 400 ErrorResponse when already a member")
        void joinGroup_alreadyMember_returnsStructuredBadRequest() throws Exception {
            JoinGroupRequest request = new JoinGroupRequest("ABC12345");

            when(groupService.joinGroupByInviteCode(any(JoinGroupRequest.class), eq("student@studycollab.com")))
                    .thenThrow(new CustomExceptions.BadRequestException("You are already a member of this study group."));

            mockMvc.perform(post("/api/groups/join")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.message").value("You are already a member of this study group."));
        }

        @Test
        @DisplayName("Returns structured 404 ErrorResponse when invite code is not found")
        void joinGroup_invalidCode_returnsStructuredNotFound() throws Exception {
            JoinGroupRequest request = new JoinGroupRequest("EXPIRED1");

            when(groupService.joinGroupByInviteCode(any(JoinGroupRequest.class), eq("student@studycollab.com")))
                    .thenThrow(new CustomExceptions.ResourceNotFoundException("Invalid or expired invite code."));

            mockMvc.perform(post("/api/groups/join")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.message").value("Invalid or expired invite code."));
        }
    }

    @Nested
    @DisplayName("PUT /api/groups/{groupId}/details Tests")
    class UpdateGroupDetailsTests {

        private GroupUpdateRequest createUpdateRequest(String name, String description) {
            GroupUpdateRequest req = new GroupUpdateRequest();
            req.setName(name);
            req.setDescription(description);
            return req;
        }

        @Test
        @DisplayName("Returns 200 OK with updated GroupResponseDto when creator updates details")
        void updateGroupDetails_asCreator_returnsOk() throws Exception {
            GroupUpdateRequest request = createUpdateRequest("Updated Name", "Updated Desc");
            GroupResponseDto responseDto = createSampleGroupResponse(10L, "Updated Name");

            when(groupService.updateGroupDetails(eq(10L), any(GroupUpdateRequest.class), eq("student@studycollab.com")))
                    .thenReturn(responseDto);

            mockMvc.perform(put("/api/groups/10/details")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Name"));
        }

        @Test
        @DisplayName("Returns structured 401 ErrorResponse when non-creator attempts update")
        void updateGroupDetails_nonCreator_returnsStructuredUnauthorized() throws Exception {
            GroupUpdateRequest request = createUpdateRequest("Updated Name", "Updated Desc");

            when(groupService.updateGroupDetails(eq(10L), any(GroupUpdateRequest.class), eq("student@studycollab.com")))
                    .thenThrow(new CustomExceptions.UnauthorizedException("Only the group creator is authorized to edit group details."));

            mockMvc.perform(put("/api/groups/10/details")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.message").value("Only the group creator is authorized to edit group details."));
        }
    }

    @Nested
    @DisplayName("POST /api/groups/{groupId}/invite-code/regenerate Tests")
    class RegenerateInviteCodeTests {

        @Test
        @DisplayName("Returns 200 OK with InviteLinkResponseDto when authorized")
        void regenerateInviteCode_authorized_returnsOk() throws Exception {
            InviteLinkResponseDto responseDto = new InviteLinkResponseDto("NEWCODE1");

            when(groupService.regenerateInviteCode(10L, "student@studycollab.com")).thenReturn(responseDto);

            mockMvc.perform(post("/api/groups/10/invite-code/regenerate").principal(mockPrincipal))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.inviteCode").value("NEWCODE1"));
        }

        @Test
        @DisplayName("Returns structured 401 ErrorResponse when caller lacks administrative permission")
        void regenerateInviteCode_unauthorized_returnsStructuredUnauthorized() throws Exception {
            when(groupService.regenerateInviteCode(10L, "student@studycollab.com"))
                    .thenThrow(new CustomExceptions.UnauthorizedException("You do not have administrative permission to perform this action."));

            mockMvc.perform(post("/api/groups/10/invite-code/regenerate").principal(mockPrincipal))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.message").value("You do not have administrative permission to perform this action."));
        }
    }
}
