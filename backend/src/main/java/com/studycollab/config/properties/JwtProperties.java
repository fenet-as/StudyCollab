package com.studycollab.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
// Binds external application settings under the "app.jwt" prefix to this record.
public record JwtProperties(
        String secret,
        // Stores the secret key string used to sign and verify JSON Web Tokens (JWTs).
        long expirationMs,
        // Stores the access token lifespan duration measured in milliseconds.
        long refreshExpirationMs
        // Stores the refresh token lifespan duration measured in milliseconds.
) {}