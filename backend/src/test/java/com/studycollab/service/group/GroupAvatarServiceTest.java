package com.studycollab.service.group;

import com.studycollab.exception.CustomExceptions;
import com.studycollab.exception.InvalidFileException;
import com.studycollab.model.StudyGroup;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GroupAvatarServiceTest {

    private static final byte[] JPEG_BYTES = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00
    };

    private static final byte[] PNG_BYTES = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
    };

    private StorageService storageService;
    private GroupRepository groupRepository;
    private GroupAvatarService groupAvatarService;

    private AtomicBoolean storageUploadCalled;
    private AtomicReference<String> uploadedKey;
    private AtomicReference<String> deletedKey;
    private StudyGroup testGroup;

    @BeforeEach
    void setUp() {
        storageUploadCalled = new AtomicBoolean(false);
        uploadedKey = new AtomicReference<>(null);
        deletedKey = new AtomicReference<>(null);

        testGroup = new StudyGroup();
        testGroup.setId(10L);
        testGroup.setName("Test Study Group");

        storageService = (StorageService) Proxy.newProxyInstance(
                StorageService.class.getClassLoader(),
                new Class<?>[]{StorageService.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("uploadFile".equals(methodName)) {
                        storageUploadCalled.set(true);
                        String key = (String) args[1];
                        uploadedKey.set(key);
                        return "https://cdn.example.com/" + key;
                    } else if ("deleteFile".equals(methodName)) {
                        String key = (String) args[0];
                        deletedKey.set(key);
                        return null;
                    }
                    return null;
                }
        );

        groupRepository = (GroupRepository) Proxy.newProxyInstance(
                GroupRepository.class.getClassLoader(),
                new Class<?>[]{GroupRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("findById".equals(methodName)) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(10L).equals(id)) {
                            return Optional.of(testGroup);
                        }
                        return Optional.empty();
                    } else if ("save".equals(methodName)) {
                        return args[0];
                    }
                    return null;
                }
        );

        groupAvatarService = new GroupAvatarService(storageService, groupRepository);
    }

    @Nested
    @DisplayName("validateImageFile Tests")
    class ValidateImageFileTests {

        @Test
        @DisplayName("Null file throws InvalidFileException")
        void nullFile_throwsInvalidFileException() {
            assertThatThrownBy(() -> groupAvatarService.validateImageFile(null))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("cannot be empty");
        }

        @Test
        @DisplayName("Empty file throws InvalidFileException")
        void emptyFile_throwsInvalidFileException() {
            MultipartFile emptyFile = new MockMultipartFile(
                    "file", "empty.jpg", "image/jpeg", new byte[0]
            );

            assertThatThrownBy(() -> groupAvatarService.validateImageFile(emptyFile))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("cannot be empty");
        }

        @Test
        @DisplayName("Spoofed Content-Type (executable declared as image/jpeg) throws InvalidFileException")
        void spoofedExecutable_throwsInvalidFileException() {
            byte[] exeBytes = "MZ\u0090\u0000\u0003\u0000\u0000\u0000DOS executable bytes".getBytes(StandardCharsets.ISO_8859_1);
            MultipartFile spoofedFile = new MockMultipartFile(
                    "file", "group-avatar.jpg", "image/jpeg", exeBytes
            );

            assertThatThrownBy(() -> groupAvatarService.validateImageFile(spoofedFile))
                    .isInstanceOf(InvalidFileException.class)
                    .hasMessageContaining("Only JPEG, PNG, and WEBP formats are allowed");
        }

        @Test
        @DisplayName("Valid JPEG bytes with mismatched Content-Type is accepted")
        void validJpegBytes_withMismatchedContentType_isAccepted() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "photo.bin", "application/octet-stream", JPEG_BYTES
            );

            String detected = groupAvatarService.validateImageFile(validFile);
            assertThat(detected).isEqualTo("image/jpeg");
        }

        @Test
        @DisplayName("Valid PNG bytes is accepted")
        void validPngBytes_isAccepted() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "logo.png", "image/png", PNG_BYTES
            );

            String detected = groupAvatarService.validateImageFile(validFile);
            assertThat(detected).isEqualTo("image/png");
        }
    }

    @Nested
    @DisplayName("uploadGroupAvatar Tests")
    class UploadGroupAvatarTests {

        @Test
        @DisplayName("Spoofed file is rejected before StorageService upload is invoked")
        void spoofedFile_rejectedWithoutStorageUpload() {
            byte[] textBytes = "Just some text file pretending to be image".getBytes(StandardCharsets.UTF_8);
            MultipartFile spoofedFile = new MockMultipartFile(
                    "file", "group.jpg", "image/jpeg", textBytes
            );

            assertThatThrownBy(() -> groupAvatarService.uploadGroupAvatar(10L, spoofedFile))
                    .isInstanceOf(InvalidFileException.class);

            assertThat(storageUploadCalled.get()).isFalse();
            assertThat(testGroup.getAvatarUrl()).isNull();
        }

        @Test
        @DisplayName("Valid image uploads successfully via StorageService and updates group avatar URL")
        void validImage_uploadsSuccessfullyAndUpdatesGroup() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "group-avatar.jpg", "image/jpeg", JPEG_BYTES
            );

            String avatarUrl = groupAvatarService.uploadGroupAvatar(10L, validFile);

            assertThat(avatarUrl).isNotNull();
            assertThat(avatarUrl).contains("https://cdn.example.com/group-avatars/group-10.jpg");
            assertThat(storageUploadCalled.get()).isTrue();
            assertThat(uploadedKey.get()).isEqualTo("group-avatars/group-10.jpg");
            assertThat(testGroup.getAvatarUrl()).contains("https://cdn.example.com/group-avatars/group-10.jpg");
        }

        @Test
        @DisplayName("Valid JPEG with spoofed extension (.exe) safely resolves to .jpg key")
        void validJpeg_withExeExtension_resolvesToJpgKey() {
            MultipartFile validFile = new MockMultipartFile(
                    "file", "group-avatar.exe", "image/jpeg", JPEG_BYTES
            );

            String avatarUrl = groupAvatarService.uploadGroupAvatar(10L, validFile);

            assertThat(avatarUrl).isNotNull();
            assertThat(uploadedKey.get()).isEqualTo("group-avatars/group-10.jpg");
        }

        @Test
        @DisplayName("Uploading avatar with new extension deletes old avatar file from StorageService")
        void uploadAvatar_newExtension_deletesOldFile() {
            testGroup.setAvatarUrl("https://cdn.example.com/group-avatars/group-10.jpg?t=12345678");

            MultipartFile pngFile = new MockMultipartFile(
                    "file", "new-avatar.png", "image/png", PNG_BYTES
            );

            groupAvatarService.uploadGroupAvatar(10L, pngFile);

            assertThat(deletedKey.get()).isEqualTo("group-avatars/group-10.jpg");
            assertThat(uploadedKey.get()).isEqualTo("group-avatars/group-10.png");
        }
    }

    @Nested
    @DisplayName("deleteGroupAvatar Tests")
    class DeleteGroupAvatarTests {

        @Test
        @DisplayName("Deletes existing avatar file via StorageService and sets avatarUrl to null")
        void deleteGroupAvatar_existingAvatar_deletesFromStorage() {
            testGroup.setAvatarUrl("https://cdn.example.com/group-avatars/group-10.png?t=999");

            groupAvatarService.deleteGroupAvatar(10L);

            assertThat(deletedKey.get()).isEqualTo("group-avatars/group-10.png");
            assertThat(testGroup.getAvatarUrl()).isNull();
        }

        @Test
        @DisplayName("Does nothing when group has no avatar")
        void deleteGroupAvatar_noAvatar_doesNotCallStorage() {
            testGroup.setAvatarUrl(null);

            groupAvatarService.deleteGroupAvatar(10L);

            assertThat(deletedKey.get()).isNull();
            assertThat(testGroup.getAvatarUrl()).isNull();
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when group does not exist")
        void deleteGroupAvatar_groupNotFound_throwsResourceNotFoundException() {
            assertThatThrownBy(() -> groupAvatarService.deleteGroupAvatar(999L))
                    .isInstanceOf(CustomExceptions.ResourceNotFoundException.class)
                    .hasMessageContaining("Group not found with id: 999");
        }
    }

    @Nested
    @DisplayName("getGroupAvatarUrl Tests")
    class GetGroupAvatarUrlTests {

        @Test
        @DisplayName("Returns avatar URL for existing group")
        void getGroupAvatarUrl_found_returnsUrl() {
            testGroup.setAvatarUrl("https://cdn.example.com/group-avatars/group-10.jpg");

            String url = groupAvatarService.getGroupAvatarUrl(10L);

            assertThat(url).isEqualTo("https://cdn.example.com/group-avatars/group-10.jpg");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when group does not exist")
        void getGroupAvatarUrl_notFound_throwsResourceNotFoundException() {
            assertThatThrownBy(() -> groupAvatarService.getGroupAvatarUrl(999L))
                    .isInstanceOf(CustomExceptions.ResourceNotFoundException.class)
                    .hasMessageContaining("Group not found with id: 999");
        }
    }
}
