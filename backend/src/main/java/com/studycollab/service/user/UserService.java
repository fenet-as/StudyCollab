package com.studycollab.service.user;

import com.studycollab.dto.auth.ChangePasswordRequest;
import com.studycollab.dto.auth.UpdateNameRequest;
import com.studycollab.dto.user.UserProfileResponse;

public interface UserService {
// Interface defining operations for managing user profiles, names, and passwords.

    UserProfileResponse getCurrentUserProfile(String email);
    // Method signature to fetch profile details for the authenticated user by email.

    UserProfileResponse getUserProfile(Long userId);
    // Method signature to fetch public profile details for a user by their database ID.

    void updateProfileName(String email, UpdateNameRequest request);
    // Method signature to update the target user's display name.

    void changePassword(String email, ChangePasswordRequest request);
    // Method signature to validate current credentials and update to a new password.
}