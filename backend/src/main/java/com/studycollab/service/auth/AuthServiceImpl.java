package com.studycollab.service.auth;

import com.studycollab.dto.AuthResponse;
import com.studycollab.dto.LoginRequest;
import com.studycollab.dto.RegisterRequest;
import com.studycollab.model.Users;
import com.studycollab.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Users user = new Users();
        user.setId(UUID.randomUUID());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        // In real app, generate JWT here
        String fakeToken = "dummy-jwt-token";

        return new AuthResponse(fakeToken, user.getEmail(), user.getName());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Optional<Users> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        Users user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // In real app, generate JWT here
        String fakeToken = "dummy-jwt-token";

        return new AuthResponse(fakeToken, user.getEmail(), user.getName());
    }
}