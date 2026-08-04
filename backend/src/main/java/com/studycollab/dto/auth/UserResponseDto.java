package com.studycollab.dto.auth;

import com.studycollab.model.User;

public class UserResponseDto {
    private Long id;
    private String fullName;
    private String email;
    private String avatarUrl;

    public UserResponseDto(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.avatarUrl = user.getAvatarUrl();
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getAvatarUrl() { return avatarUrl; }
}