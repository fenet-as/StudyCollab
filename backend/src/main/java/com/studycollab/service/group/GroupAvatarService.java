package com.studycollab.service.group;

import com.studycollab.exception.CustomExceptions;
import com.studycollab.exception.InvalidFileException;
import com.studycollab.model.StudyGroup;
import com.studycollab.repository.group.GroupRepository;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

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

    private final S3Client s3Client;
    private final GroupRepository groupRepository;
    private final Tika tika = new Tika();

    @Value("${cloudflare.r2.bucket-name:${cloudflare.r2.bucketName:}}")
    private String bucketName;

    @Value("${cloudflare.r2.public-url:${cloudflare.r2.publicUrl:}}")
    private String publicUrl;

    public GroupAvatarService(S3Client s3Client, GroupRepository groupRepository) {
        this.s3Client = s3Client;
        this.groupRepository = groupRepository;
    }

    public String uploadGroupAvatar(Long groupId, MultipartFile file) {
        String detectedMimeType = validateImageFile(file);

        if (bucketName == null || bucketName.isBlank()) {
            throw new IllegalStateException("CRITICAL CONFIG ERROR: 'cloudflare.r2.bucketName' is missing in properties!");
        }

        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        String extension = getFileExtension(file.getOriginalFilename(), detectedMimeType);

        // Deterministic key per group (e.g. group-avatars/group-1.png)
        String newObjectKey = "group-avatars/group-" + groupId + extension;

        // Clean up previous image if extension changed (e.g., .jpg -> .png)
        if (group.getAvatarUrl() != null && !group.getAvatarUrl().isBlank()) {
            String oldKey = extractObjectKey(group.getAvatarUrl());
            if (oldKey != null && !oldKey.equals(newObjectKey)) {
                deleteFromR2(oldKey);
            }
        }

        try {
            String storageContentType = (file.getContentType() != null && !file.getContentType().isBlank())
                    ? file.getContentType()
                    : detectedMimeType;

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(newObjectKey)
                    .contentType(storageContentType)
                    .contentLength(file.getSize())
                    .build();

            // Cloudflare R2 automatically overwrites the object if newObjectKey matches old key
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Build full public URL safely with timestamp cache-buster for browser re-fetching
            String baseUrl = (publicUrl != null && !publicUrl.isBlank())
                    ? publicUrl.replaceAll("/+$", "") + "/" + newObjectKey
                    : newObjectKey;

            // Add cache-busting parameter so browsers load updated avatar immediately
            String fullAvatarUrl = baseUrl + "?t=" + System.currentTimeMillis();

            group.setAvatarUrl(fullAvatarUrl);
            groupRepository.save(group);

            log.info("Uploaded avatar for group {}: {}", groupId, newObjectKey);
            return fullAvatarUrl;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload group avatar to Cloudflare R2", e);
        }
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
            deleteFromR2(objectKey);

            group.setAvatarUrl(null);
            groupRepository.save(group);
        }
    }

    private void deleteFromR2(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) return;

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("Deleted object from R2: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to delete object from Cloudflare R2: {}", objectKey, e);
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