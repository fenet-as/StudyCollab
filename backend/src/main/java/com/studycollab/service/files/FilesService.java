package com.studycollab.service.files;

import com.studycollab.dto.files.CategoryRequest;
import com.studycollab.dto.files.CategoryResponse;
import com.studycollab.dto.files.FileResponse;
import com.studycollab.model.*;
import com.studycollab.repository.files.CategoryRepository;
import com.studycollab.repository.files.FilesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

// 🌟 S3 & R2 Dependencies
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FilesService {

    @Autowired
    private FilesRepository filesRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private S3Client s3Client;

    @Autowired
    private S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    // --- CATEGORY ACTIONS (Keep Unchanged) ---

    public List<CategoryResponse> getCategoryTree(Long groupId) {
        List<Category> rootCategories = categoryRepository.findByStudyGroupIdAndParentIsNull(groupId);
        return rootCategories.stream().map(this::mapToCategoryResponse).collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(Long groupId, CategoryRequest request, StudyGroup group) {
        Category category = Category.builder()
                .name(request.getName())
                .studyGroup(group)
                .build();

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent Category not found"));

            if (!parent.getStudyGroup().getId().equals(groupId)) {
                throw new IllegalArgumentException("Parent category does not belong to this study group.");
            }
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (category.getParent() != null) {
            category.getParent().getChildren().remove(category);
        }

        // ⚠️ Note: If cascading deletion is enabled, you might want to manually loop and
        // delete associated files from R2 first so you don't leave orphaned files in the cloud!
        for (FileResource file : category.getFiles()) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(file.getStorageKey()).build());
            } catch (Exception e) {
                // Log and continue to ensure database transaction completes
            }
        }

        categoryRepository.delete(category);
    }

    // --- FILE ACTIONS ---

    public List<FileResponse> getFiles(Long groupId, Long categoryId, String query) {
        List<FileResource> files;
        if (query != null && !query.isEmpty()) {
            files = filesRepository.searchFiles(groupId, query);
        } else if (categoryId != null) {
            files = filesRepository.findByStudyGroupIdAndCategoryId(groupId, categoryId);
        } else {
            files = filesRepository.findByStudyGroupId(groupId);
        }
        return files.stream().map(this::mapToFileResponse).collect(Collectors.toList());
    }

    @Transactional
    public FileResponse uploadFile(MultipartFile file, Long categoryId, StudyGroup group, User user) throws IOException {
        if (categoryId == null) {
            throw new IllegalArgumentException("A file must be uploaded to a specific category.");
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Target category folder not found"));

        if (!category.getStudyGroup().getId().equals(group.getId())) {
            throw new IllegalArgumentException("The selected category does not belong to this study group.");
        }

        String originalFilename = file.getOriginalFilename();

        // Create an isolated storage key unique per study group
        String uniqueId = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);
        String storageKey = "groups/" + group.getId() + "/categories/" + categoryId + "/" + uniqueId + "_" + originalFilename;

        // Stream file contents up to Cloudflare R2
        s3Client.putObject(PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(storageKey)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        String extension = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase()
                : "file";
        String fileType = "file";
        if (List.of("pdf").contains(extension)) fileType = "pdf";
        else if (List.of("doc", "docx").contains(extension)) fileType = "doc";
        else if (List.of("xls", "xlsx", "csv").contains(extension)) fileType = "sheet";
        else if (List.of("ppt", "pptx").contains(extension)) fileType = "slides";

        FileResource fileResource = FileResource.builder()
                .name(originalFilename)
                .size(formatBytes(file.getSize()))
                .fileType(fileType)
                .storageKey(storageKey) // Save file cloud key path reference
                .studyGroup(group)
                .category(category)
                .uploader(user)
                .build();

        FileResource saved = filesRepository.save(fileResource);
        return mapToFileResponse(saved);
    }




    // --- FILE ACTIONS ---

//    /**
//     * Generates secure, short-lived presigned URLs for users directly from Cloudflare R2.
//     * @param fileId DB ID of the file
//     * @param disposition "inline" (view in tab) or "attachment" (force save to disk)
//     */



    public String generatePresignedDownloadUrl(Long fileId, String disposition) {
        FileResource fileResource = filesRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Sanitize disposition input
        String mode = "attachment".equalsIgnoreCase(disposition) ? "attachment" : "inline";
        String contentDisposition = mode + "; filename=\"" + fileResource.getName() + "\"";

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileResource.getStorageKey())
                .responseContentDisposition(contentDisposition)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(15))
                .getObjectRequest(getObjectRequest)
                .build();

        // Check if s3Presigner is null or throwing an exception here!
        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }

    public FileResource getFileMetadata(Long fileId) {
        return filesRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }

    @Transactional
    public void deleteFile(Long fileId) {
        FileResource fileResource = filesRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File Resource not found"));

        // Delete structural asset block inside cloud infrastructure storage bucket
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileResource.getStorageKey())
                    .build());
        } catch (Exception ex) {
            throw new RuntimeException("Cloud storage deletion failed. Keeping database record intact.", ex);
        }

        filesRepository.delete(fileResource);
    }

    // --- HELPER CONVERSIONS ---

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .children(category.getChildren().stream().map(this::mapToCategoryResponse).collect(Collectors.toList()))
                .build();
    }

    private FileResponse mapToFileResponse(FileResource file) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return FileResponse.builder()
                .id(file.getId())
                .name(file.getName())
                .size(file.getSize())
                .type(file.getFileType())
                .categoryId(file.getCategory() != null ? file.getCategory().getId() : null)
                .uploader(file.getUploader().getFullName())
                .date(file.getCreatedAt().format(formatter))
                .build();
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " Bytes";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGT".charAt(exp - 1);
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}