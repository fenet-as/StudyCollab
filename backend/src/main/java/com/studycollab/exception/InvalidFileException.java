package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class InvalidFileException extends BaseBusinessException {
    public InvalidFileException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}