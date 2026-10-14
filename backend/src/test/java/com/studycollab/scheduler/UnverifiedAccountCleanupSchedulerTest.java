package com.studycollab.scheduler;

import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class UnverifiedAccountCleanupSchedulerTest {

    private UserRepository userRepository;
    private StorageService storageService;
    private UnverifiedAccountCleanupScheduler scheduler;

    private List<User> mockUsersWithAvatars;
    private List<String> deletedStorageKeys;
    private Set<String> keysToFail;
    private LocalDateTime capturedCutoff;
    private long mockDeletedCount;

    @BeforeEach
    void setUp() {
        mockUsersWithAvatars = new ArrayList<>();
        deletedStorageKeys = new ArrayList<>();
        keysToFail = new HashSet<>();
        capturedCutoff = null;
        mockDeletedCount = 5L;

        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findByEnabledFalseAndCreatedAtBeforeAndAvatarUrlIsNotNull".equals(name)) {
                        capturedCutoff = (LocalDateTime) args[0];
                        return mockUsersWithAvatars;
                    } else if ("deleteByEnabledFalseAndCreatedAtBefore".equals(name)) {
                        capturedCutoff = (LocalDateTime) args[0];
                        return mockDeletedCount;
                    }
                    return null;
                }
        );

        storageService = (StorageService) Proxy.newProxyInstance(
                StorageService.class.getClassLoader(),
                new Class<?>[]{StorageService.class},
                (proxy, method, args) -> {
                    if ("deleteFile".equals(method.getName())) {
                        String key = (String) args[0];
                        deletedStorageKeys.add(key);
                        if (keysToFail.contains(key)) {
                            throw new RuntimeException("Simulated Cloudflare R2 delete error for " + key);
                        }
                        return null;
                    }
                    return null;
                }
        );

        scheduler = new UnverifiedAccountCleanupScheduler(userRepository, storageService);
    }

    private User createUser(Long id, String email, String avatarUrl) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setEmail(email);
        user.setAvatarUrl(avatarUrl);
        return user;
    }

    @Nested
    @DisplayName("cleanupUnverifiedAccounts Tests")
    class CleanupTests {

        @Test
        @DisplayName("Deletes avatar objects from storage for all eligible users before database purge")
        void cleanup_withUsersHavingAvatars_deletesFromStorageAndDeletesUsers() {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

            User user1 = createUser(1L, "user1@example.com", "https://pub-r2.dev/avatars/user_1?v=1710000000");
            User user2 = createUser(2L, "user2@example.com", "avatars/user_2.png");
            mockUsersWithAvatars.addAll(List.of(user1, user2));

            long count = scheduler.cleanupUnverifiedAccounts(cutoff);

            assertThat(count).isEqualTo(mockDeletedCount);
            assertThat(deletedStorageKeys).containsExactly("avatars/user_1", "avatars/user_2.png");
            assertThat(capturedCutoff).isEqualTo(cutoff);
        }

        @Test
        @DisplayName("When no users have avatars, storage service is not called and database purge succeeds")
        void cleanup_withNoAvatars_doesNotCallStorage() {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
            mockUsersWithAvatars.clear();

            long count = scheduler.cleanupUnverifiedAccounts(cutoff);

            assertThat(count).isEqualTo(mockDeletedCount);
            assertThat(deletedStorageKeys).isEmpty();
        }

        @Test
        @DisplayName("Storage failure on one avatar is logged and does not prevent subsequent avatar or DB deletion")
        void cleanup_withStorageFailure_continuesAndDeletesRemainingAvatarsAndDatabaseUsers() {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

            User user1 = createUser(1L, "user1@example.com", "avatars/user_1");
            User user2 = createUser(2L, "user2@example.com", "avatars/user_2");
            mockUsersWithAvatars.addAll(List.of(user1, user2));

            // user1's storage deletion will fail
            keysToFail.add("avatars/user_1");

            assertThatCode(() -> {
                long count = scheduler.cleanupUnverifiedAccounts(cutoff);
                assertThat(count).isEqualTo(mockDeletedCount);
            }).doesNotThrowAnyException();

            // Both users were attempted
            assertThat(deletedStorageKeys).containsExactly("avatars/user_1", "avatars/user_2");
        }

        @Test
        @DisplayName("No-arg scheduled cleanup delegates with 30-day cutoff")
        void noArgCleanup_runsWithoutExceptions() {
            mockUsersWithAvatars.clear();

            assertThatCode(() -> scheduler.cleanupUnverifiedAccounts()).doesNotThrowAnyException();
            assertThat(capturedCutoff).isNotNull();
            assertThat(capturedCutoff).isBeforeOrEqualTo(LocalDateTime.now().minusDays(29));
        }
    }

    @Nested
    @DisplayName("extractAvatarObjectKey Tests")
    class ExtractKeyTests {

        @Test
        @DisplayName("Valid CDN URL with query parameter resolves to clean object key")
        void validCdnUrl_withQueryParams_resolvesCleanKey() {
            User user = createUser(42L, "test@example.com", "https://pub-r2.dev/avatars/user_42?v=1712345678");

            String key = scheduler.extractAvatarObjectKey(user);
            assertThat(key).isEqualTo("avatars/user_42");
        }

        @Test
        @DisplayName("Valid relative key resolves directly")
        void validRelativeKey_resolvesDirectly() {
            User user = createUser(42L, "test@example.com", "avatars/user_42");

            String key = scheduler.extractAvatarObjectKey(user);
            assertThat(key).isEqualTo("avatars/user_42");
        }

        @Test
        @DisplayName("Valid relative key with valid image extension resolves correctly")
        void validKey_withExtension_resolvesCorrectly() {
            User user = createUser(42L, "test@example.com", "avatars/user_42.png");

            String key = scheduler.extractAvatarObjectKey(user);
            assertThat(key).isEqualTo("avatars/user_42.png");
        }

        @Test
        @DisplayName("Relative key with leading slash resolves without leading slash")
        void validKey_withLeadingSlash_resolvesCleanly() {
            User user = createUser(42L, "test@example.com", "/avatars/user_42.jpg");

            String key = scheduler.extractAvatarObjectKey(user);
            assertThat(key).isEqualTo("avatars/user_42.jpg");
        }

        @Test
        @DisplayName("URL outside the avatar storage namespace returns null and prevents deletion")
        void urlOutsideAvatarNamespace_returnsNull() {
            User user = createUser(42L, "test@example.com", "https://pub-r2.dev/system-files/backup.tar.gz");

            String key = scheduler.extractAvatarObjectKey(user);
            assertThat(key).isNull();
        }

        @Test
        @DisplayName("URL with path traversal returns null and prevents deletion")
        void urlWithPathTraversal_returnsNull() {
            User user = createUser(42L, "test@example.com", "avatars/user_42/../../config.json");

            String key = scheduler.extractAvatarObjectKey(user);
            assertThat(key).isNull();
        }

        @Test
        @DisplayName("URL referencing another user ID returns null to protect foreign avatars")
        void urlForDifferentUser_returnsNull() {
            // User is 42, but avatar URL points to user 99
            User user = createUser(42L, "test@example.com", "https://pub-r2.dev/avatars/user_99");

            String key = scheduler.extractAvatarObjectKey(user);
            assertThat(key).isNull();
        }

        @Test
        @DisplayName("Null or blank avatar URL returns null")
        void nullOrBlankAvatarUrl_returnsNull() {
            User userWithNull = createUser(42L, "test@example.com", null);
            User userWithBlank = createUser(42L, "test@example.com", "   ");

            assertThat(scheduler.extractAvatarObjectKey(userWithNull)).isNull();
            assertThat(scheduler.extractAvatarObjectKey(userWithBlank)).isNull();
            assertThat(scheduler.extractAvatarObjectKey(null)).isNull();
        }
    }
}
