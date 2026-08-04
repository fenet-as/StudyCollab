package com.studycollab.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class CloudflareR2Config {

    @Value("${cloudflare.r2.accessKey}")
    private String accessKey;

    @Value("${cloudflare.r2.secretKey}")
    private String secretKey;

    @Value("${cloudflare.r2.endpoint:}")
    private String endpoint;

    private String getSanitizedEndpoint() {
        if (endpoint == null || endpoint.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "CRITICAL CONFIG ERROR: 'cloudflare.r2.endpoint' property is missing or empty!"
            );
        }
        String cleanEndpoint = endpoint.trim();
        if (!cleanEndpoint.startsWith("http://") && !cleanEndpoint.startsWith("https://")) {
            cleanEndpoint = "https://" + cleanEndpoint;
        }
        return cleanEndpoint;
    }

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        S3Configuration serviceConfiguration = S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .chunkedEncodingEnabled(false)
                .build();

        return S3Client.builder()
                .endpointOverride(URI.create(getSanitizedEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.US_EAST_1) // 🔥 AWS SDK v2 requires US_EAST_1 for R2 custom endpoints
                .serviceConfiguration(serviceConfiguration)
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        S3Configuration serviceConfiguration = S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .checksumValidationEnabled(false)
                .build();

        return S3Presigner.builder()
                .endpointOverride(URI.create(getSanitizedEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.US_EAST_1) // 🔥 AWS SDK v2 requires US_EAST_1 for R2 custom endpoints
                .serviceConfiguration(serviceConfiguration)
                .build();
    }
}