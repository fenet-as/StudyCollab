package com.studycollab.service.notes;

import com.studycollab.dto.notes.NoteRequest;
import com.studycollab.dto.notes.NoteResponse;
import com.studycollab.exception.CustomExceptions.BadRequestException;
import com.studycollab.exception.CustomExceptions.ResourceNotFoundException;
import com.studycollab.exception.CustomExceptions.UnauthorizedException;
import com.studycollab.model.Note;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.repository.notes.NotesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotesService {

    private static final int MAX_NOTES_PER_GROUP = 500;

    private final NotesRepository notesRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public NotesService(NotesRepository notesRepository,
                        UserRepository userRepository,
                        GroupRepository groupRepository) {
        this.notesRepository = notesRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getNotesByGroup(Long groupId, User currentUser) {
        StudyGroup group = findGroupById(groupId);
        validateMembership(currentUser, group);

        return notesRepository.findByStudyGroupIdOrderByUpdatedAtDesc(group.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteResponse createNote(NoteRequest request, User currentUser) {
        StudyGroup group = null;
        if (request.getGroupId() != null) {
            group = findGroupById(request.getGroupId());
            validateMembership(currentUser, group);

            // Enforce limit on notes per group
            long existingCount = notesRepository.countByStudyGroupId(group.getId());
            if (existingCount >= MAX_NOTES_PER_GROUP) {
                throw new BadRequestException("Group has reached the maximum capacity of " + MAX_NOTES_PER_GROUP + " notes.");
            }
        }

        Note note = Note.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .owner(currentUser)
                .studyGroup(group)
                .build();

        return mapToResponse(notesRepository.save(note));
    }

    @Transactional
    public NoteResponse updateNote(Long noteId, NoteRequest request, User currentUser) {
        Note note = findNoteById(noteId);

        if (note.getStudyGroup() != null) {
            validateMembership(currentUser, note.getStudyGroup());
        }

        validateOwnership(currentUser, note);

        note.setTitle(request.getTitle());
        note.setContent(request.getContent());

        return mapToResponse(notesRepository.save(note));
    }

    @Transactional
    public void deleteNote(Long noteId, User currentUser) {
        Note note = findNoteById(noteId);

        if (note.getStudyGroup() != null) {
            validateMembership(currentUser, note.getStudyGroup());
        }

        validateOwnership(currentUser, note);

        notesRepository.delete(note);
    }

    // --- Helpers ---

    private Note findNoteById(Long id) {
        return notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));
    }

    private StudyGroup findGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Study group not found with id: " + id));
    }

    private void validateMembership(User user, StudyGroup group) {
        if (user == null || group == null) {
            return;
        }

        boolean isMember = group.getMembers() != null && group.getMembers().stream()
                .anyMatch(member -> member.getUser() != null
                        && member.getUser().getId().equals(user.getId()));

        if (!isMember) {
            throw new BadRequestException("User " + user.getId() + " is not a member of group " + group.getId());
        }
    }

    private void validateOwnership(User user, Note note) {
        if (user == null || note.getOwner() == null || !note.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("You do not have permission to modify or delete this note.");
        }
    }

    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .ownerId(note.getOwner() != null ? note.getOwner().getId() : null)
                .ownerName(note.getOwner() != null ? note.getOwner().getFullName() : "Unknown Member")
                .groupId(note.getStudyGroup() != null ? note.getStudyGroup().getId() : null)
                .build();
    }
}