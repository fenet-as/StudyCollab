package com.studycollab.service.auth;

import com.studycollab.dto.auth.AuthResponse;
import com.studycollab.dto.auth.LoginRequest;
import com.studycollab.dto.auth.RegisterRequest;
import com.studycollab.exception.EmailAlreadyExistsException;
import com.studycollab.exception.InvalidCredentialsException;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
// Marks this class as a Spring service bean handling authentication business logic.
@Transactional
// Wraps method executions in database transactions to ensure data consistency.
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            AuthenticationManager authenticationManager
    ) {
        // Injects required data access, encoding, token, and authentication components.
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        // Executes user registration workflow by checking uniqueness, hashing passwords, and issuing JWTs.

        if (userRepository.existsByEmail(request.email())) {
            // Checks if an account with the given email address already exists.

            throw new EmailAlreadyExistsException(request.email());
            // Throws a custom exception if the email is already in use.
        }

        User user = new User();
        // Instantiates a new User entity.

        user.setFullName(request.fullName().trim());
        // Sets the user's full name after removing trailing whitespace.

        user.setEmail(request.email().toLowerCase().trim());
        // Sets the user's email converted to lowercase for consistent lookups.

        user.setPassword(passwordEncoder.encode(request.password()));
        // Hashes the plain-text password using the configured PasswordEncoder before saving.

        User savedUser = userRepository.save(user);
        // Persists the newly created user entity into the database.

        String token = tokenProvider.generateToken(savedUser.getEmail());
        // Generates a JWT token bound to the saved user's email.

        return new AuthResponse(savedUser.getId(), token, savedUser.getEmail());
        // Returns an AuthResponse containing user identity details and the issued JWT token.
    }

    @Override
    @Transactional(readOnly = true)
    // Marks transaction as read-only to optimize database performance for login checks.
    public AuthResponse login(LoginRequest request) {
        // Authenticates user credentials and returns a new JWT token upon success.

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
            // Delegates credentials verification (email and password match) to Spring Security.
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException();
            // Catches authentication failure and throws a uniform custom credentials exception.
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);
        // Retrieves the user account from the database or throws an exception if missing.

        String token = tokenProvider.generateToken(user.getEmail());
        // Generates a fresh JWT token for the successfully authenticated user.

        return new AuthResponse(user.getId(), token, user.getEmail());
        // Returns authentication response payload containing the user ID, JWT token, and email.
    }
}