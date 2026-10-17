package com.studycollab.service.auth;

import com.studycollab.dto.auth.AuthResponse;
import com.studycollab.dto.auth.LoginRequest;
import com.studycollab.dto.auth.RegisterRequest;
import com.studycollab.dto.auth.ResendVerificationRequest;
import com.studycollab.model.User;

public interface AuthService {

    void register(RegisterRequest request);

    void resendVerificationEmail(ResendVerificationRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse verifyEmail(String token);

    AuthResponse generateAccessTokenResponse(User user);
}