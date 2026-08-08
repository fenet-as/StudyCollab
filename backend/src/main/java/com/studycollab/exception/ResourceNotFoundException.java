package com.studycollab.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BaseBusinessException {
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue), HttpStatus.NOT_FOUND);
    }
}