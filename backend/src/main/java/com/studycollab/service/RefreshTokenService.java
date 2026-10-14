package com.studycollab.service;

import com.studycollab.config.properties.JwtProperties;
import com.studycollab.exception.InvalidTokenException;
import com.studycollab.exception.RefreshTokenExpiredException;
import com.studycollab.exception.ResourceNotFoundException;
import com.studycollab.model.RefreshToken;
import com.studycollab.model.User;
import com.studycollab.repository.RefreshTokenRepository;
import com.studycollab.repository.auth.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    public static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtProperties jwtProperties;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            JwtProperties jwtProperties
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public RefreshToken createOrUpdateRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Instant expiry = Instant.now().plusMillis(jwtProperties.refreshExpirationMs());
        String tokenString = UUID.randomUUID().toString();

        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .map(existing -> {
                    existing.setToken(tokenString);
                    existing.setExpiryDate(expiry);
                    existing.setRevoked(false);
                    return existing;
                })
                .orElseGet(() -> new RefreshToken(tokenString, user, expiry));

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken verifyAndRotate(String tokenStr) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked() || token.isExpired()) {
            refreshTokenRepository.delete(token);
            throw new RefreshTokenExpiredException("Refresh token is expired or revoked. Please log in again.");
        }

        // Automatic Token Rotation: Mint a new token value for every refresh
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(jwtProperties.refreshExpirationMs()));
        return refreshTokenRepository.save(token);
    }

    @Transactional
    public void revokeByUserId(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            refreshTokenRepository.deleteByUser(user);
        }
    }

    public ResponseCookie createRefreshTokenCookie(String tokenValue) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, tokenValue)
                .httpOnly(true)
                .secure(true) // Enforce HTTPS
                .path("/api/auth") // Restrict cookie transmission to auth endpoints
                .maxAge(Duration.ofMillis(jwtProperties.refreshExpirationMs()))
                .sameSite("Strict")
                .build();
    }

    public ResponseCookie createCleanRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Strict")
                .build();
    }
}