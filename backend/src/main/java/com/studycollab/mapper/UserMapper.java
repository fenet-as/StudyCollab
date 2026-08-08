package com.studycollab.mapper;

import com.studycollab.dto.auth.UserResponseDto;
import com.studycollab.dto.user.UserProfileResponse;
import com.studycollab.model.User;

public final class UserMapper {
// Declares a final utility class for mapping User domain entities to various DTO representations.

    private UserMapper() {
        // Private constructor prevents instantiation of this utility class.
    }

    public static UserResponseDto toUserResponseDto(User user) {
        // Static method to convert a User entity into a UserResponseDto object.

        if (user == null) {
            // Checks if the incoming User entity object is null.

            return null;
            // Returns null to avoid throwing a NullPointerException during mapping.
        }

        return new UserResponseDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
                // Maps user fields to DTO, defaulting avatarUrl to an empty string if null.
        );
    }

    public static UserProfileResponse toUserProfileResponse(User user) {
        // Static method to convert a User entity into a UserProfileResponse object.

        if (user == null) {
            // Checks if the incoming User entity object is null.

            return null;
            // Returns null to avoid throwing a NullPointerException during mapping.
        }

        return new UserProfileResponse(
                user.getFullName(),
                user.getEmail(),
                user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
                // Maps user profile fields to DTO, defaulting avatarUrl to an empty string if null.
        );
    }
}