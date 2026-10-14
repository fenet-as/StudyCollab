package com.studycollab.service.group;

import com.studycollab.exception.CustomExceptions;
import com.studycollab.exception.InvalidFileException;
import com.studycollab.model.StudyGroup;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.storage.StorageService;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

@Service
public class GroupAvatarService {

    private static final Logger log = LoggerFactory.getLogger(GroupAvatarService.class);

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final StorageService storageService;
    private final GroupRepository groupRepository;
    private final Tika tika = new Tika();

    public GroupAvatarService(StorageService storageService, GroupRepository groupRepository) {
        this.storageService = storageService;
        this.groupRepository = groupRepository;
    }

    public String uploadGroupAvatar(Long groupId, MultipartFile file) {
        String detectedMimeType = validateImageFile(file);

        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        String extension = getFileExtension(file.getOriginalFilename(), detectedMimeType);

        // Deterministic key per group (e.g. group-avatars/group-1.png)
        String newObjectKey = "group-avatars/group-" + groupId + extension;

        // Clean up previous image if extension changed (e.g., .jpg -> .png)
        if (group.getAvatarUrl() != null && !group.getAvatarUrl().isBlank()) {
            String oldKey = extractObjectKey(group.getAvatarUrl());
            if (oldKey != null && !oldKey.equals(newObjectKey)) {
                storageService.deleteFile(oldKey);
            }
        }

        String storageContentType = (file.getContentType() != null && !file.getContentType().isBlank())
                ? file.getContentType()
                : detectedMimeType;

        String baseUrl = storageService.uploadFile(file, newObjectKey, storageContentType);
        String cleanBaseUrl = baseUrl.contains("?") ? baseUrl.substring(0, baseUrl.indexOf("?")) : baseUrl;

        // Add cache-busting parameter so browsers load updated avatar immediately
        String fullAvatarUrl = cleanBaseUrl + "?t=" + System.currentTimeMillis();

        group.setAvatarUrl(fullAvatarUrl);
        groupRepository.save(group);

        log.info("Uploaded avatar for group {}: {}", groupId, newObjectKey);
        return fullAvatarUrl;
    }

    String validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File cannot be empty");
        }

        String detectedMimeType = detectMimeType(file);

        if (!ALLOWED_MIME_TYPES.contains(detectedMimeType.toLowerCase())) {
            throw new InvalidFileException("Only JPEG, PNG, and WEBP formats are allowed");
        }
        return detectedMimeType;
    }

    private String detectMimeType(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            return tika.detect(is);
        } catch (IOException e) {
            throw new InvalidFileException("Failed to inspect file bytes for validation.");
        }
    }

    public String getGroupAvatarUrl(Long groupId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        return group.getAvatarUrl();
    }

    public void deleteGroupAvatar(Long groupId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        if (group.getAvatarUrl() != null && !group.getAvatarUrl().isBlank()) {
            String objectKey = extractObjectKey(group.getAvatarUrl());
            if (objectKey != null) {
                storageService.deleteFile(objectKey);
            }

            group.setAvatarUrl(null);
            groupRepository.save(group);
        }
    }

    private String extractObjectKey(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) return null;

        // Clean off any query parameter like "?t=1720000000"
        String cleanUrl = avatarUrl.contains("?") ? avatarUrl.substring(0, avatarUrl.indexOf("?")) : avatarUrl;

        int index = cleanUrl.indexOf("group-avatars/");
        if (index != -1) {
            return cleanUrl.substring(index);
        }
        return null;
    }

    private String getFileExtension(String filename, String detectedMimeType) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
            if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".webp")) {
                return ext;
            }
        }
        return switch (detectedMimeType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".png";
        };
    }
}