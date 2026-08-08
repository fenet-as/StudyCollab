package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class CustomExceptions {

    public static class ResourceNotFoundException extends BaseBusinessException {
        public ResourceNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class UnauthorizedException extends BaseBusinessException {
        public UnauthorizedException(String message) {
            super(message, HttpStatus.UNAUTHORIZED);
        }
    }

    public static class UnauthorizedAccessException extends BaseBusinessException {
        public UnauthorizedAccessException(String message, HttpStatus status) {
            super(message, HttpStatus.FORBIDDEN);
        }
    }

    public static class BadRequestException extends BaseBusinessException {
        public BadRequestException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }
}