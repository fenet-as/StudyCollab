package com.studycollab.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloudflare.r2")
// Maps properties under the "cloudflare.r2" prefix in application configuration files to this record.
public record CloudflareR2Properties(
        String accessKey,
        // Represents the Cloudflare R2 API access key identifier.
        String secretKey,
        // Represents the secret key paired with the access key for R2 authentication.
        String endpoint,
        // Stores the base S3 API endpoint URL provided by Cloudflare R2.
        String bucketName,
        // Stores the targeted Cloudflare R2 storage bucket name.
        String publicUrl
        // Stores the optional public domain or CDN base URL used to serve R2 uploaded assets directly.
) {
    public String getSanitizedEndpoint() {
        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: 'cloudflare.r2.endpoint' property is missing!");
        }
        // Validates that the endpoint value is present; throws an error early if missing.
        String clean = endpoint.trim();
        // Removes leading and trailing whitespace from the endpoint string.
        return (clean.startsWith("http://") || clean.startsWith("https://")) ? clean : "https://" + clean;
        // Prepends "https://" to the endpoint if no valid protocol scheme is explicitly defined.
    }
}