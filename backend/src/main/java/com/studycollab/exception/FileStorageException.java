package com.studycollab.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when cloud storage or file stream operational errors occur.
 */
public class FileStorageException extends BaseBusinessException {

    public FileStorageException(String message) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public FileStorageException(String message, Throwable cause) {
        super(message, cause, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}