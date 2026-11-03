package com.studycollab.controller.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studycollab.dto.chat.ChannelResponseDTO;
import com.studycollab.dto.chat.CreateChannelRequest;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.exception.GlobalExceptionHandler;
import com.studycollab.model.User;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.chat.ChannelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ChannelControllerTest {

    @Mock
    private ChannelService channelService;

    @InjectMocks
    private ChannelController channelController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private CustomUserDetails mockUserDetails;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setFullName("Alice Student");
        testUser.setEmail("alice@studycollab.com");

        mockUserDetails = new CustomUserDetails(testUser);

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(CustomUserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return mockUserDetails;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(channelController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
    }

    @Nested
    @DisplayName("GET /api/groups/{groupId}/channels")
    class GetChannelsTests {

        @Test
        @DisplayName("Returns 200 OK and channel list")
        void getChannels_Success() throws Exception {
            ChannelResponseDTO ch = ChannelResponseDTO.builder()
                    .id(1L)
                    .groupId(10L)
                    .name("general")
                    .isDefault(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(channelService.getChannelsByGroupId(eq(10L), any(User.class))).thenReturn(List.of(ch));

            mockMvc.perform(get("/api/groups/10/channels")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].name").value("general"))
                    .andExpect(jsonPath("$[0].isDefault").value(true));
        }

        @Test
        @DisplayName("Returns 403 Forbidden for non-member")
        void getChannels_NonMember_Forbidden() throws Exception {
            when(channelService.getChannelsByGroupId(eq(10L), any(User.class)))
                    .thenThrow(new AccessDeniedException("Not a member"));

            mockMvc.perform(get("/api/groups/10/channels")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/groups/{groupId}/channels")
    class CreateChannelTests {

        @Test
        @DisplayName("Returns 201 Created when channel is created")
        void createChannel_Success() throws Exception {
            CreateChannelRequest request = CreateChannelRequest.builder()
                    .name("project-prep")
                    .description("Project work")
                    .build();

            ChannelResponseDTO created = ChannelResponseDTO.builder()
                    .id(2L)
                    .groupId(10L)
                    .name("project-prep")
                    .description("Project work")
                    .isDefault(false)
                    .build();

            when(channelService.createChannel(eq(10L), any(CreateChannelRequest.class), any(User.class)))
                    .thenReturn(created);

            mockMvc.perform(post("/api/groups/10/channels")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(2L))
                    .andExpect(jsonPath("$.name").value("project-prep"));
        }

        @Test
        @DisplayName("Returns 400 Bad Request on invalid channel name")
        void createChannel_InvalidName_BadRequest() throws Exception {
            CreateChannelRequest request = CreateChannelRequest.builder()
                    .name("a") // too short, min is 2
                    .build();

            mockMvc.perform(post("/api/groups/10/channels")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/groups/{groupId}/channels/{channelId}")
    class DeleteChannelTests {

        @Test
        @DisplayName("Returns 204 No Content on successful deletion")
        void deleteChannel_Success() throws Exception {
            doNothing().when(channelService).deleteChannel(eq(10L), eq(2L), any(User.class));

            mockMvc.perform(delete("/api/groups/10/channels/2"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("Returns 400 Bad Request when attempting to delete default channel")
        void deleteChannel_DefaultChannel_BadRequest() throws Exception {
            doThrow(new CustomExceptions.BadRequestException("Cannot delete the default channel"))
                    .when(channelService).deleteChannel(eq(10L), eq(1L), any(User.class));

            mockMvc.perform(delete("/api/groups/10/channels/1"))
                    .andExpect(status().isBadRequest());
        }
    }
}

