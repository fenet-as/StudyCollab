package com.studycollab.controller.files;

import com.studycollab.dto.files.CategoryRequest;
import com.studycollab.dto.files.CategoryResponse;
import com.studycollab.dto.files.FileResponse;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.service.files.FilesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups/{groupId}")
public class FilesController {

    private static final Logger log = LoggerFactory.getLogger(FilesController.class);

    @Autowired
    private FilesService filesService;

    // --- CATEGORIES API ---

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories(@PathVariable Long groupId) {
        return ResponseEntity.ok(filesService.getCategoryTree(groupId));
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(
            @PathVariable Long groupId,
            @RequestBody CategoryRequest request,
            @AuthenticationPrincipal User currentUser) {

        StudyGroup group = new StudyGroup();
        group.setId(groupId);

        return ResponseEntity.ok(filesService.createCategory(groupId, request, group));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long groupId,
            @PathVariable Long categoryId) {

        // 🌟 DEBUG LOGGING: Watch your backend console!
        log.info("[DELETE CATEGORY] Received request - groupId: {}, categoryId: {}", groupId, categoryId);

        if (categoryId == null || categoryId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category ID provided.");
        }

        try {
            filesService.deleteCategory(categoryId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("[DELETE CATEGORY ERROR] Failed to delete category ID: " + categoryId, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    // --- FILES API ---

    @GetMapping("/files")
    public ResponseEntity<List<FileResponse>> getFiles(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(filesService.getFiles(groupId, categoryId, search));
    }

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileResponse> uploadFile(
            @PathVariable Long groupId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("categoryId") Long categoryId, // 👈 Removed required = false. It is now strictly required.
            @AuthenticationPrincipal User currentUser) throws IOException {

        StudyGroup group = new StudyGroup();
        group.setId(groupId);

        return ResponseEntity.ok(filesService.uploadFile(file, categoryId, group, currentUser));
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long groupId,
            @PathVariable Long fileId) {

        log.info("[DELETE FILE] Received request - groupId: {}, fileId: {}", groupId, fileId);

        if (fileId == null || fileId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file ID provided.");
        }

        try {
            filesService.deleteFile(fileId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    // --- FILE CONTENT PREVIEW (STREAM / RETRIEVAL) ---

    // Replace the bottom endpoint inside your FilesController.java with this:

    // --- FILE CONTENT PREVIEW (STREAM / RETRIEVAL) ---

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<?> getFileDownloadUrl(
            @PathVariable Long groupId,
            @PathVariable Long fileId,
            @RequestParam(defaultValue = "inline") String disposition) {
        try {
            String securePresignedUrl = filesService.generatePresignedDownloadUrl(fileId, disposition);
            return ResponseEntity.ok(Map.of("downloadUrl", securePresignedUrl));
        } catch (Exception e) {
            // Log the actual exceptionStackTrace to your terminal!
            log.error("Failed to generate presigned download URL for fileId: {}", fileId, e);

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Failed creating download URL: " + e.getMessage(), e);
        }
    }

}