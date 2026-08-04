package com.studycollab.repository.group;

import com.studycollab.model.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<StudyGroup, Long> {
    Optional<StudyGroup> findByInviteCode(String inviteCode);

    // JOIN FETCH grabs the members and users securely in one query
    @Query("SELECT DISTINCT g FROM StudyGroup g " +
            "JOIN FETCH g.members m " +
            "JOIN FETCH m.user u " +
            "WHERE g.id IN (SELECT sg.id FROM StudyGroup sg JOIN sg.members member WHERE member.user.id = :userId)")
    List<StudyGroup> findGroupsByUserId(@Param("userId") Long userId);

}