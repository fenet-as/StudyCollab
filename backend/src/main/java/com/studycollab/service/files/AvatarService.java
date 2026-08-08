package com.studycollab.service.files;

import com.studycollab.dto.files.AvatarUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AvatarService {
// Interface contract defining image upload processing operations for user avatars.

    AvatarUploadResponse processAndSaveAvatar(MultipartFile file, Long userId);
    // Method signature to validate, upload, and associate an avatar image file with a user ID.
}