package com.studycollab.config;

import com.studycollab.config.properties.CloudflareR2Properties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

// Marks this class as a Spring configuration source for bean definitions.
@Configuration
// Enables binding of custom properties defined in CloudflareR2Properties.
@EnableConfigurationProperties(CloudflareR2Properties.class)
public class CloudflareR2Config {

    private final CloudflareR2Properties properties;

    // Injects the bound Cloudflare R2 properties via constructor injection.
    public CloudflareR2Config(CloudflareR2Properties properties) {
        this.properties = properties;
    }

    // Creates and manages the main AWS SDK S3 client bean configured for Cloudflare R2.
    @Bean
    public S3Client s3Client() {
        // Creates static AWS credentials using the configured access and secret keys.
        AwsBasicCredentials credentials = AwsBasicCredentials.create(properties.accessKey(), properties.secretKey());

        // Configures S3 settings specifically needed for R2 compatibility (path-style access, no chunked encoding).
        S3Configuration serviceConfiguration = S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .chunkedEncodingEnabled(false)
                .build();

        // Builds the S3 client pointing to the R2 custom endpoint and region.
        return S3Client.builder()
                .endpointOverride(URI.create(properties.getSanitizedEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.US_EAST_1)
                .serviceConfiguration(serviceConfiguration)
                .build();
    }

    // Creates and manages the S3 Presigner bean used for generating pre-signed URLs for direct upload/download.
    @Bean
    public S3Presigner s3Presigner() {
        // Creates static AWS credentials using the configured access and secret keys.
        AwsBasicCredentials credentials = AwsBasicCredentials.create(properties.accessKey(), properties.secretKey());

        // Configures settings for the presigner (disables checksum validation for R2 compatibility).
        S3Configuration serviceConfiguration = S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .checksumValidationEnabled(false)
                .build();

        // Builds the S3Presigner pointing to the R2 endpoint and region.
        return S3Presigner.builder()
                .endpointOverride(URI.create(properties.getSanitizedEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.US_EAST_1)
                .serviceConfiguration(serviceConfiguration)
                .build();
    }
}