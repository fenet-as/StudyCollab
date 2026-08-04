package com.studycollab.repository.notes;

import com.studycollab.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotesRepository extends JpaRepository<Note, Long> {
    // Fetches only notes associated with a specific study group
    List<Note> findByStudyGroupIdOrderByUpdatedAtDesc(Long groupId);




    long countByStudyGroupId(Long groupId);
    List<Note> findTop5ByStudyGroupIdOrderByUpdatedAtDesc(Long groupId);
}