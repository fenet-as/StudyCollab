package com.studycollab.dto.auth;

public class AuthResponse {
    private Long id;              // <-- ADDED THIS FIELD
    private String token;
    private String tokenType = "Bearer";
    private String email;

    // Updated Constructor
    public AuthResponse(Long id, String token, String email) {
        this.id = id;             // <-- ASSIGN IT HERE
        this.token = token;
        this.email = email;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}