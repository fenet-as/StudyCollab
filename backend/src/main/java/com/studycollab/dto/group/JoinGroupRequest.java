package com.studycollab.dto.group;

public class JoinGroupRequest {
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