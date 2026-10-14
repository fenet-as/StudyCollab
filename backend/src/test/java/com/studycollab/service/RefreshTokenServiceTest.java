package com.studycollab.service;

import com.studycollab.config.properties.JwtProperties;
import com.studycollab.exception.InvalidTokenException;
import com.studycollab.exception.RefreshTokenExpiredException;
import com.studycollab.exception.ResourceNotFoundException;
import com.studycollab.model.RefreshToken;
import com.studycollab.model.User;
import com.studycollab.repository.RefreshTokenRepository;
import com.studycollab.repository.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RefreshTokenServiceTest {

    private final Map<Long, User> userMap = new HashMap<>();
    private final Map<String, RefreshToken> tokenByStringMap = new HashMap<>();
    private final Map<Long, RefreshToken> tokenByUserIdMap = new HashMap<>();

    private RefreshTokenRepository refreshTokenRepository;
    private UserRepository userRepository;
    private RefreshTokenService refreshTokenService;
    private JwtProperties jwtProperties;

    private final AtomicBoolean deleteTokenCalled = new AtomicBoolean(false);
    private final AtomicBoolean deleteByUserCalled = new AtomicBoolean(false);

    @BeforeEach
    void setUp() {
        userMap.clear();
        tokenByStringMap.clear();
        tokenByUserIdMap.clear();
        deleteTokenCalled.set(false);
        deleteByUserCalled.set(false);

        jwtProperties = new JwtProperties("dGVzdC1zZWNyZXQta2V5LXRlc3Qtc2VjcmV0LWtleS10ZXN0", 3600000L, 604800000L); // 7 days refresh

        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findById".equals(methodName)) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(userMap.get(id));
                    }
                    return null;
                }
        );

        refreshTokenRepository = (RefreshTokenRepository) Proxy.newProxyInstance(
                RefreshTokenRepository.class.getClassLoader(),
                new Class<?>[]{RefreshTokenRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findByToken".equals(methodName)) {
                        String tokenStr = (String) args[0];
                        return Optional.ofNullable(tokenByStringMap.get(tokenStr));
                    } else if ("findByUser".equals(methodName)) {
                        User user = (User) args[0];
                        return Optional.ofNullable(tokenByUserIdMap.get(user.getId()));
                    } else if ("save".equals(methodName)) {
                        RefreshToken rt = (RefreshToken) args[0];
                        tokenByStringMap.put(rt.getToken(), rt);
                        if (rt.getUser() != null) {
                            tokenByUserIdMap.put(rt.getUser().getId(), rt);
                        }
                        return rt;
                    } else if ("delete".equals(methodName)) {
                        RefreshToken rt = (RefreshToken) args[0];
                        tokenByStringMap.remove(rt.getToken());
                        if (rt.getUser() != null) {
                            tokenByUserIdMap.remove(rt.getUser().getId());
                        }
                        deleteTokenCalled.set(true);
                        return null;
                    } else if ("deleteByUser".equals(methodName)) {
                        User user = (User) args[0];
                        RefreshToken rt = tokenByUserIdMap.remove(user.getId());
                        if (rt != null) {
                            tokenByStringMap.remove(rt.getToken());
                        }
                        deleteByUserCalled.set(true);
                        return 1;
                    }
                    return null;
                }
        );

        refreshTokenService = new RefreshTokenService(refreshTokenRepository, userRepository, jwtProperties);
    }

    private User createUser(Long id, String email) {
        User user = new User();
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", id);
        user.setEmail(email);
        user.setFullName("User " + id);
        userMap.put(id, user);
        return user;
    }

    @Nested
    @DisplayName("createOrUpdateRefreshToken")
    class CreateOrUpdateRefreshTokenTests {

        @Test
        @DisplayName("Creates a new refresh token when user exists and has no existing token")
        void createOrUpdate_whenUserExistsAndNoToken_createsNewToken() {
            User user = createUser(1L, "student@studycollab.com");

            RefreshToken result = refreshTokenService.createOrUpdateRefreshToken(1L);

            assertThat(result).isNotNull();
            assertThat(result.getUser()).isEqualTo(user);
            assertThat(result.getToken()).isNotBlank();
            assertThat(result.isRevoked()).isFalse();
            assertThat(result.getExpiryDate()).isAfter(Instant.now());
            assertThat(tokenByStringMap).containsKey(result.getToken());
        }

        @Test
        @DisplayName("Updates existing token when user already has a token")
        void createOrUpdate_whenUserHasExistingToken_updatesToken() {
            User user = createUser(2L, "alex@studycollab.com");
            RefreshToken existing = new RefreshToken("old-token-value", user, Instant.now().minusSeconds(100));
            existing.setRevoked(true);
            tokenByStringMap.put("old-token-value", existing);
            tokenByUserIdMap.put(2L, existing);

            RefreshToken result = refreshTokenService.createOrUpdateRefreshToken(2L);

            assertThat(result).isNotNull();
            assertThat(result.getToken()).isNotEqualTo("old-token-value");
            assertThat(result.isRevoked()).isFalse();
            assertThat(result.getExpiryDate()).isAfter(Instant.now());
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when user is not found")
        void createOrUpdate_whenUserNotFound_throwsResourceNotFoundException() {
            assertThatThrownBy(() -> refreshTokenService.createOrUpdateRefreshToken(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("User not found with id: '999'")
                    .satisfies(ex -> assertThat(((ResourceNotFoundException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("verifyAndRotate")
    class VerifyAndRotateTests {

        @Test
        @DisplayName("Rotates token value and updates expiry for valid token")
        void verifyAndRotate_whenTokenValid_rotatesAndReturns() {
            User user = createUser(10L, "valid@studycollab.com");
            String originalToken = "valid-token-uuid";
            Instant futureExpiry = Instant.now().plusSeconds(3600);
            RefreshToken token = new RefreshToken(originalToken, user, futureExpiry);
            tokenByStringMap.put(originalToken, token);
            tokenByUserIdMap.put(10L, token);

            RefreshToken rotated = refreshTokenService.verifyAndRotate(originalToken);

            assertThat(rotated).isNotNull();
            assertThat(rotated.getToken()).isNotEqualTo(originalToken);
            assertThat(rotated.getExpiryDate()).isAfter(futureExpiry.minusSeconds(10));
            assertThat(deleteTokenCalled.get()).isFalse();
        }

        @Test
        @DisplayName("Throws InvalidTokenException with 401 UNAUTHORIZED when token not found")
        void verifyAndRotate_whenTokenNotFound_throwsInvalidTokenException() {
            assertThatThrownBy(() -> refreshTokenService.verifyAndRotate("non-existent-token"))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessage("Refresh token not found")
                    .satisfies(ex -> assertThat(((InvalidTokenException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
        }

        @Test
        @DisplayName("Deletes token and throws RefreshTokenExpiredException with 401 UNAUTHORIZED when token is expired")
        void verifyAndRotate_whenTokenExpired_deletesAndThrowsRefreshTokenExpiredException() {
            User user = createUser(11L, "expired@studycollab.com");
            String expiredTokenStr = "expired-token";
            Instant pastExpiry = Instant.now().minusSeconds(100);
            RefreshToken expiredToken = new RefreshToken(expiredTokenStr, user, pastExpiry);
            tokenByStringMap.put(expiredTokenStr, expiredToken);
            tokenByUserIdMap.put(11L, expiredToken);

            assertThatThrownBy(() -> refreshTokenService.verifyAndRotate(expiredTokenStr))
                    .isInstanceOf(RefreshTokenExpiredException.class)
                    .hasMessage("Refresh token is expired or revoked. Please log in again.")
                    .satisfies(ex -> assertThat(((RefreshTokenExpiredException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));

            assertThat(deleteTokenCalled.get()).isTrue();
            assertThat(tokenByStringMap).doesNotContainKey(expiredTokenStr);
        }

        @Test
        @DisplayName("Deletes token and throws RefreshTokenExpiredException with 401 UNAUTHORIZED when token is revoked")
        void verifyAndRotate_whenTokenRevoked_deletesAndThrowsRefreshTokenExpiredException() {
            User user = createUser(12L, "revoked@studycollab.com");
            String revokedTokenStr = "revoked-token";
            Instant futureExpiry = Instant.now().plusSeconds(3600);
            RefreshToken revokedToken = new RefreshToken(revokedTokenStr, user, futureExpiry);
            revokedToken.setRevoked(true);
            tokenByStringMap.put(revokedTokenStr, revokedToken);
            tokenByUserIdMap.put(12L, revokedToken);

            assertThatThrownBy(() -> refreshTokenService.verifyAndRotate(revokedTokenStr))
                    .isInstanceOf(RefreshTokenExpiredException.class)
                    .hasMessage("Refresh token is expired or revoked. Please log in again.")
                    .satisfies(ex -> assertThat(((RefreshTokenExpiredException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));

            assertThat(deleteTokenCalled.get()).isTrue();
            assertThat(tokenByStringMap).doesNotContainKey(revokedTokenStr);
        }
    }

    @Nested
    @DisplayName("revokeByUserId")
    class RevokeByUserIdTests {

        @Test
        @DisplayName("Deletes token by user when user exists")
        void revokeByUserId_whenUserExists_deletesToken() {
            User user = createUser(20L, "revoke@studycollab.com");
            RefreshToken token = new RefreshToken("token-to-revoke", user, Instant.now().plusSeconds(3600));
            tokenByStringMap.put("token-to-revoke", token);
            tokenByUserIdMap.put(20L, token);

            refreshTokenService.revokeByUserId(20L);

            assertThat(deleteByUserCalled.get()).isTrue();
            assertThat(tokenByUserIdMap).doesNotContainKey(20L);
        }

        @Test
        @DisplayName("Does nothing when user does not exist")
        void revokeByUserId_whenUserDoesNotExist_doesNothing() {
            refreshTokenService.revokeByUserId(999L);

            assertThat(deleteByUserCalled.get()).isFalse();
        }
    }

    @Nested
    @DisplayName("Cookie helper methods")
    class CookieHelperTests {

        @Test
        @DisplayName("createRefreshTokenCookie sets proper attributes")
        void createRefreshTokenCookie_setsProperAttributes() {
            ResponseCookie cookie = refreshTokenService.createRefreshTokenCookie("sample-token-123");

            assertThat(cookie.getName()).isEqualTo(RefreshTokenService.REFRESH_COOKIE_NAME);
            assertThat(cookie.getValue()).isEqualTo("sample-token-123");
            assertThat(cookie.isHttpOnly()).isTrue();
            assertThat(cookie.isSecure()).isTrue();
            assertThat(cookie.getPath()).isEqualTo("/api/auth");
            assertThat(cookie.getSameSite()).isEqualTo("Strict");
            assertThat(cookie.getMaxAge().toMillis()).isEqualTo(jwtProperties.refreshExpirationMs());
        }

        @Test
        @DisplayName("createCleanRefreshTokenCookie creates zero-maxAge cookie")
        void createCleanRefreshTokenCookie_createsZeroMaxAgeCookie() {
            ResponseCookie cookie = refreshTokenService.createCleanRefreshTokenCookie();

            assertThat(cookie.getName()).isEqualTo(RefreshTokenService.REFRESH_COOKIE_NAME);
            assertThat(cookie.getValue()).isEmpty();
            assertThat(cookie.isHttpOnly()).isTrue();
            assertThat(cookie.isSecure()).isTrue();
            assertThat(cookie.getPath()).isEqualTo("/api/auth");
            assertThat(cookie.getSameSite()).isEqualTo("Strict");
            assertThat(cookie.getMaxAge().getSeconds()).isZero();
        }
    }
}
