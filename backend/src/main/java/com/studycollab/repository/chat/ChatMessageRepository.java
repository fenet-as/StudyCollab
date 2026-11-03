package com.studycollab.repository.chat;

import com.studycollab.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChannelIdOrderByIdDesc(Long channelId, Pageable pageable);
    List<ChatMessage> findByChannelIdAndIdLessThanOrderByIdDesc(Long channelId, Long beforeId, Pageable pageable);
    List<ChatMessage> findByChannelIdAndIsPinnedTrueOrderByIdDesc(Long channelId);
    long countByChannelId(Long channelId);
}

