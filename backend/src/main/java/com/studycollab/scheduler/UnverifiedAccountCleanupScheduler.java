package com.studycollab.scheduler;

import com.studycollab.model.User;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Scheduled job to purge unverified accounts older than 30 days.
 * Before user records are deleted from the database, any associated avatar
 * objects in remote storage (Cloudflare R2) are deleted to prevent orphaned storage bloat.
 *
 * <p><strong>Retry Tracking Note:</strong>
 * Storage deletion failures are logged with full diagnostic details (userId, key, exception)
 * without halting the deletion of remaining accounts. In the current implementation, failed
 * storage deletions are not written to an asynchronous retry dead-letter queue or persistent retry table.
 * Future enhancement: a dedicated 'orphaned_storage_cleanup' retry table or scheduled storage-bucket
 * reconciliation task can be introduced to automatically retry failed storage purges.
 */
@Component
public class UnverifiedAccountCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(UnverifiedAccountCleanupScheduler.class);

    private static final Pattern SAFE_AVATAR_KEY_PATTERN = Pattern.compile("^avatars/user_\\d+(\\.[a-zA-Z0-9]+)?$");

    private final UserRepository userRepository;
    private final StorageService storageService;

    public UnverifiedAccountCleanupScheduler(UserRepository userRepository, StorageService storageService) {
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    // Runs daily at midnight
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanupUnverifiedAccounts() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        cleanupUnverifiedAccounts(cutoffDate);
    }

    /**
     * Overloaded cleanup method allowing deterministic testing with explicit cutoff timestamps.
     *
     * @param cutoffDate Unverified accounts created before this date will be deleted
     * @return Number of database user records deleted
     */
    @Transactional
    public long cleanupUnverifiedAccounts(LocalDateTime cutoffDate) {
        List<User> usersWithAvatars = userRepository.findByEnabledFalseAndCreatedAtBeforeAndAvatarUrlIsNotNull(cutoffDate);

        int avatarsAttempted = 0;
        int avatarsDeleted = 0;
        int avatarsFailed = 0;

        for (User user : usersWithAvatars) {
            String objectKey = extractAvatarObjectKey(user);
            if (objectKey == null) {
                log.warn("Skipping storage deletion for user {}: avatar URL '{}' is invalid or outside the avatar storage namespace",
                        user.getId(), user.getAvatarUrl());
                continue;
            }

            avatarsAttempted++;
            try {
                storageService.deleteFile(objectKey);
                avatarsDeleted++;
                log.info("Deleted orphaned avatar from storage for unverified user {}: key={}", user.getId(), objectKey);
            } catch (Exception e) {
                avatarsFailed++;
                log.error("Failed to delete avatar from storage for unverified user {}: key={}. Error: {}",
                        user.getId(), objectKey, e.getMessage(), e);
            }
        }

        long deletedUsersCount = userRepository.deleteByEnabledFalseAndCreatedAtBefore(cutoffDate);
        log.info("Account cleanup complete for cutoff {}: {} database records deleted, {}/{} avatar objects deleted ({} failed)",
                cutoffDate, deletedUsersCount, avatarsDeleted, avatarsAttempted, avatarsFailed);

        return deletedUsersCount;
    }

    /**
     * Resolves and validates the storage object key for a user's avatar.
     * Ensures the key safely resides within the "avatars/user_{userId}" namespace
     * and rejects malformed, out-of-namespace, or path-traversal inputs.
     *
     * @param user The user whose avatar object key to extract
     * @return A validated relative object key (e.g. "avatars/user_123"), or null if invalid
     */
    String extractAvatarObjectKey(User user) {
        if (user == null || user.getId() == null) {
            return null;
        }

        String avatarUrl = user.getAvatarUrl();
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return null;
        }

        // 1. Strip query string (e.g. ?v=1712345678, ?t=...) and fragment
        String cleanPath = avatarUrl.trim();
        int queryIdx = cleanPath.indexOf('?');
        if (queryIdx != -1) {
            cleanPath = cleanPath.substring(0, queryIdx);
        }
        int fragIdx = cleanPath.indexOf('#');
        if (fragIdx != -1) {
            cleanPath = cleanPath.substring(0, fragIdx);
        }

        // 2. Reject path traversal attempts
        if (cleanPath.contains("..")) {
            return null;
        }

        // 3. Locate the avatar namespace prefix "avatars/"
        int avatarPrefixIdx = cleanPath.indexOf("avatars/");
        String candidateKey;
        if (avatarPrefixIdx != -1) {
            candidateKey = cleanPath.substring(avatarPrefixIdx);
        } else if (cleanPath.startsWith("user_")) {
            candidateKey = "avatars/" + cleanPath;
        } else {
            return null;
        }

        while (candidateKey.startsWith("/")) {
            candidateKey = candidateKey.substring(1);
        }

        // 4. Strict validation against expected namespace pattern:
        // Must match "avatars/user_{userId}" with optional valid file extension
        String expectedPrefix = "avatars/user_" + user.getId();
        if (!candidateKey.equals(expectedPrefix) && !candidateKey.startsWith(expectedPrefix + ".")) {
            return null;
        }

        if (!SAFE_AVATAR_KEY_PATTERN.matcher(candidateKey).matches()) {
            return null;
        }

        return candidateKey;
    }
}