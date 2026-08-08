package com.studycollab.service.files;

import com.studycollab.dto.files.AvatarUploadResponse;
import com.studycollab.exception.InvalidFileException;
import com.studycollab.exception.ResourceNotFoundException;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Service
// Marks this implementation as a Spring-managed service bean handling avatar processing business logic.
@Transactional
// Wraps method operations within a database transaction context.
public class AvatarServiceImpl implements AvatarService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    // Defines an immutable set of acceptable MIME image content types for security validation.

    private final StorageService storageService;
    private final UserRepository userRepository;

    public AvatarServiceImpl(StorageService storageService, UserRepository userRepository) {
        // Injects cloud storage infrastructure abstraction and user database repository via constructor injection.
        this.storageService = storageService;
        this.userRepository = userRepository;
    }

    @Override
    public AvatarUploadResponse processAndSaveAvatar(MultipartFile file, Long userId) {
        // Validates uploaded file, stores object in cloud, and updates user profile avatar URL.

        validateImageFile(file);
        // Validates file presence and verifies allowed content MIME type.

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        // Fetches user entity from database by ID or throws ResourceNotFoundException if missing.

        String extension = extractExtension(file.getOriginalFilename());
        // Extracts file extension string (e.g., ".png") from original filename.

        String objectKey = "avatars/user_" + userId + extension;
        // Constructs unique cloud storage object key path structured as "avatars/user_{id}.ext".

        String publicAvatarUrl = storageService.uploadFile(file, objectKey, file.getContentType());
        // Uploads image file stream to storage service and receives back the public CDN/access URL.

        user.setAvatarUrl(publicAvatarUrl);
        // Updates the user entity's avatarUrl field; JPA dirty checking persists changes on commit.

        return new AvatarUploadResponse("Avatar updated successfully", publicAvatarUrl);
        // Returns DTO payload containing success message and public avatar URL.
    }

    private void validateImageFile(MultipartFile file) {
        // Helper method ensuring uploaded file is present, non-empty, and of an allowed image format.

        if (file == null || file.isEmpty()) {
            // Checks if the file payload is null or contains zero bytes.

            throw new InvalidFileException("Uploaded file cannot be empty");
            // Throws exception if file is missing or empty.
        }

        String contentType = file.getContentType();
        // Reads the reported MIME content type header of the uploaded file.

        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            // Checks if content type is null or absent from the allowed image MIME types set.

            throw new InvalidFileException("Only image files (JPG, PNG, WEBP) are allowed");
            // Throws exception if file type is not supported.
        }
    }

    private String extractExtension(String originalFilename) {
        // Helper method extracting the file extension from the original file name.

        if (originalFilename != null && originalFilename.contains(".")) {
            // Checks if filename exists and contains a dot separator.

            return originalFilename.substring(originalFilename.lastIndexOf("."));
            // Returns file extension including the leading dot (e.g., ".png").
        }

        return ".jpg";
        // Defaults to ".jpg" if no extension is found in the original filename.
    }
}