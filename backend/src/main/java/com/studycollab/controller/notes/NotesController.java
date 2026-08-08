package com.studycollab.controller.notes;

import com.studycollab.dto.notes.NoteRequest;
import com.studycollab.dto.notes.NoteResponse;
import com.studycollab.model.User;
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

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<NoteResponse>> getGroupNotes(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User currentUser) {
        List<NoteResponse> notes = notesService.getNotesByGroup(groupId, currentUser);
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal User currentUser) {
        NoteResponse createdNote = notesService.createNote(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdNote);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal User currentUser) {
        NoteResponse updatedNote = notesService.updateNote(id, request, currentUser);
        return ResponseEntity.ok(updatedNote);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        notesService.deleteNote(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}