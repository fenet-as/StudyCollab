package com.studycollab.controller.auth;

import com.studycollab.dto.auth.AuthResponse;
import com.studycollab.dto.auth.LoginRequest;
import com.studycollab.dto.auth.RegisterRequest;
import com.studycollab.dto.auth.ResendVerificationRequest;
import com.studycollab.model.RefreshToken;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.RefreshTokenService;
import com.studycollab.service.auth.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import com.studycollab.exception.InvalidTokenException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);
        return ResponseEntity.ok("Registration successful! Please check your email to verify your account.");
    }

    @GetMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@RequestParam("token") String token) {
        AuthResponse response = authService.verifyEmail(token);

        RefreshToken refreshToken = refreshTokenService.createOrUpdateRefreshToken(response.id());
        ResponseCookie cookie = refreshTokenService.createRefreshTokenCookie(refreshToken.getToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);

        RefreshToken refreshToken = refreshTokenService.createOrUpdateRefreshToken(response.id());
        ResponseCookie cookie = refreshTokenService.createRefreshTokenCookie(refreshToken.getToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(HttpServletRequest request) {
        String tokenFromCookie = extractCookieValue(request, RefreshTokenService.REFRESH_COOKIE_NAME);

        if (tokenFromCookie == null || tokenFromCookie.isBlank()) {
            throw new InvalidTokenException("Refresh token is missing", HttpStatus.UNAUTHORIZED);
        }

        RefreshToken rotatedToken = refreshTokenService.verifyAndRotate(tokenFromCookie);
        AuthResponse response = authService.generateAccessTokenResponse(rotatedToken.getUser());

        ResponseCookie newCookie = refreshTokenService.createRefreshTokenCookie(rotatedToken.getToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newCookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails != null) {
            refreshTokenService.revokeByUserId(userDetails.getId());
        }

        ResponseCookie cleanCookie = refreshTokenService.createCleanRefreshTokenCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .build();
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }


    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerificationEmail(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request);
        // Generic message returned regardless of account presence to prevent user enumeration
        return ResponseEntity.ok("If an account exists with that email, a verification link has been sent.");
    }
}