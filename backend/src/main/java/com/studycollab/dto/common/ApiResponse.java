package com.studycollab.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
// Configures Jackson to omit null fields when serializing this record into JSON.
public record ApiResponse(
        boolean success,
        // Indicates whether the requested operation completed successfully.
        String message
        // Provides a human-readable message describing the operation's status or outcome.
) {
    public static ApiResponse success(String message) {
        // Static factory method to quickly instantiate a successful response object.
        return new ApiResponse(true, message);
    }
}