package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends BaseBusinessException {
    public EmailAlreadyExistsException(String email) {
        super("Email address already registered: " + email, HttpStatus.CONFLICT);
    }
}