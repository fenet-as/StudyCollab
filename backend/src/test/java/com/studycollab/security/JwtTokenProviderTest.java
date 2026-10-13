package com.studycollab.security;

import com.studycollab.config.properties.JwtProperties;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    // 32-byte (256-bit) dummy test secret, Base64-encoded (test only, not for production)
    private static final String VALID_TEST_SECRET = Base64.getEncoder().encodeToString(
            "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8)
    );
    private static final long EXPIRATION_MS = 3600000L;
    private static final long REFRESH_EXPIRATION_MS = 86400000L;

    private JwtProperties createProperties(String secret) {
        return new JwtProperties(secret, EXPIRATION_MS, REFRESH_EXPIRATION_MS);
    }

    @Test
    @DisplayName("Should initialize successfully and generate/parse tokens with a valid 256-bit Base64 secret")
    void validSecret_initializesSuccessfullyAndGeneratesParsesToken() {
        JwtTokenProvider provider = new JwtTokenProvider(createProperties(VALID_TEST_SECRET));

        String token = provider.generateToken(123L, "user@example.com");
        assertThat(token).isNotBlank();

        Optional<Claims> claimsOpt = provider.parseAndValidateToken(token);
        assertThat(claimsOpt).isPresent();

        Claims claims = claimsOpt.get();
        assertThat(claims.getSubject()).isEqualTo("123");
        assertThat(claims.get("email", String.class)).isEqualTo("user@example.com");
        assertThat(provider.getUserIdFromClaims(claims)).isEqualTo(123L);
    }

    @Test
    @DisplayName("Should throw IllegalStateException when secret is null")
    void nullSecret_throwsIllegalStateException() {
        assertThatThrownBy(() -> new JwtTokenProvider(createProperties(null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("missing or empty");
    }

    @Test
    @DisplayName("Should throw IllegalStateException when secret is blank")
    void blankSecret_throwsIllegalStateException() {
        assertThatThrownBy(() -> new JwtTokenProvider(createProperties("   ")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("missing or empty");
    }

    @Test
    @DisplayName("Should throw IllegalStateException when secret is not valid Base64")
    void invalidBase64Secret_throwsIllegalStateException() {
        assertThatThrownBy(() -> new JwtTokenProvider(createProperties("your_super_secure_production_jwt_secret_key_here")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Base64-encoded key of at least 256 bits");
    }

    @Test
    @DisplayName("Should throw IllegalStateException when key is too weak (< 256 bits)")
    void weakSecret_throwsIllegalStateException() {
        // 16 bytes (128 bits) Base64 secret
        String weakSecret = Base64.getEncoder().encodeToString("short-secret-16b".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> new JwtTokenProvider(createProperties(weakSecret)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 256 bits");
    }

    @Test
    @DisplayName("Should return empty Optional when parsing malformed token")
    void malformedToken_returnsEmptyOptional() {
        JwtTokenProvider provider = new JwtTokenProvider(createProperties(VALID_TEST_SECRET));

        Optional<Claims> claims = provider.parseAndValidateToken("invalid.jwt.token");
        assertThat(claims).isEmpty();
    }
}
