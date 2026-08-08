package com.studycollab.controller.auth;

import com.studycollab.dto.auth.AuthResponse;
import com.studycollab.dto.auth.LoginRequest;
import com.studycollab.dto.auth.RegisterRequest;
import com.studycollab.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
// Marks this class as a Spring REST controller that handles HTTP requests and serializes responses to JSON.
@RequestMapping("/api/auth")
// Sets the base URL endpoint path for all authentication routes in this controller.
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        // Injects the authentication service dependency via constructor injection.
        this.authService = authService;
    }

    @PostMapping("/register")
    // Maps HTTP POST requests sent to "/api/auth/register" to this method.
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        // Validates input fields and extracts registration data from the JSON request body.

        AuthResponse response = authService.register(registerRequest);
        // Delegates registration logic to AuthService and captures token/user details in AuthResponse.

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
        // Returns an HTTP 201 Created status alongside the authorization response payload.
    }

    @PostMapping("/login")
    // Maps HTTP POST requests sent to "/api/auth/login" to this method.
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        // Validates input payload and extracts user login credentials from the request body.

        return ResponseEntity.ok(authService.login(loginRequest));
        // Calls login service to authenticate credentials and returns an HTTP 200 OK response with the auth token.
    }
}