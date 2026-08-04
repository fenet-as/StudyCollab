// com/studycollab/dto/group/GroupPermissionResponseDto.java
package com.studycollab.dto.group;

import com.studycollab.model.GroupRole;

public class GroupPermissionResponseDto {
    private GroupRole role;
    private boolean isAdmin;
    private boolean isCreator;
    private boolean isOwnerOrAdmin;

    public GroupPermissionResponseDto() {}

    public GroupPermissionResponseDto(GroupRole role, boolean isAdmin, boolean isCreator, boolean isOwnerOrAdmin) {
        this.role = role;
        this.isAdmin = isAdmin;
        this.isCreator = isCreator;
        this.isOwnerOrAdmin = isOwnerOrAdmin;
    }

    public GroupRole getRole() { return role; }
    public void setRole(GroupRole role) { this.role = role; }

    public boolean isAdmin() { return isAdmin; }
    public void setAdmin(boolean admin) { isAdmin = admin; }

    public boolean isCreator() { return isCreator; }
    public void setCreator(boolean creator) { isCreator = creator; }

    public boolean isOwnerOrAdmin() { return isOwnerOrAdmin; }
    public void setOwnerOrAdmin(boolean ownerOrAdmin) { isOwnerOrAdmin = ownerOrAdmin; }
}