package com.studycollab.controller.chat;

import com.studycollab.dto.chat.DeleteMessagePayload;
import com.studycollab.dto.chat.EditMessagePayload;
import com.studycollab.dto.chat.ReactMessagePayload;
import com.studycollab.dto.chat.SendMessagePayload;
import com.studycollab.model.User;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.chat.ChatMessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Principal;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

    @Mock
    private ChatMessageService chatMessageService;

    @InjectMocks
    private ChatWebSocketController chatWebSocketController;

    private User testUser;
    private UsernamePasswordAuthenticationToken authPrincipal;

    @BeforeEach
    void setUp() {
        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setEmail("alice@studycollab.com");
        testUser.setFullName("Alice Tester");

        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        authPrincipal = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    @Test
    @DisplayName("sendMessage delegates to chatMessageService with authenticated user")
    void sendMessage_Success() {
        SendMessagePayload payload = SendMessagePayload.builder()
                .groupId(10L)
                .channelId(50L)
                .content("Hello STOMP")
                .build();

        chatWebSocketController.sendMessage(payload, authPrincipal);

        verify(chatMessageService).sendMessage(payload, testUser);
    }

    @Test
    @DisplayName("editMessage delegates to chatMessageService with authenticated user")
    void editMessage_Success() {
        EditMessagePayload payload = EditMessagePayload.builder()
                .groupId(10L)
                .channelId(50L)
                .messageId(101L)
                .content("Updated content")
                .build();

        chatWebSocketController.editMessage(payload, authPrincipal);

        verify(chatMessageService).editMessage(payload, testUser);
    }

    @Test
    @DisplayName("deleteMessage delegates to chatMessageService with authenticated user")
    void deleteMessage_Success() {
        DeleteMessagePayload payload = DeleteMessagePayload.builder()
                .groupId(10L)
                .channelId(50L)
                .messageId(101L)
                .build();

        chatWebSocketController.deleteMessage(payload, authPrincipal);

        verify(chatMessageService).deleteMessage(payload, testUser);
    }

    @Test
    @DisplayName("reactToMessage delegates to chatMessageService with authenticated user")
    void reactToMessage_Success() {
        ReactMessagePayload payload = ReactMessagePayload.builder()
                .groupId(10L)
                .channelId(50L)
                .messageId(101L)
                .emoji("🚀")
                .build();

        chatWebSocketController.reactToMessage(payload, authPrincipal);

        verify(chatMessageService).reactToMessage(payload, testUser);
    }

    @Test
    @DisplayName("Throws AccessDeniedException when principal is null or invalid")
    void extractUser_Unauthenticated_ThrowsException() {
        SendMessagePayload payload = SendMessagePayload.builder()
                .groupId(10L)
                .channelId(50L)
                .content("Hello")
                .build();

        Principal nonAuthPrincipal = () -> "anonymous";

        assertThatThrownBy(() -> chatWebSocketController.sendMessage(payload, nonAuthPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Unauthenticated");

        assertThatThrownBy(() -> chatWebSocketController.sendMessage(payload, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("handleException absorbs exceptions gracefully without rethrowing")
    void handleException_AbsorbsError() {
        assertThatCode(() -> chatWebSocketController.handleException(new RuntimeException("Test exception")))
                .doesNotThrowAnyException();
    }
}
