package com.studycollab.dto.auth;

public record UserResponseDto(
// Decoupled response record used to transfer basic user data without exposing JPA entities.

        Long id,
        // Represents the unique primary key identifier of the user in the database.

        String fullName,
        // Represents the display full name of the user.

        String email,
        // Represents the user's registered email address.

        String avatarUrl
        // Represents the public URL location of the user's avatar image.
) {}