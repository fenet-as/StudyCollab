package com.studycollab.service.user;

import com.studycollab.dto.auth.ChangePasswordRequest;
import com.studycollab.dto.auth.UpdateNameRequest;
import com.studycollab.dto.user.UserProfileResponse;

public interface UserService {
    UserProfileResponse getCurrentUserProfile(String email);
    UserProfileResponse getUserProfile(Long userId);
    void updateProfileName(String email, UpdateNameRequest request);
    void changePassword(String email, ChangePasswordRequest request);
}