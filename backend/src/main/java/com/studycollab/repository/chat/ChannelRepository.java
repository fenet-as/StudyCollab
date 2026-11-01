package com.studycollab.repository.chat;

import com.studycollab.model.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {
    List<Channel> findByStudyGroupIdOrderByIdAsc(Long studyGroupId);
    Optional<Channel> findByStudyGroupIdAndIsDefaultTrue(Long studyGroupId);
    Optional<Channel> findByStudyGroupIdAndName(Long studyGroupId, String name);
    boolean existsByStudyGroupIdAndName(Long studyGroupId, String name);
    long countByStudyGroupId(Long studyGroupId);
}

