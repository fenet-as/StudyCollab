package com.studycollab.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Generic infrastructure abstraction for file storage operations.
 */
public interface StorageService {

    /**
     * Uploads a file stream to a remote storage provider.
     *
     * @param file        The multipart file stream payload.
     * @param objectKey   Target remote object key/path (e.g., "avatars/user_1.jpg").
     * @param contentType MIME type of the upload (e.g., "image/jpeg").
     * @return Public URL where the file can be accessed.
     */
    String uploadFile(MultipartFile file, String objectKey, String contentType);

    /**
     * Deletes an object from remote storage.
     *
     * @param objectKey Target remote object key/path.
     */
    void deleteFile(String objectKey);

    /**
     * Generates a temporary, secure presigned download URL for a stored object.
     *
     * @param objectKey   Target remote object key/path.
     * @param fileName    Original name of the file to attach in content disposition.
     * @param disposition Disposition type ("inline" or "attachment").
     * @return Pre-signed URL string.
     */
    String generatePresignedDownloadUrl(String objectKey, String fileName, String disposition);
}