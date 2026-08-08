package com.studycollab.dto.auth;

/**
 * Immutable authentication token response payload.
 */
public record AuthResponse(
        Long id,
        // Represents the authenticated user's unique database ID.
        String token,
        // Stores the generated JSON Web Token (JWT) string.
        String tokenType,
        // Indicates the authorization scheme/type (e.g., "Bearer").
        String email
        // Stores the email address associated with the authenticated user account.
) {
    /**
     * Compact constructor defaulting token type to "Bearer".
     */
    public AuthResponse(Long id, String token, String email) {
        // Canonical constructor delegate initializing tokenType to "Bearer" automatically.
        this(id, token, "Bearer", email);
    }
}