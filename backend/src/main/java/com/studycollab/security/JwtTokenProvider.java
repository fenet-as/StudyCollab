package com.studycollab.security;

import com.studycollab.config.properties.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Optional;

@Component
@EnableConfigurationProperties(JwtProperties.class)
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final JwtProperties jwtProperties;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.key = getSigningKey(jwtProperties.secret());
    }

    private SecretKey getSigningKey(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "CRITICAL SECURITY CONFIGURATION ERROR: JWT secret is missing or empty. Please configure a valid Base64-encoded secret via JWT_SECRET."
            );
        }
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "CRITICAL SECURITY CONFIGURATION ERROR: JWT secret must be a valid, Base64-encoded key of at least 256 bits (32 bytes).", e
            );
        }
    }

    public String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.expirationMs());

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    /**
     * Parses and validates the token once per request.
     * Returns Optional containing Claims if valid, or empty Optional if invalid.
     */
    public Optional<Claims> parseAndValidateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Invalid JWT token provided: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    public Long getUserIdFromClaims(Claims claims) {
        return Long.parseLong(claims.getSubject());
    }
}