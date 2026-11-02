package com.studycollab.security.chat;

import com.studycollab.model.GroupMember;
import com.studycollab.model.GroupRole;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.security.CustomUserDetailsService;
import com.studycollab.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StompChannelInterceptorTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private StompChannelInterceptor interceptor;

    private User testUser;
    private CustomUserDetails testUserDetails;

    @BeforeEach
    void setUp() {
        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 42L);
        ReflectionTestUtils.setField(testUser, "enabled", true);
        testUser.setFullName("STOMP Test User");
        testUser.setEmail("stomp@studycollab.com");

        testUserDetails = new CustomUserDetails(testUser);
    }

    @Nested
    @DisplayName("STOMP CONNECT Frame Tests")
    class ConnectTests {

        @Test
        @DisplayName("Successfully authenticates with valid Bearer token in Authorization header")
        void connect_ValidBearerToken_Authenticates() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer valid.jwt.token");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            Claims mockClaims = mock(Claims.class);
            when(jwtTokenProvider.parseAndValidateToken("valid.jwt.token")).thenReturn(Optional.of(mockClaims));
            when(jwtTokenProvider.getUserIdFromClaims(mockClaims)).thenReturn(42L);
            when(customUserDetailsService.loadUserById(42L)).thenReturn(testUserDetails);

            Message<?> result = interceptor.preSend(message, messageChannel);

            assertThat(result).isNotNull();
            StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
            assertThat(resultAccessor.getUser()).isNotNull();
            assertThat(resultAccessor.getUser().getName()).isEqualTo("stomp@studycollab.com");
        }

        @Test
        @DisplayName("Successfully authenticates with valid token in 'token' header")
        void connect_ValidTokenInTokenHeader_Authenticates() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("token", "raw.token.value");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            Claims mockClaims = mock(Claims.class);
            when(jwtTokenProvider.parseAndValidateToken("raw.token.value")).thenReturn(Optional.of(mockClaims));
            when(jwtTokenProvider.getUserIdFromClaims(mockClaims)).thenReturn(42L);
            when(customUserDetailsService.loadUserById(42L)).thenReturn(testUserDetails);

            Message<?> result = interceptor.preSend(message, messageChannel);

            assertThat(result).isNotNull();
            StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
            assertThat(resultAccessor.getUser()).isNotNull();
        }

        @Test
        @DisplayName("Rejects connection when Authorization header is absent")
        void connect_MissingToken_ThrowsAccessDenied() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Missing Authorization header");
        }

        @Test
        @DisplayName("Rejects connection when token is invalid or expired")
        void connect_InvalidToken_ThrowsAccessDenied() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer bad.token");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            when(jwtTokenProvider.parseAndValidateToken("bad.token")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Invalid or expired JWT token");
        }

        @Test
        @DisplayName("Rejects connection when user account is disabled")
        void connect_DisabledUser_ThrowsAccessDenied() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer valid.token");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            Claims mockClaims = mock(Claims.class);
            when(jwtTokenProvider.parseAndValidateToken("valid.token")).thenReturn(Optional.of(mockClaims));
            when(jwtTokenProvider.getUserIdFromClaims(mockClaims)).thenReturn(42L);

            User disabledUser = new User();
            ReflectionTestUtils.setField(disabledUser, "id", 42L);
            disabledUser.setFullName("Disabled User");
            disabledUser.setEmail("disabled@studycollab.com");
            // enabled is false
            CustomUserDetails disabledDetails = new CustomUserDetails(disabledUser);

            when(customUserDetailsService.loadUserById(42L)).thenReturn(disabledDetails);

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("disabled or locked");
        }
    }

    @Nested
    @DisplayName("STOMP SUBSCRIBE Frame Tests")
    class SubscribeTests {

        @Test
        @DisplayName("Allows subscription when user is an active member of the study group")
        void subscribe_ActiveMember_Allowed() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/group.10.channel.5");

            Authentication auth = new UsernamePasswordAuthenticationToken(testUserDetails, null, testUserDetails.getAuthorities());
            accessor.setUser(auth);
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            GroupMember member = new GroupMember();
            member.setRole(GroupRole.MEMBER);
            when(groupMemberRepository.findByGroupIdAndUserId(10L, 42L)).thenReturn(Optional.of(member));

            Message<?> result = interceptor.preSend(message, messageChannel);

            assertThat(result).isNotNull();
            verify(groupMemberRepository, times(1)).findByGroupIdAndUserId(10L, 42L);
        }

        @Test
        @DisplayName("Rejects subscription when user is NOT a member of the study group")
        void subscribe_NonMember_ThrowsAccessDenied() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/group.10.channel.5");

            Authentication auth = new UsernamePasswordAuthenticationToken(testUserDetails, null, testUserDetails.getAuthorities());
            accessor.setUser(auth);
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            when(groupMemberRepository.findByGroupIdAndUserId(10L, 42L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("not an active member of study group 10");
        }

        @Test
        @DisplayName("Rejects subscription when user is unauthenticated")
        void subscribe_Unauthenticated_ThrowsAccessDenied() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/group.10.channel.5");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Authentication required");
        }

        @Test
        @DisplayName("Passes non-group destinations through without membership check")
        void subscribe_NonGroupDestination_PassesThrough() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
            accessor.setDestination("/user/queue/errors");
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            Message<?> result = interceptor.preSend(message, messageChannel);

            assertThat(result).isNotNull();
            verify(groupMemberRepository, never()).findByGroupIdAndUserId(any(), any());
        }
    }

    @Nested
    @DisplayName("General STOMP Frame Tests")
    class GeneralFrameTests {

        @Test
        @DisplayName("DISCONNECT frame passes through untouched")
        void disconnect_PassesThrough() {
            StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.DISCONNECT);
            Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            Message<?> result = interceptor.preSend(message, messageChannel);

            assertThat(result).isNotNull();
            verifyNoInteractions(jwtTokenProvider, customUserDetailsService, groupMemberRepository);
        }
    }
}
