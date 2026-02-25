package com.studycollab.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users") // table name in database
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // unique user ID

    @Column(nullable = false, unique = true)
    private String email;  // user's email, must be unique

    @Column(nullable = false, unique = true)
    private String username;  // user's username, must be unique

    @Column(nullable = false)
    private String password;  // hashed password

    private String role = "USER"; // role: USER or ADMIN

    private LocalDateTime createdAt = LocalDateTime.now(); // when user was created

    private LocalDateTime updatedAt; // last updated

    // Constructors
    public User() {}

    public User(String email, String username, String password) {
        this.email = email;
        this.username = username;
        this.password = password;
    }

    // Getters & setters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}