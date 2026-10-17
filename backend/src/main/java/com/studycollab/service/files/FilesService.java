package com.studycollab.service.files;

import com.studycollab.dto.files.CategoryRequest;
import com.studycollab.dto.files.CategoryResponse;
import com.studycollab.dto.files.FileResponse;
import com.studycollab.dto.files.PresignedUrlResponse;
import com.studycollab.exception.InvalidRequestException;
import com.studycollab.exception.ResourceNotFoundException;
import com.studycollab.model.Category;
import com.studycollab.model.FileResource;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.files.CategoryRepository;
import com.studycollab.repository.files.FilesRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.storage.StorageService;
import org.apache.commons.io.FilenameUtils;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class FilesService {

    private static final Logger log = LoggerFactory.getLogger(FilesService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");







    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "text/plain",

            // Spreadsheets
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "text/csv",

            // Presentations
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            "application/vnd.openxmlformats-officedocument.presentationml.slideshow", // .ppsx

            // Images
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml"
    );

    @Value("${app.files.max-file-size-bytes:52428800}")
    private long maxSizeBytes;

    @Value("${app.files.group-quota-bytes:5368709120}")
    private long groupQuotaBytes;

    private final FilesRepository filesRepository;
    private final CategoryRepository categoryRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final Tika tika = new Tika();

    public FilesService(
            FilesRepository filesRepository,
            CategoryRepository categoryRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            StorageService storageService) {
        this.filesRepository = filesRepository;
        this.categoryRepository = categoryRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    @PreAuthorize("@groupSecurity.isMember(#groupId, principal.id)")
    public List<CategoryResponse> getCategoryTree(Long groupId) {
        validateGroupExists(groupId);
        List<Category> rootCategories = categoryRepository.findByStudyGroupIdAndParentIsNull(groupId);
        return rootCategories.stream().map(this::mapToCategoryResponse).toList();
    }

    @Transactional
    @PreAuthorize("@groupSecurity.isMember(#groupId, principal.id)")
    public CategoryResponse createCategory(Long groupId, CategoryRequest request) {
        StudyGroup group = fetchStudyGroup(groupId);

        Category category = Category.builder()
                .name(sanitizeString(request.getName()))
                .studyGroup(group)
                .build();

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getParentId()));

            if (!parent.getStudyGroup().getId().equals(groupId)) {
                throw new InvalidRequestException("Parent category does not belong to the target study group.");
            }
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Transactional
    @PreAuthorize("@groupSecurity.isCategoryMember(#categoryId, principal.id)")
    public void deleteCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        if (category.getParent() != null) {
            category.getParent().getChildren().remove(category);
        }

        for (FileResource file : category.getFiles()) {
            if (file.getStorageKey() != null) {
                storageService.deleteFile(file.getStorageKey());
            }
        }

        categoryRepository.delete(category);
    }

    @PreAuthorize("@groupSecurity.isMember(#groupId, principal.id)")
    public List<FileResponse> getFiles(Long groupId, Long categoryId, String query) {
        validateGroupExists(groupId);

        List<FileResource> files;
        if (query != null && !query.trim().isEmpty()) {
            files = filesRepository.searchFiles(groupId, query.trim());
        } else if (categoryId != null) {
            files = filesRepository.findByStudyGroupIdAndCategoryId(groupId, categoryId);
        } else {
            files = filesRepository.findByStudyGroupId(groupId);
        }

        return files.stream().map(this::mapToFileResponse).toList();
    }

    @Transactional
    @PreAuthorize("@groupSecurity.isMember(#groupId, principal.id)")
    public FileResponse uploadFile(Long groupId, MultipartFile file, Long categoryId, Long userId) {
        if (file.getSize() > maxSizeBytes) {
            throw new InvalidRequestException("File size exceeds maximum allowed limit of " + formatBytes(maxSizeBytes));
        }

        long currentGroupUsage = filesRepository.sumSizeBytesByGroupId(groupId);
        if (currentGroupUsage + file.getSize() > groupQuotaBytes) {
            throw new InvalidRequestException("Group storage quota exceeded. Max limit is " + formatBytes(groupQuotaBytes));
        }

        String detectedMimeType = detectMimeType(file);
        if (!ALLOWED_MIME_TYPES.contains(detectedMimeType)) {
            throw new InvalidRequestException("Unsupported or malicious file content type: " + detectedMimeType);
        }

        StudyGroup group = fetchStudyGroup(groupId);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        if (!category.getStudyGroup().getId().equals(groupId)) {
            throw new InvalidRequestException("Category does not belong to the target study group.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String rawFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String cleanOriginalName = FilenameUtils.getName(rawFilename);

        String opaqueStorageKey = "groups/" + groupId + "/categories/" + categoryId + "/"
                + UUID.randomUUID() + "." + FilenameUtils.getExtension(cleanOriginalName);

        storageService.uploadFile(file, opaqueStorageKey, detectedMimeType);

        try {
            FileResource fileResource = FileResource.builder()
                    .name(cleanOriginalName)
                    .size(formatBytes(file.getSize()))
                    .sizeBytes(file.getSize())
                    .fileType(resolveFileTypeFromMime(detectedMimeType))
                    .storageKey(opaqueStorageKey)
                    .studyGroup(group)
                    .category(category)
                    .uploader(user)
                    .build();

            FileResource saved = filesRepository.save(fileResource);
            return mapToFileResponse(saved);
        } catch (Exception ex) {
            log.error("Database save failed for file: {}. Cleaning up orphaned object in storage.", opaqueStorageKey, ex);
            try {
                storageService.deleteFile(opaqueStorageKey);
            } catch (Exception cleanupEx) {
                log.error("Failed to clean up object from cloud storage: {}", opaqueStorageKey, cleanupEx);
            }
            throw ex;
        }
    }

    @PreAuthorize("@groupSecurity.isFileMember(#fileId, principal.id)")
    public PresignedUrlResponse generatePresignedDownloadUrl(Long fileId, String disposition) {
        FileResource fileResource = filesRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", fileId));

        String url = storageService.generatePresignedDownloadUrl(fileResource.getStorageKey(), fileResource.getName(), disposition);
        return new PresignedUrlResponse(url);
    }

    @Transactional
    @PreAuthorize("@groupSecurity.isFileMember(#fileId, principal.id)")
    public void deleteFile(Long fileId) {
        FileResource fileResource = filesRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", fileId));

        storageService.deleteFile(fileResource.getStorageKey());
        filesRepository.delete(fileResource);
    }

    private String detectMimeType(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            return tika.detect(is, file.getOriginalFilename());
        } catch (IOException e) {
            throw new InvalidRequestException("Failed to inspect file bytes for validation.");
        }
    }

    private String sanitizeString(String input) {
        return input != null ? input.replaceAll("[^a-zA-Z0-9\\s._-]", "").trim() : "";
    }

    private StudyGroup fetchStudyGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("StudyGroup", "id", groupId));
    }

    private void validateGroupExists(Long groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("StudyGroup", "id", groupId);
        }
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .children(category.getChildren().stream().map(this::mapToCategoryResponse).toList())
                .build();
    }

    private FileResponse mapToFileResponse(FileResource file) {
        return FileResponse.builder()
                .id(file.getId())
                .name(file.getName())
                .size(file.getSize())
                .type(file.getFileType())
                .categoryId(file.getCategory() != null ? file.getCategory().getId() : null)
                .uploader(file.getUploader() != null ? file.getUploader().getFullName() : "Unknown")
                .date(file.getCreatedAt() != null ? file.getCreatedAt().format(DATE_FORMATTER) : null)
                .build();
    }

    private String resolveFileTypeFromMime(String mimeType) {
        return switch (mimeType) {
            case "application/pdf" -> "pdf";
            case "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> "doc";
            case "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> "sheet";
            case "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.slideshow" -> "slides";
            default -> "file";
        };
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " Bytes";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGT".charAt(exp - 1);
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}