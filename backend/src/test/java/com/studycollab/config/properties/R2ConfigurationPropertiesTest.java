package com.studycollab.config.properties;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class R2ConfigurationPropertiesTest {

    private Properties loadProperties(String filename) throws IOException {
        Properties properties = new Properties();
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(filename)) {
            if (is != null) {
                properties.load(is);
                return properties;
            }
        }
        Path path = Paths.get("src/main/resources/" + filename);
        if (Files.exists(path)) {
            try (InputStream fis = Files.newInputStream(path)) {
                properties.load(fis);
            }
        }
        return properties;
    }

    @Test
    @DisplayName("application.properties does not contain redundant aws.s3 or r2 aliases")
    void applicationProperties_doesNotContainRedundantAliases() throws IOException {
        Properties props = loadProperties("application.properties");
        if (!props.isEmpty()) {
            for (String propertyName : props.stringPropertyNames()) {
                assertThat(propertyName)
                        .as("Property '%s' should not use deprecated aws.s3 prefix", propertyName)
                        .doesNotStartWith("aws.s3.");
                assertThat(propertyName)
                        .as("Property '%s' should not use duplicate r2 prefix", propertyName)
                        .doesNotStartWith("r2.");
            }
        }
    }

    @Test
    @DisplayName("application.properties retains cloudflare.r2 as single source of truth")
    void applicationProperties_retainsCloudflareR2Properties() throws IOException {
        Properties props = loadProperties("application.properties");
        if (!props.isEmpty()) {
            assertThat(props.getProperty("cloudflare.r2.access-key")).isNotNull();
            assertThat(props.getProperty("cloudflare.r2.secret-key")).isNotNull();
            assertThat(props.getProperty("cloudflare.r2.endpoint")).isNotNull();
            assertThat(props.getProperty("cloudflare.r2.bucket-name")).isNotNull();
            assertThat(props.getProperty("cloudflare.r2.public-url")).isNotNull();
        }
    }

    @Test
    @DisplayName("CloudflareR2Properties sanitizes valid values correctly")
    void cloudflareR2Properties_sanitizesValues() {
        CloudflareR2Properties properties = new CloudflareR2Properties(
                "  test-access-key  ",
                "  test-secret-key  ",
                "  r2.cloudflarestorage.com  ",
                "test-bucket",
                "https://pub-r2.dev"
        );

        assertThat(properties.getSanitizedAccessKey()).isEqualTo("test-access-key");
        assertThat(properties.getSanitizedSecretKey()).isEqualTo("test-secret-key");
        assertThat(properties.getSanitizedEndpoint()).isEqualTo("https://r2.cloudflarestorage.com");
    }

    @Test
    @DisplayName("CloudflareR2Properties fails fast when mandatory fields are missing")
    void cloudflareR2Properties_validatesMandatoryFields() {
        CloudflareR2Properties missingAccess = new CloudflareR2Properties(null, "secret", "endpoint", "bucket", "url");
        assertThatThrownBy(missingAccess::getSanitizedAccessKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cloudflare.r2.access-key");

        CloudflareR2Properties missingSecret = new CloudflareR2Properties("access", "", "endpoint", "bucket", "url");
        assertThatThrownBy(missingSecret::getSanitizedSecretKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cloudflare.r2.secret-key");

        CloudflareR2Properties missingEndpoint = new CloudflareR2Properties("access", "secret", "   ", "bucket", "url");
        assertThatThrownBy(missingEndpoint::getSanitizedEndpoint)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cloudflare.r2.endpoint");
    }
}
