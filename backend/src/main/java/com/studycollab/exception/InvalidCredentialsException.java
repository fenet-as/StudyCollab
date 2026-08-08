package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends BaseBusinessException {
    public InvalidCredentialsException() {
        super("Invalid email or password", HttpStatus.UNAUTHORIZED);
    }
}