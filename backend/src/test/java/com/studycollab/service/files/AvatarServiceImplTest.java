package com.studycollab.service.files;

import com.studycollab.dto.files.AvatarUploadResponse;
import com.studycollab.exception.InvalidFileException;
import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvatarServiceImplTest {

    // Standard magic byte sequences for images
    private static final byte[] JPEG_BYTES = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00
    };

    private static final byte[] PNG_BYTES = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
    };

    private static final byte[] WEBP_BYTES = new byte[]{
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
    };

    private StorageService storageService;
    private UserRepository userRepository;
    private AvatarServiceImpl avatarService;

    private AtomicBoolean storageUploadCalled;
    private User testUser;

    @BeforeEach
    void setUp() {
        storageUploadCalled = new AtomicBoolean(false);
        testUser = new User();
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setEmail("user@example.com");

        storageService = (StorageService) Proxy.newProxyInstance(
                StorageService.class.getClassLoader(),
                new Class<?>[]{StorageService.class},
                (proxy, method, args) -> {
                    if ("uploadFile".equals(method.getName())) {
                        storageUploadCalled.set(true);
                        String objectKey = (String) args[1];
                        return "https://cdn.example.com/" + objectKey;
                    }
                    return null;
                }
        );

        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findById".equals(methodName)) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(1L).equals(id)) {
                            return Optional.of(testUser);
                        }
                        return Optional.empty();
                    } else if ("save".equals(methodName)) {
                        return args[0];
                    }
                    return null;
                }
        );

        avatarService = new AvatarServiceImpl(storageService, userRepository);
    }

    @Nested
    @DisplayName("validateImageFile Tests")
    class ValidateImageFileTests {

        @Test
        @DisplayName("Null file throws InvalidFileException")
        void nullFile_throwsInvalidFileException() {
            assertThatThrownBy(() -> avatarService.validateImageFile(null))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("cannot be empty");
        }

        @Test
        @DisplayName("Empty file throws InvalidFileException")
        void emptyFile_throwsInvalidFileException() {
            MultipartFile emptyFile = new MockMultipartFile(
                    "file", "empty.jpg", "image/jpeg", new byte[0]
            );

            assertThatThrownBy(() -> avatarService.validateImageFile(emptyFile))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("cannot be empty");
        }

        @Test
        @DisplayName("Spoofed Content-Type (executable bytes declared as image/jpeg) throws InvalidFileException")
        void spoofedExecutable_declaredAsImageJpeg_throwsInvalidFileException() {
            byte[] exeBytes = "MZ\u0090\u0000\u0003\u0000\u0000\u0000This is a DOS executable".getBytes(StandardCharsets.ISO_8859_1);
            MultipartFile spoofedFile = new MockMultipartFile(
                    "file", "innocent.jpg", "image/jpeg", exeBytes
            );

            assertThatThrownBy(() -> avatarService.validateImageFile(spoofedFile))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("Only image files (JPG, PNG, WEBP) are allowed");
        }

        @Test
        @DisplayName("Spoofed Content-Type (plain text declared as image/png) throws InvalidFileException")
        void spoofedPlainText_declaredAsImagePng_throwsInvalidFileException() {
            byte[] textBytes = "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8);
            MultipartFile spoofedFile = new MockMultipartFile(
                    "file", "picture.png", "image/png", textBytes
            );

            assertThatThrownBy(() -> avatarService.validateImageFile(spoofedFile))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("Only image files (JPG, PNG, WEBP) are allowed");
        }

        @Test
        @DisplayName("Valid JPEG bytes with mismatched/generic Content-Type is accepted")
        void validJpegBytes_withMismatchedContentType_isAccepted() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "photo.bin", "application/octet-stream", JPEG_BYTES
            );

            String detected = avatarService.validateImageFile(validFile);
            assertThat(detected).isEqualTo("image/jpeg");
        }

        @Test
        @DisplayName("Valid PNG bytes with declared image/png is accepted")
        void validPngBytes_isAccepted() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "avatar.png", "image/png", PNG_BYTES
            );

            String detected = avatarService.validateImageFile(validFile);
            assertThat(detected).isEqualTo("image/png");
        }

        @Test
        @DisplayName("Valid WEBP bytes with declared image/webp is accepted")
        void validWebpBytes_isAccepted() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "graphic.webp", "image/webp", WEBP_BYTES
            );

            String detected = avatarService.validateImageFile(validFile);
            assertThat(detected).isEqualTo("image/webp");
        }
    }

    @Nested
    @DisplayName("processAndSaveAvatar Tests")
    class ProcessAndSaveAvatarTests {

        @Test
        @DisplayName("Spoofed file is rejected and storage service is never invoked")
        void spoofedFile_rejectedWithoutStorageUpload() {
            byte[] textBytes = "Hello this is a plain text file pretending to be image".getBytes(StandardCharsets.UTF_8);
            MultipartFile spoofedFile = new MockMultipartFile(
                    "file", "photo.jpg", "image/jpeg", textBytes
            );

            assertThatThrownBy(() -> avatarService.processAndSaveAvatar(spoofedFile, 1L))
                    .isInstanceOf(InvalidFileException.class);

            assertThat(storageUploadCalled.get()).isFalse();
            assertThat(testUser.getAvatarUrl()).isNull();
        }

        @Test
        @DisplayName("Valid image uploads successfully and updates user avatar URL")
        void validImage_uploadsSuccessfullyAndUpdatesUser() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "avatar.jpg", "image/jpeg", JPEG_BYTES
            );

            AvatarUploadResponse response = avatarService.processAndSaveAvatar(validFile, 1L);

            assertThat(response).isNotNull();
            assertThat(response.avatarUrl()).contains("https://cdn.example.com/avatars/user_1");
            assertThat(storageUploadCalled.get()).isTrue();
            assertThat(testUser.getAvatarUrl()).contains("https://cdn.example.com/avatars/user_1");
        }
    }
}
