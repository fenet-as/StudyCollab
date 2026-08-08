package com.studycollab.dto.user;

public record UserProfileResponse(
// Immutable DTO record used to transfer user profile information to the client.

        String fullName,
        // Represents the display full name of the user.

        String email,
        // Represents the email address associated with the user account.

        String avatarUrl
        // Represents the public URL location of the user's avatar image.
) {}