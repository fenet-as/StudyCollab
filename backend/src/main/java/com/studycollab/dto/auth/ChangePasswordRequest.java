package com.studycollab.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
// Inbound DTO record for authenticated password change operations.

        @NotBlank(message = "Current password cannot be blank")
        // Ensures the current password input field is not empty or blank.

        String currentPassword,
        // Stores the user's existing password for verification.

        @NotBlank(message = "New password cannot be blank")
        // Ensures the new password input field is not empty or blank.

        @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
        // Enforces length requirements ensuring the new password is between 6 and 100 characters.

        String newPassword
        // Stores the requested new password value to be hashed and saved.
) {}