package com.studycollab.controller.chat;

import com.studycollab.dto.chat.ChatMessageHistoryResponse;
import com.studycollab.dto.chat.ChatMessageResponseDTO;
import com.studycollab.dto.chat.PinMessageRequest;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.chat.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/channels/{channelId}")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @GetMapping("/messages")
    public ResponseEntity<ChatMessageHistoryResponse> getMessages(
            @PathVariable Long channelId,
            @RequestParam(required = false) Long before,
            @RequestParam(defaultValue = "50") Integer limit,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ChatMessageHistoryResponse response = chatMessageService.getMessageHistory(channelId, before, limit, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/messages/{messageId}/pin")
    public ResponseEntity<ChatMessageResponseDTO> pinMessage(
            @PathVariable Long channelId,
            @PathVariable Long messageId,
            @RequestBody PinMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ChatMessageResponseDTO response = chatMessageService.pinMessage(channelId, messageId, request.isPinned(), userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pinned")
    public ResponseEntity<List<ChatMessageResponseDTO>> getPinnedMessages(
            @PathVariable Long channelId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ChatMessageResponseDTO> response = chatMessageService.getPinnedMessages(channelId, userDetails.getUser());
        return ResponseEntity.ok(response);
    }
}

