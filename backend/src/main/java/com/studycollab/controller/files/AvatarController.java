package com.studycollab.controller.files;

import com.studycollab.dto.auth.UserResponseDto;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.service.files.AvatarService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/avatars")
public class AvatarController {

    private final AvatarService avatarService;
    private final UserRepository userRepository;

    public AvatarController(AvatarService avatarService, UserRepository userRepository) {
        this.avatarService = avatarService;
        this.userRepository = userRepository;
    }

    // 💡 GET endpoint to return current user profile including avatarUrl
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
        }
        return ResponseEntity.ok(new UserResponseDto(currentUser));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("avatar") MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No image file provided."));
        }

        try {
            // 1. Upload to Cloudflare R2
            String avatarUrl = avatarService.uploadUserAvatar(file, currentUser.getId());

            // 2. Persist avatarUrl to database
            currentUser.setAvatarUrl(avatarUrl);
            userRepository.save(currentUser);

            // 3. Return response with new URL
            return ResponseEntity.ok(Map.of(
                    "message", "Avatar updated successfully",
                    "avatarUrl", avatarUrl
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload avatar: " + e.getMessage()));
        }
    }
}