package com.studycollab.repository.auth;

import com.studycollab.model.EmailVerificationToken;
import com.studycollab.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    void deleteByUser(User user);


    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiryDate < :now")
    void deleteAllExpiredSince(LocalDateTime now);
}