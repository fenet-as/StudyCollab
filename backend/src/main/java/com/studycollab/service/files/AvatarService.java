package com.studycollab.service.files;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;

@Service
public class AvatarService {

    private final S3Client s3Client;

    @Value("${cloudflare.r2.bucketName}")
    private String bucketName;

    // 💡 Add your public domain property here (e.g., https://pub-xxx.r2.dev or custom domain)
    @Value("${cloudflare.r2.publicUrl}")
    private String publicUrl;

    public AvatarService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String uploadUserAvatar(MultipartFile file, Long userId) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files (JPG, PNG, WEBP) are allowed.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Fixed key per user -> Overwrites old image automatically in R2
        String objectKey = "avatars/user_" + userId + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // 💡 Construct public browser URL instead of the private S3 endpoint
        String baseUrl = publicUrl.endsWith("/") ? publicUrl : publicUrl + "/";
        return baseUrl + objectKey;
    }
}