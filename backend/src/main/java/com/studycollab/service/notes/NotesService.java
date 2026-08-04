package com.studycollab.service.notes;

import com.studycollab.dto.notes.NoteRequest;
import com.studycollab.dto.notes.NoteResponse;
import com.studycollab.model.Note;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupRepository; // Ensure this repository exists
import com.studycollab.repository.notes.NotesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotesService {

    private final NotesRepository notesRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    @Transactional(readOnly = true)
    public List<NoteResponse> getNotesByGroup(Long groupId) {
        return notesRepository.findByStudyGroupIdOrderByUpdatedAtDesc(groupId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteResponse createNote(NoteRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudyGroup group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Study Group not found"));
        }

        Note note = Note.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .owner(user)
                .studyGroup(group) // Binds note to the active group
                .build();

        Note savedNote = notesRepository.save(note);
        return mapToResponse(savedNote);
    }

    @Transactional
    public NoteResponse updateNote(Long noteId, NoteRequest request, Long userId) {
        Note note = notesRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        note.setTitle(request.getTitle());
        note.setContent(request.getContent());

        Note updatedNote = notesRepository.save(note);
        return mapToResponse(updatedNote);
    }

    @Transactional
    public void deleteNote(Long noteId, Long userId) {
        Note note = notesRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        notesRepository.delete(note);
    }

    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .ownerId(note.getOwner().getId())
                // Maps the actual user's full name instead of their login email/username
                .ownerName(note.getOwner() != null ? note.getOwner().getFullName() : "Unknown Member")
                .groupId(note.getStudyGroup() != null ? note.getStudyGroup().getId() : null)
                .build();
    }
}