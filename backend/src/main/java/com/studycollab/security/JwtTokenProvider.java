package com.studycollab.security;

import com.studycollab.config.properties.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
// Registers this class as a Spring-managed component bean for utility token operations.
@EnableConfigurationProperties(JwtProperties.class)
// Binds external configuration properties under JwtProperties for secret key and expiration time.
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
    // Initializes the Logger instance to log token validation errors and debugging info.

    private final JwtProperties jwtProperties;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        // Injects configuration properties and derives the cryptographic signing key.
        this.jwtProperties = jwtProperties;
        this.key = getSigningKey(jwtProperties.secret());
    }

    private SecretKey getSigningKey(String secret) {
        // Helper method that converts a raw secret string into an HMAC SHA cryptographic SecretKey.
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
            // Attempts to decode the secret key as a Base64-encoded string.
        } catch (IllegalArgumentException e) {
            keyBytes = secret.getBytes();
            // Falls back to raw string bytes if the secret is not Base64-encoded.
        }
        return Keys.hmacShaKeyFor(keyBytes);
        // Returns an HMAC SHA cryptographic key built from the derived byte array.
    }

    public String generateToken(String email) {
        // Generates a signed JWT for an authenticated user using their email address.
        Date now = new Date();
        // Gets current system timestamp for token issuance.
        Date expiryDate = new Date(now.getTime() + jwtProperties.expirationMs());
        // Calculates the future expiration date by adding configured duration to current time.

        return Jwts.builder()
                .subject(email)
                // Sets the subject claim of the token to the user's email.
                .issuedAt(now)
                // Sets the token issue timestamp (iat claim).
                .expiration(expiryDate)
                // Sets the token expiration timestamp (exp claim).
                .signWith(key)
                // Signs the token payload using the generated HMAC SHA secret key.
                .compact();
        // Serializes the JWT components into a compact, URL-safe string.
    }

    public String getEmailFromJWT(String token) {
        // Extracts and returns the user email subject claim stored inside a signed JWT.
        Claims claims = Jwts.parser()
                .verifyWith(key)
                // Configures the parser to verify the token signature using the secret key.
                .build()
                .parseSignedClaims(token)
                // Parses and validates the token signature and structure.
                .getPayload();
        // Retrieves the token payload claims body.

        return claims.getSubject();
        // Returns the email subject stored in the claims.
    }

    public boolean validateToken(String authToken) {
        // Parses and validates a JWT to ensure it is correctly formatted, signed, and active.
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(authToken);
            // Parses the token and verifies cryptographic signature and validity.
            return true;
            // Returns true if parsing succeeds without throwing any exceptions.
        } catch (SignatureException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
            // Catches signature mismatch failures (tampered token).
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
            // Catches structural format issues.
        } catch (ExpiredJwtException ex) {
            log.error("JWT token is expired: {}", ex.getMessage());
            // Catches tokens that have passed their expiration date.
        } catch (UnsupportedJwtException ex) {
            log.error("JWT token is unsupported: {}", ex.getMessage());
            // Catches unsupported token algorithms or features.
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
            // Catches null or empty token strings.
        }
        return false;
        // Returns false if any validation exception was caught.
    }
}