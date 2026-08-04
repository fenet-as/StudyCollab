package com.studycollab.dto.group;

public class GroupAvatarResponseDto {
    private Long groupId;
    private String avatarUrl;

    public GroupAvatarResponseDto(Long groupId, String avatarUrl) {
        this.groupId = groupId;
        this.avatarUrl = avatarUrl;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }
}