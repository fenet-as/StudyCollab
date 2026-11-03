package com.studycollab.config;

import com.studycollab.config.properties.CorsProperties;
import com.studycollab.security.chat.StompChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompChannelInterceptor stompChannelInterceptor;
    private final CorsProperties corsProperties;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory simple broker for broadcasting to channel topics and user private queues
        registry.enableSimpleBroker("/topic", "/queue");
        // Application prefix for incoming message mapping methods (@MessageMapping)
        registry.setApplicationDestinationPrefixes("/app");
        // User prefix for private user-scoped messages
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> originsList = corsProperties.getAllowedOrigins();
        String[] allowedOrigins = (originsList != null && !originsList.isEmpty())
                ? originsList.toArray(new String[0])
                : new String[]{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"};

        // SockJS fallback endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();

        // Native WebSocket endpoint (for modern STOMP clients like @stomp/stompjs)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Enforce JWT authentication on CONNECT and group authorization on SUBSCRIBE
        registration.interceptors(stompChannelInterceptor);
    }
}
