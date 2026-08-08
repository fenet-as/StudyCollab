package com.studycollab.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Inbound payload for user login authentication.
 */
public record LoginRequest(
        @NotBlank(message = "Email address cannot be blank")
        // Ensures the email input field is not empty or blank.
        @Email(message = "Invalid email formatting")
        // Validates that the provided email string follows standard email syntax.
        String email,

        @NotBlank(message = "Password cannot be blank")
        // Ensures the password field is supplied during authentication.
        String password
) {}