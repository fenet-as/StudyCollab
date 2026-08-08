package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class InvalidRequestException extends BaseBusinessException {

    public InvalidRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}