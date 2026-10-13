package com.studycollab.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloudflare.r2")
public record CloudflareR2Properties(
        String accessKey,
        String secretKey,
        String endpoint,
        String bucketName,
        String publicUrl
) {
    public String getSanitizedAccessKey() {
        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: 'cloudflare.r2.access-key' (or 'accessKey') is missing or blank in application.properties!");
        }
        return accessKey.trim();
    }

    public String getSanitizedSecretKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: 'cloudflare.r2.secret-key' (or 'secretKey') is missing or blank in application.properties!");
        }
        return secretKey.trim();
    }

    public String getSanitizedEndpoint() {
        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: 'cloudflare.r2.endpoint' property is missing!");
        }
        String clean = endpoint.trim();
        return (clean.startsWith("http://") || clean.startsWith("https://")) ? clean : "https://" + clean;
    }
}