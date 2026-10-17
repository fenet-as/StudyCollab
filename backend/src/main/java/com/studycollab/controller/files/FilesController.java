package com.studycollab.controller.files;

import com.studycollab.dto.files.CategoryRequest;
import com.studycollab.dto.files.CategoryResponse;
import com.studycollab.dto.files.FileResponse;
import com.studycollab.dto.files.PresignedUrlResponse;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.files.FilesService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}")
public class FilesController {

    private final FilesService filesService;

    public FilesController(FilesService filesService) {
        this.filesService = filesService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories(@PathVariable Long groupId) {
        return ResponseEntity.ok(filesService.getCategoryTree(groupId));
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(
            @PathVariable Long groupId,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(filesService.createCategory(groupId, request));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long groupId,
            @PathVariable Long categoryId) {
        filesService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

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
            @RequestParam("categoryId") Long categoryId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(filesService.uploadFile(groupId, file, categoryId, userDetails.getId()));
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long groupId,
            @PathVariable Long fileId) {
        filesService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<PresignedUrlResponse> getFileDownloadUrl(
            @PathVariable Long groupId,
            @PathVariable Long fileId,
            @RequestParam(defaultValue = "inline") String disposition) {
        return ResponseEntity.ok(filesService.generatePresignedDownloadUrl(fileId, disposition));
    }
}