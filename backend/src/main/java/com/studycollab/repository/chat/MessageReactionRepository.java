package com.studycollab.repository.chat;

import com.studycollab.model.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    Optional<MessageReaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
    List<MessageReaction> findByMessageId(Long messageId);
    void deleteByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
    long countByMessageId(Long messageId);
}

