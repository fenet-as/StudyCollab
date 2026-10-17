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
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String email) {
        User user = findUserByEmail(email);
        return mapToUserProfileResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToUserProfileResponse(user);
    }

    @Override
    public void updateProfileName(String email, UpdateNameRequest request) {
        User user = findUserByEmail(email);
        user.setFullName(request.fullName().trim());
    }

    @Override
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUserByEmail(email);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Your current password choice is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }




    private UserProfileResponse mapToUserProfileResponse(User user) {
        return new UserProfileResponse(
                user.getFullName(),
                user.getEmail(),
                user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
        );
    }
}