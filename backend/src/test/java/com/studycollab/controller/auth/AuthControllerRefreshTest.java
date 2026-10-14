package com.studycollab.controller.auth;

import com.studycollab.config.properties.JwtProperties;
import com.studycollab.dto.auth.AuthResponse;
import com.studycollab.exception.ErrorResponse;
import com.studycollab.exception.GlobalExceptionHandler;
import com.studycollab.exception.InvalidTokenException;
import com.studycollab.exception.RefreshTokenExpiredException;
import com.studycollab.model.RefreshToken;
import com.studycollab.model.User;
import com.studycollab.service.RefreshTokenService;
import com.studycollab.service.auth.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.lang.reflect.Proxy;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthControllerRefreshTest {

    private AuthService authService;
    private RefreshTokenService refreshTokenService;
    private AuthController authController;
    private GlobalExceptionHandler exceptionHandler;
    private JwtProperties jwtProperties;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties("dGVzdC1zZWNyZXQta2V5LXRlc3Qtc2VjcmV0LWtleS10ZXN0", 3600000L, 604800000L);

        authService = (AuthService) Proxy.newProxyInstance(
                AuthService.class.getClassLoader(),
                new Class<?>[]{AuthService.class},
                (proxy, method, args) -> {
                    if ("generateAccessTokenResponse".equals(method.getName())) {
                        User user = (User) args[0];
                        return new AuthResponse(user.getId(), "new-jwt-access-token", user.getEmail());
                    }
                    return null;
                }
        );

        refreshTokenService = new RefreshTokenService(null, null, jwtProperties) {
            @Override
            public RefreshToken verifyAndRotate(String tokenStr) {
                if ("valid-cookie-token".equals(tokenStr)) {
                    User u = new User();
                    org.springframework.test.util.ReflectionTestUtils.setField(u, "id", 1L);
                    u.setEmail("test@studycollab.com");
                    u.setFullName("Test User");
                    return new RefreshToken("rotated-token-val", u, Instant.now().plusSeconds(3600));
                } else if ("expired-cookie-token".equals(tokenStr)) {
                    throw new RefreshTokenExpiredException("Refresh token is expired or revoked. Please log in again.");
                } else {
                    throw new InvalidTokenException("Refresh token not found", HttpStatus.UNAUTHORIZED);
                }
            }
        };

        authController = new AuthController(authService, refreshTokenService);
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Nested
    @DisplayName("RefreshToken Controller & Exception Handling Tests")
    class RefreshTokenFlowTests {

        @Test
        @DisplayName("Valid refresh token returns 200 with new access token and rotated cookie")
        void refreshToken_withValidToken_returns200AndRotatedCookie() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/auth/refresh");
            request.setCookies(new Cookie(RefreshTokenService.REFRESH_COOKIE_NAME, "valid-cookie-token"));

            ResponseEntity<AuthResponse> response = authController.refreshToken(request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().token()).isEqualTo("new-jwt-access-token");
            assertThat(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("refreshToken=rotated-token-val");
        }

        @Test
        @DisplayName("Missing refresh token cookie throws InvalidTokenException and handler returns 401 with clean cookie")
        void refreshToken_withMissingCookie_throwsInvalidTokenExceptionAndCleansCookie() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/auth/refresh");

            assertThatThrownBy(() -> authController.refreshToken(request))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessage("Refresh token is missing")
                    .satisfies(ex -> {
                        InvalidTokenException ite = (InvalidTokenException) ex;
                        assertThat(ite.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);

                        ResponseEntity<ErrorResponse> response = exceptionHandler.handleInvalidTokenException(ite, request);
                        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                        assertThat(response.getBody()).isNotNull();
                        assertThat(response.getBody().status()).isEqualTo(401);
                        assertThat(response.getBody().message()).isEqualTo("Refresh token is missing");
                        assertThat(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");
                    });
        }

        @Test
        @DisplayName("Unknown refresh token throws InvalidTokenException and handler returns 401 with clean cookie")
        void refreshToken_withUnknownToken_throwsInvalidTokenExceptionAndCleansCookie() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/auth/refresh");
            request.setCookies(new Cookie(RefreshTokenService.REFRESH_COOKIE_NAME, "unknown-token-uuid"));

            assertThatThrownBy(() -> authController.refreshToken(request))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessage("Refresh token not found")
                    .satisfies(ex -> {
                        InvalidTokenException ite = (InvalidTokenException) ex;
                        assertThat(ite.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);

                        ResponseEntity<ErrorResponse> response = exceptionHandler.handleInvalidTokenException(ite, request);
                        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                        assertThat(response.getBody()).isNotNull();
                        assertThat(response.getBody().status()).isEqualTo(401);
                        assertThat(response.getBody().message()).isEqualTo("Refresh token not found");
                        assertThat(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");
                    });
        }

        @Test
        @DisplayName("Expired refresh token throws RefreshTokenExpiredException and handler returns 401 with clean cookie")
        void refreshToken_withExpiredToken_throwsRefreshTokenExpiredExceptionAndCleansCookie() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/auth/refresh");
            request.setCookies(new Cookie(RefreshTokenService.REFRESH_COOKIE_NAME, "expired-cookie-token"));

            assertThatThrownBy(() -> authController.refreshToken(request))
                    .isInstanceOf(RefreshTokenExpiredException.class)
                    .hasMessage("Refresh token is expired or revoked. Please log in again.")
                    .satisfies(ex -> {
                        RefreshTokenExpiredException rtee = (RefreshTokenExpiredException) ex;
                        assertThat(rtee.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);

                        ResponseEntity<ErrorResponse> response = exceptionHandler.handleRefreshTokenExpiredException(rtee, request);
                        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                        assertThat(response.getBody()).isNotNull();
                        assertThat(response.getBody().status()).isEqualTo(401);
                        assertThat(response.getBody().message()).isEqualTo("Refresh token is expired or revoked. Please log in again.");
                        assertThat(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");
                    });
        }
    }
}
