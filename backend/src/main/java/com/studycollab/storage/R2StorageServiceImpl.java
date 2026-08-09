package com.studycollab.storage;

import com.studycollab.config.properties.CloudflareR2Properties;
import com.studycollab.exception.FileStorageException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;

@Service
public class R2StorageServiceImpl implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final CloudflareR2Properties r2Properties;

    public R2StorageServiceImpl(S3Client s3Client, S3Presigner s3Presigner, CloudflareR2Properties r2Properties) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.r2Properties = r2Properties;
    }

    @Override
    public String uploadFile(MultipartFile file, String objectKey, String contentType) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(r2Properties.bucketName())
                    .key(objectKey)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );

            String baseUrl = r2Properties.publicUrl().endsWith("/")
                    ? r2Properties.publicUrl()
                    : r2Properties.publicUrl() + "/";

            return baseUrl + objectKey;
        } catch (S3Exception e) {
            throw new FileStorageException("Storage provider error: " + e.awsErrorDetails().errorMessage(), e);
        } catch (IOException e) {
            throw new FileStorageException("Failed to read input file stream", e);
        }
    }

    @Override
    public void deleteFile(String objectKey) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(r2Properties.bucketName())
                    .key(objectKey)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
        } catch (S3Exception e) {
            throw new FileStorageException("Failed to delete file from storage provider", e);
        }
    }

    @Override
    public String generatePresignedDownloadUrl(String objectKey, String fileName, String disposition) {
        try {
            String mode = "attachment".equalsIgnoreCase(disposition) ? "attachment" : "inline";
            String contentDisposition = mode + "; filename=\"" + fileName + "\"";

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(r2Properties.bucketName())
                    .key(objectKey)
                    .responseContentDisposition(contentDisposition)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(15))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (Exception e) {
            throw new FileStorageException("Failed generating presigned download URL", e);
        }
    }
}