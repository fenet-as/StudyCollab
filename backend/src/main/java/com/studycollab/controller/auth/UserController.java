// backend/src/main/java/com/studycollab/controller/auth/UserController.java
package com.studycollab.controller.auth;

import com.studycollab.dto.auth.ChangePasswordRequest;
import com.studycollab.dto.auth.UpdateNameRequest;
import com.studycollab.model.User;
import com.studycollab.service.auth.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 💡 GET /api/users/me
     * Pulls the current user details on mounting the settings layout
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        try {
            String email = principal.getName();
            User user = authService.getUserByEmail(email);

            return ResponseEntity.ok(Map.of(
                    "fullName", user.getFullName(),
                    "email", user.getEmail(),
                    "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * PUT /api/users/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfileName(Principal principal, @RequestBody UpdateNameRequest request) {
        try {
            String email = principal.getName();
            authService.updateProfileName(email, request);
            return ResponseEntity.ok(Map.of("message", "Profile name updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 💡 PUT /api/users/avatar
     * Accepts modern dynamic multipart form files for uploading picture changes
     */
    @PutMapping("/avatar")
    public ResponseEntity<?> updateAvatar(Principal principal, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File cannot be completely empty"));
            }

            String email = principal.getName();

            // For production apps, save files to an external S3 bucket/disk storage cluster here.
            // For rapid local testing, we simulate a local save and echo back a clean runtime asset key string:
            String syntheticStoragePath = "/assets/avatars/" + email.replaceAll("[^a-zA-Z0-9]", "") + "_" + file.getOriginalFilename();

            authService.updateAvatarUrl(email, syntheticStoragePath);

            return ResponseEntity.ok(Map.of(
                    "message", "Profile photo uploaded successfully",
                    "avatarUrl", syntheticStoragePath
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * PUT /api/users/change-password
     */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Principal principal, @RequestBody ChangePasswordRequest request) {
        try {
            String email = principal.getName();
            authService.changePassword(email, request);
            return ResponseEntity.ok(Map.of("message", "Password safety updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}