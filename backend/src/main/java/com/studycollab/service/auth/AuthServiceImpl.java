package com.studycollab.service.auth;

import com.studycollab.dto.auth.AuthResponse;
import com.studycollab.dto.auth.LoginRequest;
import com.studycollab.dto.auth.RegisterRequest;
import com.studycollab.dto.auth.ResendVerificationRequest;
import com.studycollab.exception.AccountNotVerifiedException;
import com.studycollab.exception.EmailAlreadyExistsException;
import com.studycollab.exception.InvalidCredentialsException;
import com.studycollab.exception.InvalidTokenException;
import com.studycollab.model.EmailVerificationToken;
import com.studycollab.model.User;
import com.studycollab.repository.auth.EmailVerificationTokenRepository;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.security.JwtTokenProvider;
import com.studycollab.service.email.EmailService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthServiceImpl(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            AuthenticationManager authenticationManager,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    @Override
    public void register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEnabled(false);

        try {
            User savedUser = userRepository.save(user);
            createAndSendToken(savedUser);
        } catch (DataIntegrityViolationException ex) {
            throw new EmailAlreadyExistsException(normalizedEmail);
        }
    }



    private void createAndSendToken(User user) {
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = new EmailVerificationToken(
                token,
                user,
                LocalDateTime.now().plusHours(24)
        );
        tokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }



    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
            );
        } catch (DisabledException ex) {
            throw new AccountNotVerifiedException("Account is not verified. Please check your email.");
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(InvalidCredentialsException::new);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), token, user.getEmail());
    }

    @Override
    public AuthResponse generateAccessTokenResponse(User user) {
        String newAccessToken = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), newAccessToken, user.getEmail());
    }





    @Override
    public void resendVerificationEmail(ResendVerificationRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);

        if (userOptional.isEmpty() || userOptional.get().isEnabled()) {
            return;
        }

        User user = userOptional.get();

        // 1. Delete old tokens and force an immediate flush to clean DB state
        tokenRepository.deleteByUser(user);
        tokenRepository.flush();

        // 2. Generate and send fresh token
        createAndSendToken(user);
    }

    @Override
    public AuthResponse verifyEmail(String token) {
        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid verification token"));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEnabled(true);

        // Save and flush user update BEFORE deleting the token
        userRepository.saveAndFlush(user);

        tokenRepository.delete(verificationToken);

        String jwt = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), jwt, user.getEmail());
    }
}