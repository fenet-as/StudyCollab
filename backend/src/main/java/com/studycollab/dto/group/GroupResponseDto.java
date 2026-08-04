package com.studycollab.dto.group;

import java.time.LocalDateTime;
import java.util.List;

public class GroupResponseDto {
    private Long id;
    private String name;
    private String description;
    private String avatarUrl;
    private String inviteCode;
    private LocalDateTime createdAt;
    private List<GroupMemberResponseDto> members;

    public GroupResponseDto(Long id, String name, String description, String avatarUrl,
                            String inviteCode, LocalDateTime createdAt, List<GroupMemberResponseDto> members) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.avatarUrl = avatarUrl;
        this.inviteCode = inviteCode;
        this.createdAt = createdAt;
        this.members = members;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<GroupMemberResponseDto> getMembers() { return members; }
    public void setMembers(List<GroupMemberResponseDto> members) { this.members = members; }
}