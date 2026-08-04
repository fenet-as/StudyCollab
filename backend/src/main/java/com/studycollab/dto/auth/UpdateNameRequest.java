package com.studycollab.dto.auth;

public class UpdateNameRequest {
    private String fullName;

    // Constructors
    public UpdateNameRequest() {}

    public UpdateNameRequest(String fullName) {
        this.fullName = fullName;
    }

    // Getter and Setter
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}