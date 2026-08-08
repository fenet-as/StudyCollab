package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class InvalidPasswordException extends BaseBusinessException {
    public InvalidPasswordException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}