package com.studycollab.service.files;

import com.studycollab.dto.files.AvatarUploadResponse;
import com.studycollab.exception.InvalidFileException;
import com.studycollab.exception.ResourceNotFoundException;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.storage.StorageService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.apache.tika.Tika;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Set;

@Service
@Transactional
public class AvatarServiceImpl implements AvatarService {

    private static final Logger logger = LoggerFactory.getLogger(AvatarServiceImpl.class);

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final StorageService storageService;
    private final UserRepository userRepository;
    private final Tika tika = new Tika();

    @Value("${cloudflare.zone-id:}")
    private String zoneId;

    @Value("${cloudflare.api-token:}")
    private String apiToken;

    public AvatarServiceImpl(StorageService storageService, UserRepository userRepository) {
        this.storageService = storageService;
        this.userRepository = userRepository;
    }

    @Override
    public AvatarUploadResponse processAndSaveAvatar(MultipartFile file, Long userId) {
        String detectedMimeType = validateImageFile(file);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Single fixed object key per user in Cloudflare R2 / S3
        String objectKey = "avatars/user_" + userId;

        // Keep client-supplied Content-Type for storage metadata, fallback to detected
        String contentType = (file.getContentType() != null && !file.getContentType().isBlank())
                ? file.getContentType()
                : detectedMimeType;

        // Upload and overwrite the file in storage
        String baseUrl = storageService.uploadFile(file, objectKey, contentType);

        // Strip any existing query params from baseUrl if storageService returns them
        String cleanBaseUrl = baseUrl.contains("?") ? baseUrl.substring(0, baseUrl.indexOf("?")) : baseUrl;

        // Purge raw Cloudflare CDN cache for the base URL
        purgeCloudflareCache(cleanBaseUrl);

        // Append a unique cache-buster timestamp for browser clients
        String versionedAvatarUrl = cleanBaseUrl + "?v=" + System.currentTimeMillis();

        // Update user entity and database record
        user.setAvatarUrl(versionedAvatarUrl);
        userRepository.save(user);

        return new AvatarUploadResponse("Avatar updated successfully", versionedAvatarUrl);
    }

    private void purgeCloudflareCache(String urlToPurge) {
        if (zoneId == null || zoneId.isBlank() || apiToken == null || apiToken.isBlank()) {
            logger.warn("Cloudflare zone ID or API token not configured. Skipping CDN cache purge.");
            return;
        }

        try {
            HttpClient client = HttpClient.newHttpClient();
            String jsonPayload = "{\"files\":[\"" + urlToPurge + "\"]}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudflare.com/client/v4/zones/" + zoneId + "/purge_cache"))
                    .header("Authorization", "Bearer " + apiToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> {
                        if (response.statusCode() == 200) {
                            logger.info("Successfully purged Cloudflare cache for URL: {}", urlToPurge);
                        } else {
                            logger.warn("Cloudflare cache purge failed with status {}: {}", response.statusCode(), response.body());
                        }
                    });
        } catch (Exception e) {
            logger.warn("Failed to initiate Cloudflare cache purge for URL: " + urlToPurge, e);
        }
    }

    String validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Uploaded file cannot be empty");
        }

        String detectedMimeType = detectMimeType(file);

        if (!ALLOWED_MIME_TYPES.contains(detectedMimeType.toLowerCase())) {
            throw new InvalidFileException("Only image files (JPG, PNG, WEBP) are allowed");
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
}