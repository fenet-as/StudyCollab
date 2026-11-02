package com.studycollab.security.chat;

import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.security.CustomUserDetailsService;
import com.studycollab.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class StompChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompChannelInterceptor.class);

    private static final Pattern GROUP_CHANNEL_TOPIC_PATTERN =
            Pattern.compile("^/topic/group\\.(\\d+)\\.channel\\.(\\d+)$");

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final GroupMemberRepository groupMemberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            if (!accessor.isMutable()) {
                StompHeaderAccessor mutableAccessor = StompHeaderAccessor.wrap(message);
                handleConnect(mutableAccessor);
                return org.springframework.messaging.support.MessageBuilder.createMessage(
                        message.getPayload(),
                        mutableAccessor.getMessageHeaders()
                );
            } else {
                handleConnect(accessor);
            }
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribe(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (!StringUtils.hasText(authHeader)) {
            authHeader = accessor.getFirstNativeHeader("token");
        }

        if (!StringUtils.hasText(authHeader)) {
            log.warn("STOMP CONNECT rejected: missing authorization header");
            throw new AccessDeniedException("Missing Authorization header in STOMP CONNECT frame");
        }

        String token = authHeader.startsWith("Bearer ")
                ? authHeader.substring(7).trim()
                : authHeader.trim();

        Optional<Claims> claimsOptional = jwtTokenProvider.parseAndValidateToken(token);
        if (claimsOptional.isEmpty()) {
            log.warn("STOMP CONNECT rejected: invalid or expired JWT token");
            throw new AccessDeniedException("Invalid or expired JWT token in STOMP CONNECT frame");
        }

        try {
            Long userId = jwtTokenProvider.getUserIdFromClaims(claimsOptional.get());
            UserDetails userDetails = customUserDetailsService.loadUserById(userId);

            if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                log.warn("STOMP CONNECT rejected: user account disabled or locked for id {}", userId);
                throw new AccessDeniedException("User account is disabled or locked");
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );

            accessor.setUser(authentication);
            log.debug("STOMP CONNECT authenticated successfully for user: {}", userDetails.getUsername());
        } catch (AccessDeniedException ade) {
            throw ade;
        } catch (Exception ex) {
            log.error("STOMP CONNECT authentication error: {}", ex.getMessage());
            throw new AccessDeniedException("Authentication failed for STOMP connection: " + ex.getMessage());
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (!StringUtils.hasText(destination)) {
            return;
        }

        Matcher matcher = GROUP_CHANNEL_TOPIC_PATTERN.matcher(destination);
        if (matcher.matches()) {
            Long groupId = Long.parseLong(matcher.group(1));

            Principal principal = accessor.getUser();
            if (principal == null) {
                log.warn("STOMP SUBSCRIBE rejected: unauthenticated attempt to subscribe to {}", destination);
                throw new AccessDeniedException("Authentication required to subscribe to group channels");
            }

            Long userId = extractUserId(principal);
            if (userId == null) {
                log.warn("STOMP SUBSCRIBE rejected: could not resolve user ID for {}", destination);
                throw new AccessDeniedException("Cannot determine authenticated user identity");
            }

            boolean isMember = groupMemberRepository.findByGroupIdAndUserId(groupId, userId).isPresent();
            if (!isMember) {
                log.warn("STOMP SUBSCRIBE rejected: user {} is not a member of group {}", userId, groupId);
                throw new AccessDeniedException("Access denied: user is not an active member of study group " + groupId);
            }

            log.debug("STOMP SUBSCRIBE authorized: user {} subscribed to {}", userId, destination);
        }
    }

    private Long extractUserId(Principal principal) {
        if (principal instanceof Authentication auth) {
            if (auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                return userDetails.getUser().getId();
            }
        }
        return null;
    }
}
