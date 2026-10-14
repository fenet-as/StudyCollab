package com.studycollab.storage;

import com.studycollab.config.properties.CloudflareR2Properties;
import com.studycollab.exception.FileStorageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URL;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class R2StorageServiceImplTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private PresignedGetObjectRequest presignedGetObjectRequest;

    private CloudflareR2Properties r2Properties;
    private R2StorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        r2Properties = new CloudflareR2Properties(
                "access-key",
                "secret-key",
                "https://endpoint.r2.cloudflarestorage.com",
                "studycollab-bucket",
                "https://pub-r2.dev"
        );
        storageService = new R2StorageServiceImpl(s3Client, s3Presigner, r2Properties, 900L);
    }

    @Test
    @DisplayName("generatePresignedDownloadUrl uses default signatureDuration of 900 seconds (15 minutes)")
    void generatePresignedDownloadUrl_defaultExpiry_uses900Seconds() throws Exception {
        when(presignedGetObjectRequest.url()).thenReturn(new URL("https://pub-r2.dev/signed-url"));
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedGetObjectRequest);

        String result = storageService.generatePresignedDownloadUrl("notes/10/summary.pdf", "summary.pdf", "attachment");

        assertThat(result).isEqualTo("https://pub-r2.dev/signed-url");

        ArgumentCaptor<GetObjectPresignRequest> captor = ArgumentCaptor.forClass(GetObjectPresignRequest.class);
        verify(s3Presigner).presignGetObject(captor.capture());

        GetObjectPresignRequest presignRequest = captor.getValue();
        assertThat(presignRequest.signatureDuration()).isEqualTo(Duration.ofSeconds(900));
        assertThat(presignRequest.getObjectRequest().bucket()).isEqualTo("studycollab-bucket");
        assertThat(presignRequest.getObjectRequest().key()).isEqualTo("notes/10/summary.pdf");
        assertThat(presignRequest.getObjectRequest().responseContentDisposition()).isEqualTo("attachment; filename=\"summary.pdf\"");
    }

    @Test
    @DisplayName("generatePresignedDownloadUrl respects custom configured signatureDuration")
    void generatePresignedDownloadUrl_customExpiry_usesCustomDuration() throws Exception {
        R2StorageServiceImpl customService = new R2StorageServiceImpl(s3Client, s3Presigner, r2Properties, 1800L);

        when(presignedGetObjectRequest.url()).thenReturn(new URL("https://pub-r2.dev/custom-signed-url"));
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedGetObjectRequest);

        String result = customService.generatePresignedDownloadUrl("notes/10/summary.pdf", "summary.pdf", "inline");

        assertThat(result).isEqualTo("https://pub-r2.dev/custom-signed-url");

        ArgumentCaptor<GetObjectPresignRequest> captor = ArgumentCaptor.forClass(GetObjectPresignRequest.class);
        verify(s3Presigner).presignGetObject(captor.capture());

        GetObjectPresignRequest presignRequest = captor.getValue();
        assertThat(presignRequest.signatureDuration()).isEqualTo(Duration.ofSeconds(1800));
        assertThat(presignRequest.getObjectRequest().responseContentDisposition()).isEqualTo("inline; filename=\"summary.pdf\"");
    }

    @Test
    @DisplayName("generatePresignedDownloadUrl defaults non-attachment disposition to inline")
    void generatePresignedDownloadUrl_unknownDisposition_defaultsToInline() throws Exception {
        when(presignedGetObjectRequest.url()).thenReturn(new URL("https://pub-r2.dev/signed-url"));
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedGetObjectRequest);

        storageService.generatePresignedDownloadUrl("files/doc.txt", "doc.txt", null);

        ArgumentCaptor<GetObjectPresignRequest> captor = ArgumentCaptor.forClass(GetObjectPresignRequest.class);
        verify(s3Presigner).presignGetObject(captor.capture());

        assertThat(captor.getValue().getObjectRequest().responseContentDisposition()).isEqualTo("inline; filename=\"doc.txt\"");
    }

    @Test
    @DisplayName("generatePresignedDownloadUrl wraps exceptions in FileStorageException")
    void generatePresignedDownloadUrl_presignerError_throwsFileStorageException() {
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenThrow(new RuntimeException("Presigning failed"));

        assertThatThrownBy(() -> storageService.generatePresignedDownloadUrl("key", "file.pdf", "inline"))
                .isInstanceOf(FileStorageException.class)
                .hasMessageContaining("Failed generating presigned download URL");
    }

    @Test
    @DisplayName("uploadFile uploads successfully and returns formatted public URL")
    void uploadFile_success_returnsPublicUrl() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "content".getBytes());

        String url = storageService.uploadFile(file, "avatars/user-1.png", "image/png");

        assertThat(url).isEqualTo("https://pub-r2.dev/avatars/user-1.png");

        ArgumentCaptor<PutObjectRequest> putCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(putCaptor.capture(), any(RequestBody.class));
        assertThat(putCaptor.getValue().bucket()).isEqualTo("studycollab-bucket");
        assertThat(putCaptor.getValue().key()).isEqualTo("avatars/user-1.png");
        assertThat(putCaptor.getValue().contentType()).isEqualTo("image/png");
    }

    @Test
    @DisplayName("deleteFile sends delete request to S3Client with bucket and key")
    void deleteFile_success_deletesObject() {
        storageService.deleteFile("avatars/user-1.png");

        ArgumentCaptor<DeleteObjectRequest> deleteCaptor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(deleteCaptor.capture());
        assertThat(deleteCaptor.getValue().bucket()).isEqualTo("studycollab-bucket");
        assertThat(deleteCaptor.getValue().key()).isEqualTo("avatars/user-1.png");
    }
}
