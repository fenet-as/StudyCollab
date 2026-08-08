package com.studycollab.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Inbound payload for user registration.
 */
public record RegisterRequest(
        @NotBlank(message = "Full name cannot be blank")
        // Ensures the full name field is present and contains non-whitespace characters.
        @Size(max = 100, message = "Full name cannot exceed 100 characters")
        // Enforces a maximum length constraint of 100 characters on the full name.
        String fullName,

        @NotBlank(message = "Email address cannot be blank")
        // Ensures the email field is not empty or blank.
        @Email(message = "Invalid email formatting")
        // Validates that the input string conforms to a valid email format.
        String email,

        @NotBlank(message = "Password cannot be blank")
        // Ensures the user provides a non-blank password string.
        @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
        // Enforces a secure password length between 6 and 100 characters.
        String password
) {}