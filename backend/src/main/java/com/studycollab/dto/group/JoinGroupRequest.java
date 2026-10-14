package com.studycollab.dto.group;

import jakarta.validation.constraints.NotBlank;

public class JoinGroupRequest {
    @NotBlank(message = "Invite code is required")
    private String inviteCode;

    public JoinGroupRequest() {}

    public JoinGroupRequest(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }
}