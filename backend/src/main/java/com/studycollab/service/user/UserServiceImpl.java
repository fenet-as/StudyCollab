package com.studycollab.service.user;

import com.studycollab.dto.auth.ChangePasswordRequest;
import com.studycollab.dto.auth.UpdateNameRequest;
import com.studycollab.dto.user.UserProfileResponse;
import com.studycollab.exception.InvalidPasswordException;
import com.studycollab.exception.ResourceNotFoundException;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
// Marks this implementation as a Spring-managed business logic service component.
@Transactional
// Encapsulates repository operations inside database transactions.
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        // Injects database access repository and password hashing encoder via constructor injection.
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    // Marks transaction as read-only to optimize data retrieval performance.
    public UserProfileResponse getCurrentUserProfile(String email) {
        User user = findUserByEmail(email);
        // Finds the authenticated user entity from the database using their email.

        return mapToUserProfileResponse(user);
        // Converts the retrieved user domain entity into a profile DTO response.
    }

    @Override
    @Transactional(readOnly = true)
    // Marks transaction as read-only to optimize data retrieval performance.
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        // Fetches user entity by ID or throws ResourceNotFoundException if missing.

        return mapToUserProfileResponse(user);
        // Converts the retrieved user domain entity into a profile DTO response.
    }

    @Override
    public void updateProfileName(String email, UpdateNameRequest request) {
        User user = findUserByEmail(email);
        // Looks up the authenticated user by email.

        user.setFullName(request.fullName().trim());
        // Updates the user's full name property after stripping leading/trailing whitespace.
        // JPA dirty checking automatically persists changes upon transaction completion
    }

    @Override
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUserByEmail(email);
        // Looks up the target user by email.

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            // Validates provided current password against the stored hashed password.

            throw new InvalidPasswordException("Your current password choice is incorrect");
            // Throws exception if current password verification fails.
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        // Hashes the new password and updates the entity property.
    }

    private User findUserByEmail(String email) {
        // Private helper method to query users by email with standardized exception handling.

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        // Throws ResourceNotFoundException if no user entity matches the email address.
    }

    private UserProfileResponse mapToUserProfileResponse(User user) {
        // Private helper method to map a User domain model to UserProfileResponse DTO.

        return new UserProfileResponse(
                user.getFullName(),
                user.getEmail(),
                user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
                // Returns user details while falling back to an empty string if avatarUrl is null.
        );
    }
}