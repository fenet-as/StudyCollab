package com.studycollab.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateNameRequest(
// Inbound DTO record for handling user profile name update requests.

        @NotBlank(message = "Full name cannot be blank")
        // Ensures the full name field is not empty or composed solely of whitespace.

        @Size(max = 100, message = "Full name cannot exceed 100 characters")
        // Restricts the maximum length of the updated full name to 100 characters.

        String fullName
        // Stores the new full name value submitted by the user.
) {}