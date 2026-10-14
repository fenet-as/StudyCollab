package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class RefreshTokenExpiredException extends BaseBusinessException {

    public RefreshTokenExpiredException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
