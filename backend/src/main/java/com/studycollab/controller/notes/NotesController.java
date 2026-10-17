package com.studycollab.controller.notes;

import com.studycollab.dto.notes.NoteRequest;
import com.studycollab.dto.notes.NoteResponse;
import com.studycollab.security.CustomUserDetails;
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
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<NoteResponse> notes = notesService.getNotesByGroup(groupId, userDetails.getUser());
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        NoteResponse createdNote = notesService.createNote(request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdNote);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        NoteResponse updatedNote = notesService.updateNote(id, request, userDetails.getUser());
        return ResponseEntity.ok(updatedNote);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notesService.deleteNote(id, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}