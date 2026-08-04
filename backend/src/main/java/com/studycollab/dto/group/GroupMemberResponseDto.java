package com.studycollab.dto.group;

import com.studycollab.model.GroupRole;
import java.time.LocalDateTime;

public class GroupMemberResponseDto {
    private Long id;
    private String fullName;
    private String email;
    private GroupRole role;
    private LocalDateTime joinedAt;
    private String avatarUrl;

    public GroupMemberResponseDto(Long id, String fullName, String email, GroupRole role, String avatarUrl, LocalDateTime joinedAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.joinedAt = joinedAt;
        this.avatarUrl = avatarUrl;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public GroupRole getRole() { return role; }
    public void setRole(GroupRole role) { this.role = role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }


    public String getAvatarUrl() { return avatarUrl; }
}