package com.studycollab.controller.group;

import com.studycollab.dto.group.GroupAvatarResponseDto;
import com.studycollab.service.group.GroupAvatarService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/groups/{groupId}/avatar")
public class GroupAvatarController {

    private final GroupAvatarService groupAvatarService;

    public GroupAvatarController(GroupAvatarService groupAvatarService) {
        this.groupAvatarService = groupAvatarService;
    }

    @PostMapping
    public ResponseEntity<GroupAvatarResponseDto> uploadAvatar(
            @PathVariable Long groupId,
            @RequestParam("file") MultipartFile file) {

        String avatarUrl = groupAvatarService.uploadGroupAvatar(groupId, file);
        return ResponseEntity.ok(new GroupAvatarResponseDto(groupId, avatarUrl));
    }

    @GetMapping
    public ResponseEntity<GroupAvatarResponseDto> getAvatar(@PathVariable Long groupId) {
        String avatarUrl = groupAvatarService.getGroupAvatarUrl(groupId);
        return ResponseEntity.ok(new GroupAvatarResponseDto(groupId, avatarUrl));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAvatar(@PathVariable Long groupId) {
        groupAvatarService.deleteGroupAvatar(groupId);
        return ResponseEntity.noContent().build();
    }
}