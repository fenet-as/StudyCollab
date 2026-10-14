package com.studycollab.repository.auth;

import com.studycollab.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByEnabledFalseAndCreatedAtBeforeAndAvatarUrlIsNotNull(LocalDateTime cutoffDate);

    // Spring Data JPA will auto-generate the delete query based on this method name
    long deleteByEnabledFalseAndCreatedAtBefore(LocalDateTime cutoffDate);
}