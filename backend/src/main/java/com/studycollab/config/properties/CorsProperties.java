package com.studycollab.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(
        List<String> allowedOrigins,
        List<String> allowedMethods,
        List<String> allowedHeaders,
        Boolean allowCredentials
) {
    public List<String> getAllowedOrigins() {
        return (allowedOrigins != null && !allowedOrigins.isEmpty())
                ? allowedOrigins
                : List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:3000");
    }

    public List<String> getAllowedMethods() {
        return (allowedMethods != null && !allowedMethods.isEmpty())
                ? allowedMethods
                : List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS");
    }

    public List<String> getAllowedHeaders() {
        return (allowedHeaders != null && !allowedHeaders.isEmpty())
                ? allowedHeaders
                : List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin");
    }

    public boolean isAllowCredentials() {
        return allowCredentials != null ? allowCredentials : true;
    }
}