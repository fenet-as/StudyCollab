// backend/src/main/java/com/studycollab/repository/group/GroupMemberRepository.java
package com.studycollab.repository.group;

import com.studycollab.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    @Query("SELECT gm FROM GroupMember gm WHERE gm.studyGroup.id = :groupId AND gm.user.id = :userId")
    Optional<GroupMember> findByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Query("SELECT gm FROM GroupMember gm WHERE gm.studyGroup.id = :groupId AND gm.id = :membershipId")
    Optional<GroupMember> findByGroupIdAndId(@Param("groupId") Long groupId, @Param("membershipId") Long membershipId);




    long countByStudyGroupId(Long groupId);
    List<GroupMember> findTop4ByStudyGroupIdOrderByJoinedAtAsc(Long groupId);
}