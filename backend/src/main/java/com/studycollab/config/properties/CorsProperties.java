package com.studycollab.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
// Binds external application settings under the "app.cors" prefix to this record.
public record CorsProperties(
        List<String> allowedOrigins,
        // Stores the list of external domains allowed to make cross-origin requests.
        List<String> allowedMethods,
        // Stores the list of HTTP methods permitted for CORS (e.g., GET, POST, DELETE).
        List<String> allowedHeaders,
        // Stores the list of allowed HTTP headers sent in cross-origin client requests.
        boolean allowCredentials
        // Flags whether browser requests can include cookies or authorization credentials.
) {}