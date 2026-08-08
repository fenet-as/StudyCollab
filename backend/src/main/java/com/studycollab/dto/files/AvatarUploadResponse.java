package com.studycollab.dto.files;

import java.util.Objects;

/**
 * Standard immutable response payload for avatar uploads.
 */
public record AvatarUploadResponse(
        String message,
        String avatarUrl
) {
    public AvatarUploadResponse {
        Objects.requireNonNull(message, "Message cannot be null");
        Objects.requireNonNull(avatarUrl, "Avatar URL cannot be null");
    }
}