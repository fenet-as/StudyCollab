package com.studycollab.controller.auth;

import com.studycollab.dto.auth.ChangePasswordRequest;
import com.studycollab.dto.auth.UpdateNameRequest;
import com.studycollab.dto.common.ApiResponse;
import com.studycollab.dto.files.AvatarUploadResponse;
import com.studycollab.dto.user.UserProfileResponse;
import com.studycollab.model.User;
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
// Marks this class as a Spring REST controller that processes requests and returns JSON responses.
@RequestMapping("/api/users")
// Maps the base endpoint route for all user profile operations to "/api/users".
public class UserController {

    private final UserService userService;
    private final AvatarService avatarService;

    public UserController(UserService userService, AvatarService avatarService) {
        // Injects user profile service and dedicated avatar storage service dependencies via constructor.
        this.userService = userService;
        this.avatarService = avatarService;
    }

    @GetMapping("/me")
    // Maps GET requests sent to "/api/users/me" to fetch logged-in user profile details.
    public ResponseEntity<UserProfileResponse> getCurrentUser(Principal principal) {
        // Obtains authenticated user details from Spring Security via Principal object.

        UserProfileResponse response = userService.getCurrentUserProfile(principal.getName());
        // Delegates user profile retrieval logic to the user service using the authenticated user's email.

        return ResponseEntity.ok(response);
        // Returns an HTTP 200 OK response containing the profile payload.
    }

    @PutMapping("/profile")
    // Maps PUT requests sent to "/api/users/profile" to update profile details.
    public ResponseEntity<ApiResponse> updateProfileName(
            Principal principal,
            @Valid @RequestBody UpdateNameRequest request
    ) {
        // Receives and validates the payload containing the user's updated full name.

        userService.updateProfileName(principal.getName(), request);
        // Calls user service to apply the full name update for the authenticated user.

        return ResponseEntity.ok(ApiResponse.success("Profile name updated successfully"));
        // Returns an HTTP 200 OK response wrapping a success confirmation message.
    }

    @PutMapping("/avatar")
    // Maps PUT requests sent to "/api/users/avatar" for processing avatar file uploads.
    public ResponseEntity<AvatarUploadResponse> updateAvatar(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") MultipartFile file
    ) {
        // Injects the authenticated User domain model directly and binds the uploaded multipart file parameter.

        AvatarUploadResponse response = avatarService.processAndSaveAvatar(file, currentUser.getId());
        // Uploads the image to Cloudflare R2 storage and links the new avatar URL to the user's account ID.

        return ResponseEntity.ok(response);
        // Returns an HTTP 200 OK response containing the updated avatar file details and public URL.
    }

    @PutMapping("/change-password")
    // Maps PUT requests sent to "/api/users/change-password" to change passwords.
    public ResponseEntity<ApiResponse> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        // Receives and validates request body containing current and new password values.

        userService.changePassword(principal.getName(), request);
        // Calls user service to verify current credentials and encode the new password.

        return ResponseEntity.ok(ApiResponse.success("Password safety updated successfully"));
        // Returns an HTTP 200 OK status with a success message confirming the password update.
    }
}