package com.studycollab.dto.group;

public class InviteLinkResponseDto {
    private String inviteCode;

    public InviteLinkResponseDto() {}

    public InviteLinkResponseDto(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }
}