package com.studycollab.controller.chat;

import com.studycollab.dto.chat.ChannelResponseDTO;
import com.studycollab.dto.chat.CreateChannelRequest;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.chat.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<List<ChannelResponseDTO>> getChannels(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ChannelResponseDTO> channels = channelService.getChannelsByGroupId(groupId, userDetails.getUser());
        return ResponseEntity.ok(channels);
    }

    @PostMapping
    public ResponseEntity<ChannelResponseDTO> createChannel(
            @PathVariable Long groupId,
            @Valid @RequestBody CreateChannelRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ChannelResponseDTO created = channelService.createChannel(groupId, request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable Long groupId,
            @PathVariable Long channelId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        channelService.deleteChannel(groupId, channelId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}

