package com.studycollab.controller.chat;

import com.studycollab.dto.chat.DeleteMessagePayload;
import com.studycollab.dto.chat.EditMessagePayload;
import com.studycollab.dto.chat.ReactMessagePayload;
import com.studycollab.dto.chat.SendMessagePayload;
import com.studycollab.model.User;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.chat.ChatMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatMessageService chatMessageService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Valid @Payload SendMessagePayload payload, Principal principal) {
        User user = extractUser(principal);
        chatMessageService.sendMessage(payload, user);
    }

    @MessageMapping("/chat.edit")
    public void editMessage(@Valid @Payload EditMessagePayload payload, Principal principal) {
        User user = extractUser(principal);
        chatMessageService.editMessage(payload, user);
    }

    @MessageMapping("/chat.delete")
    public void deleteMessage(@Valid @Payload DeleteMessagePayload payload, Principal principal) {
        User user = extractUser(principal);
        chatMessageService.deleteMessage(payload, user);
    }

    @MessageMapping("/chat.react")
    public void reactToMessage(@Valid @Payload ReactMessagePayload payload, Principal principal) {
        User user = extractUser(principal);
        chatMessageService.reactToMessage(payload, user);
    }

    @MessageExceptionHandler
    public void handleException(Exception ex) {
        log.warn("Chat WebSocket message handling error: {}", ex.getMessage());
    }

    private User extractUser(Principal principal) {
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof CustomUserDetails cud) {
            return cud.getUser();
        }
        throw new AccessDeniedException("Unauthenticated STOMP client");
    }
}

