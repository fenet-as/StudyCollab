package com.studycollab.controller.files;

import com.studycollab.dto.files.AvatarUploadResponse;
import com.studycollab.dto.user.UserProfileResponse;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.files.AvatarService;
import com.studycollab.service.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/avatars")
public class AvatarController {

    private final AvatarService avatarService;
    private final UserService userService;

    public AvatarController(AvatarService avatarService, UserService userService) {
        this.avatarService = avatarService;
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserProfileResponse userDto = userService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/upload")
    public ResponseEntity<AvatarUploadResponse> uploadAvatar(
            @RequestParam("avatar") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        AvatarUploadResponse response = avatarService.processAndSaveAvatar(file, userDetails.getId());
        return ResponseEntity.ok(response);
    }
}