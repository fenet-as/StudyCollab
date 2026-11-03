package com.studycollab.controller.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studycollab.dto.chat.ChatMessageHistoryResponse;
import com.studycollab.dto.chat.ChatMessageResponseDTO;
import com.studycollab.dto.chat.PinMessageRequest;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.exception.GlobalExceptionHandler;
import com.studycollab.model.GroupRole;
import com.studycollab.model.User;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.chat.ChatMessageService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ChatMessageControllerTest {

    @Mock
    private ChatMessageService chatMessageService;

    @InjectMocks
    private ChatMessageController chatMessageController;

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

        mockMvc = MockMvcBuilders.standaloneSetup(chatMessageController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
    }

    @Nested
    @DisplayName("GET /api/channels/{channelId}/messages")
    class GetMessagesTests {

        @Test
        @DisplayName("Returns 200 OK and paginated history")
        void getMessages_Success() throws Exception {
            ChatMessageResponseDTO msg = ChatMessageResponseDTO.builder()
                    .id(100L)
                    .channelId(50L)
                    .content("Hello World")
                    .sender(ChatMessageResponseDTO.SenderDTO.builder()
                            .id(1L)
                            .name("Alice")
                            .groupRole(GroupRole.MEMBER)
                            .build())
                    .createdAt(LocalDateTime.now())
                    .build();

            ChatMessageHistoryResponse response = ChatMessageHistoryResponse.builder()
                    .channelId(50L)
                    .hasMore(false)
                    .messages(List.of(msg))
                    .build();

            when(chatMessageService.getMessageHistory(eq(50L), eq(null), eq(50), any(User.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/channels/50/messages")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.channelId").value(50L))
                    .andExpect(jsonPath("$.messages[0].content").value("Hello World"));
        }

        @Test
        @DisplayName("Returns 404 when channel is not found")
        void getMessages_NotFound() throws Exception {
            when(chatMessageService.getMessageHistory(eq(999L), any(), any(), any()))
                    .thenThrow(new CustomExceptions.ResourceNotFoundException("Channel not found"));

            mockMvc.perform(get("/api/channels/999/messages"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PUT /api/channels/{channelId}/messages/{messageId}/pin")
    class PinMessageTests {

        @Test
        @DisplayName("Returns 200 OK with pinned message payload")
        void pinMessage_Success() throws Exception {
            PinMessageRequest request = new PinMessageRequest(true);

            ChatMessageResponseDTO response = ChatMessageResponseDTO.builder()
                    .id(100L)
                    .channelId(50L)
                    .content("Important Announcement")
                    .isPinned(true)
                    .build();

            when(chatMessageService.pinMessage(eq(50L), eq(100L), eq(true), any(User.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/channels/50/messages/100/pin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isPinned").value(true));
        }
    }

    @Nested
    @DisplayName("GET /api/channels/{channelId}/pinned")
    class GetPinnedMessagesTests {

        @Test
        @DisplayName("Returns 200 OK and list of pinned messages")
        void getPinnedMessages_Success() throws Exception {
            ChatMessageResponseDTO msg = ChatMessageResponseDTO.builder()
                    .id(100L)
                    .channelId(50L)
                    .content("Pinned Note")
                    .isPinned(true)
                    .build();

            when(chatMessageService.getPinnedMessages(eq(50L), any(User.class)))
                    .thenReturn(List.of(msg));

            mockMvc.perform(get("/api/channels/50/pinned"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].content").value("Pinned Note"))
                    .andExpect(jsonPath("$[0].isPinned").value(true));
        }
    }
}

