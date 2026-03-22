package com.studycollab.service.auth;

import com.studycollab.dto.AuthResponse;
import com.studycollab.dto.LoginRequest;
import com.studycollab.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}