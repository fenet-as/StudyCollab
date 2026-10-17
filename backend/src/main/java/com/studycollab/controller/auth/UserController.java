package com.studycollab.controller.auth;

import com.studycollab.dto.auth.ChangePasswordRequest;
import com.studycollab.dto.auth.UpdateNameRequest;
import com.studycollab.dto.common.ApiResponse;
import com.studycollab.dto.files.AvatarUploadResponse;
import com.studycollab.dto.user.UserProfileResponse;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.files.AvatarService;
import com.studycollab.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AvatarService avatarService;

    public UserController(UserService userService, AvatarService avatarService) {
        this.userService = userService;
        this.avatarService = avatarService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Principal principal) {
        UserProfileResponse response = userService.getCurrentUserProfile(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfileName(
            Principal principal,
            @Valid @RequestBody UpdateNameRequest request
    ) {
        userService.updateProfileName(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile name updated successfully"));
    }

    @PutMapping("/avatar")
    public ResponseEntity<AvatarUploadResponse> updateAvatar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file
    ) {
        // Fix: Extracted ID cleanly from CustomUserDetails instead of casting to User
        AvatarUploadResponse response = avatarService.processAndSaveAvatar(file, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password safety updated successfully"));
    }
}