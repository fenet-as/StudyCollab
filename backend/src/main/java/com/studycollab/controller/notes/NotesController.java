package com.studycollab.controller.notes;

import com.studycollab.dto.notes.NoteRequest;
import com.studycollab.dto.notes.NoteResponse;
import com.studycollab.model.User; // Import your custom User model
import com.studycollab.service.notes.NotesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NotesService notesService;

    // Extract the dynamic user ID from the authenticated Security principal
    private Long getCurrentUserId(Object principal) {
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        throw new IllegalStateException("User session is invalid or not authenticated");
    }

    // Fetch only notes that belong to the active group
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<NoteResponse>> getGroupNotes(
            @PathVariable Long groupId,
            @AuthenticationPrincipal Object principal) {
        // Optional: you can secure this by checking if the user belongs to the group
        return ResponseEntity.ok(notesService.getNotesByGroup(groupId));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal Object principal) {
        Long userId = getCurrentUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(notesService.createNote(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal Object principal) {
        Long userId = getCurrentUserId(principal);
        return ResponseEntity.ok(notesService.updateNote(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal Object principal) {
        Long userId = getCurrentUserId(principal);
        notesService.deleteNote(id, userId);
        return ResponseEntity.noContent().build();
    }
}