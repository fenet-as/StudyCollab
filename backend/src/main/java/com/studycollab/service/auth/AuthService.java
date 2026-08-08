package com.studycollab.service.auth;

import com.studycollab.dto.auth.AuthResponse;
import com.studycollab.dto.auth.LoginRequest;
import com.studycollab.dto.auth.RegisterRequest;

public interface AuthService {
// Defines the contract interface for user authentication operations in the system.

    AuthResponse register(RegisterRequest request);
    // Method signature to handle new user account registration and return an auth token.

    AuthResponse login(LoginRequest request);
    // Method signature to authenticate existing user credentials and return an auth token.
}