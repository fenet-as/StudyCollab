package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class InvalidTokenException extends BaseBusinessException {

    public InvalidTokenException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }

    public InvalidTokenException(String message, HttpStatus status) {
        super(message, status);
    }
}