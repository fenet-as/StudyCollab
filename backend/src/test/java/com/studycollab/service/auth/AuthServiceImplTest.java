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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailVerificationTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 100L);
        testUser.setFullName("Test Student");
        testUser.setEmail("student@studycollab.com");
        testUser.setPassword("encoded_secret");
        testUser.setEnabled(false);
    }

    @Nested
    @DisplayName("Registration Tests")
    class RegisterTests {

        @Test
        @DisplayName("Successfully registers a new user, saves entity as disabled, and sends verification email")
        void register_Success() {
            RegisterRequest request = new RegisterRequest("  New Student  ", "NEW@STUDYCOLLAB.COM ", "plainPassword123!");

            when(userRepository.existsByEmail("new@studycollab.com")).thenReturn(false);
            when(passwordEncoder.encode("plainPassword123!")).thenReturn("encodedPassword123!");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User u = invocation.getArgument(0);
                ReflectionTestUtils.setField(u, "id", 101L);
                return u;
            });

            authService.register(request);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User saved = userCaptor.getValue();
            assertThat(saved.getFullName()).isEqualTo("New Student");
            assertThat(saved.getEmail()).isEqualTo("new@studycollab.com");
            assertThat(saved.getPassword()).isEqualTo("encodedPassword123!");
            assertThat(saved.isEnabled()).isFalse();

            ArgumentCaptor<EmailVerificationToken> tokenCaptor = ArgumentCaptor.forClass(EmailVerificationToken.class);
            verify(tokenRepository).save(tokenCaptor.capture());
            EmailVerificationToken savedToken = tokenCaptor.getValue();
            assertThat(savedToken.getUser().getId()).isEqualTo(101L);
            assertThat(savedToken.getToken()).isNotBlank();
            assertThat(savedToken.getExpiryDate()).isAfter(LocalDateTime.now());

            verify(emailService).sendVerificationEmail(eq("new@studycollab.com"), eq(savedToken.getToken()));
        }

        @Test
        @DisplayName("Throws EmailAlreadyExistsException when email is already registered")
        void register_EmailAlreadyExists() {
            RegisterRequest request = new RegisterRequest("Student", "student@studycollab.com", "pass");
            when(userRepository.existsByEmail("student@studycollab.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessageContaining("student@studycollab.com");

            verify(userRepository, never()).save(any());
            verify(tokenRepository, never()).save(any());
            verify(emailService, never()).sendVerificationEmail(any(), any());
        }

        @Test
        @DisplayName("Throws EmailAlreadyExistsException on concurrent duplicate via DataIntegrityViolationException")
        void register_ConcurrentDuplicate_ThrowsEmailAlreadyExists() {
            RegisterRequest request = new RegisterRequest("Student", "student@studycollab.com", "pass");
            when(userRepository.existsByEmail("student@studycollab.com")).thenReturn(false);
            when(passwordEncoder.encode("pass")).thenReturn("encoded_pass");
            when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("unique constraint"));

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessageContaining("student@studycollab.com");

            verify(tokenRepository, never()).save(any());
            verify(emailService, never()).sendVerificationEmail(any(), any());
        }
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Successfully logs in verified user and returns AuthResponse")
        void login_Success() {
            LoginRequest request = new LoginRequest("STUDENT@STUDYCOLLAB.COM ", "correctPassword");
            testUser.setEnabled(true);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(new UsernamePasswordAuthenticationToken(testUser.getEmail(), "correctPassword"));
            when(userRepository.findByEmail("student@studycollab.com")).thenReturn(Optional.of(testUser));
            when(tokenProvider.generateToken(100L, "student@studycollab.com")).thenReturn("jwt_access_token_xyz");

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(100L);
            assertThat(response.token()).isEqualTo("jwt_access_token_xyz");
            assertThat(response.email()).isEqualTo("student@studycollab.com");
        }

        @Test
        @DisplayName("Throws AccountNotVerifiedException when user account is disabled")
        void login_DisabledAccount_ThrowsAccountNotVerifiedException() {
            LoginRequest request = new LoginRequest("student@studycollab.com", "password");
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new DisabledException("User is disabled"));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(AccountNotVerifiedException.class)
                    .hasMessageContaining("Account is not verified");

            verify(tokenProvider, never()).generateToken(any(), any());
        }

        @Test
        @DisplayName("Throws InvalidCredentialsException when BadCredentialsException is thrown")
        void login_BadCredentials_ThrowsInvalidCredentialsException() {
            LoginRequest request = new LoginRequest("student@studycollab.com", "wrongPassword");
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class);

            verify(tokenProvider, never()).generateToken(any(), any());
        }

        @Test
        @DisplayName("Throws InvalidCredentialsException when authenticated user is not found in repository")
        void login_UserNotFoundAfterAuth_ThrowsInvalidCredentialsException() {
            LoginRequest request = new LoginRequest("student@studycollab.com", "password");
            when(authenticationManager.authenticate(any())).thenReturn(null);
            when(userRepository.findByEmail("student@studycollab.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class);
        }
    }

    @Nested
    @DisplayName("Email Verification Tests")
    class VerifyEmailTests {

        @Test
        @DisplayName("Successfully verifies valid token, marks user enabled, deletes token, and returns token")
        void verifyEmail_Success() {
            String tokenString = "valid-token-123";
            EmailVerificationToken token = new EmailVerificationToken(
                    tokenString,
                    testUser,
                    LocalDateTime.now().plusHours(12)
            );

            when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(token));
            when(tokenProvider.generateToken(100L, "student@studycollab.com")).thenReturn("jwt_token_verified");

            AuthResponse response = authService.verifyEmail(tokenString);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(100L);
            assertThat(response.token()).isEqualTo("jwt_token_verified");
            assertThat(testUser.isEnabled()).isTrue();

            verify(userRepository).saveAndFlush(testUser);
            verify(tokenRepository).delete(token);
        }

        @Test
        @DisplayName("Throws InvalidTokenException when token does not exist")
        void verifyEmail_TokenNotFound_ThrowsInvalidTokenException() {
            when(tokenRepository.findByToken("non-existent")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.verifyEmail("non-existent"))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("Invalid verification token");

            verify(userRepository, never()).saveAndFlush(any());
            verify(tokenRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Throws InvalidTokenException when token is expired")
        void verifyEmail_ExpiredToken_ThrowsInvalidTokenException() {
            String tokenString = "expired-token-456";
            EmailVerificationToken token = new EmailVerificationToken(
                    tokenString,
                    testUser,
                    LocalDateTime.now().minusHours(1)
            );

            when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(token));

            assertThatThrownBy(() -> authService.verifyEmail(tokenString))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("Verification token has expired");

            verify(userRepository, never()).saveAndFlush(any());
            verify(tokenRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Resend Verification Email Tests")
    class ResendVerificationTests {

        @Test
        @DisplayName("Resends token for existing unverified user by deleting old tokens and sending new one")
        void resendVerificationEmail_UnverifiedUser_Success() {
            ResendVerificationRequest request = new ResendVerificationRequest("STUDENT@STUDYCOLLAB.COM ");
            testUser.setEnabled(false);

            when(userRepository.findByEmail("student@studycollab.com")).thenReturn(Optional.of(testUser));

            authService.resendVerificationEmail(request);

            verify(tokenRepository).deleteByUser(testUser);
            verify(tokenRepository).flush();
            verify(tokenRepository).save(any(EmailVerificationToken.class));
            verify(emailService).sendVerificationEmail(eq("student@studycollab.com"), anyString());
        }

        @Test
        @DisplayName("Does nothing when user is already verified")
        void resendVerificationEmail_AlreadyVerifiedUser_DoesNothing() {
            ResendVerificationRequest request = new ResendVerificationRequest("student@studycollab.com");
            testUser.setEnabled(true);

            when(userRepository.findByEmail("student@studycollab.com")).thenReturn(Optional.of(testUser));

            authService.resendVerificationEmail(request);

            verify(tokenRepository, never()).deleteByUser(any());
            verify(tokenRepository, never()).save(any());
            verify(emailService, never()).sendVerificationEmail(any(), any());
        }

        @Test
        @DisplayName("Does nothing when user is not found (prevents email enumeration)")
        void resendVerificationEmail_UserNotFound_DoesNothing() {
            ResendVerificationRequest request = new ResendVerificationRequest("unknown@studycollab.com");
            when(userRepository.findByEmail("unknown@studycollab.com")).thenReturn(Optional.empty());

            authService.resendVerificationEmail(request);

            verify(tokenRepository, never()).deleteByUser(any());
            verify(tokenRepository, never()).save(any());
            verify(emailService, never()).sendVerificationEmail(any(), any());
        }
    }

    @Nested
    @DisplayName("Generate Access Token Response Tests")
    class GenerateAccessTokenTests {

        @Test
        @DisplayName("Generates new access token for given user")
        void generateAccessTokenResponse_Success() {
            when(tokenProvider.generateToken(100L, "student@studycollab.com")).thenReturn("new_access_token");

            AuthResponse response = authService.generateAccessTokenResponse(testUser);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(100L);
            assertThat(response.token()).isEqualTo("new_access_token");
            assertThat(response.email()).isEqualTo("student@studycollab.com");
        }
    }
}
