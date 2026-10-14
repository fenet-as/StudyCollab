package com.studycollab.controller.group;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import com.studycollab.dto.group.*;
import com.studycollab.model.StudyGroup;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.group.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<GroupResponseDto> createGroup(
            @Valid @RequestPart("groupData") GroupCreateDto groupData,
            @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        StudyGroup dynamicGroup = groupService.createGroup(groupData, avatarFile, userDetails.getUser());
        return ResponseEntity.ok(groupService.convertToDto(dynamicGroup));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<List<GroupResponseDto>> getCurrentUserGroups(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<GroupResponseDto> groups = groupService.getUserGroups(userDetails.getId());
        return ResponseEntity.ok(groups);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable("id") Long groupId,
            Principal principal) {

        groupService.deleteGroup(groupId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{groupId}/details")
    public ResponseEntity<GroupResponseDto> updateGroupDetails(
            @PathVariable Long groupId,
            @Valid @RequestBody GroupUpdateRequest request,
            Principal principal) {

        GroupResponseDto updatedGroup = groupService.updateGroupDetails(groupId, request, principal.getName());
        return ResponseEntity.ok(updatedGroup);
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<GroupResponseDto> addMemberByEmail(
            @PathVariable Long groupId,
            @Valid @RequestBody AddMemberRequest request,
            Principal principal) {

        GroupResponseDto updatedGroup = groupService.addMemberByEmail(groupId, request, principal.getName());
        return ResponseEntity.ok(updatedGroup);
    }

    @PutMapping("/{groupId}/members/{memberUserId}/promote")
    public ResponseEntity<GroupResponseDto> promoteMemberToAdmin(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId,
            Principal principal) {

        GroupResponseDto updatedGroup = groupService.promoteMemberToAdmin(groupId, memberUserId, principal.getName());
        return ResponseEntity.ok(updatedGroup);
    }

    @DeleteMapping("/{groupId}/members/{memberUserId}")
    public ResponseEntity<GroupResponseDto> removeGroupMember(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId,
            Principal principal) {

        GroupResponseDto updatedGroup = groupService.removeMember(groupId, memberUserId, principal.getName());
        return ResponseEntity.ok(updatedGroup);
    }

    @PutMapping("/{groupId}/members/{memberUserId}/demote")
    public ResponseEntity<GroupResponseDto> demoteAdminToMember(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId,
            Principal principal) {

        GroupResponseDto updatedGroup = groupService.demoteAdminToMember(groupId, memberUserId, principal.getName());
        return ResponseEntity.ok(updatedGroup);
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Map<String, String>> leaveGroup(
            @PathVariable Long groupId,
            Principal principal) {

        groupService.leaveGroup(groupId, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Successfully left the study group."));
    }

    @PostMapping("/join")
    public ResponseEntity<GroupResponseDto> joinGroup(
            @Valid @RequestBody JoinGroupRequest request,
            Principal principal) {

        GroupResponseDto joinedGroup = groupService.joinGroupByInviteCode(request, principal.getName());
        return ResponseEntity.ok(joinedGroup);
    }

    @PostMapping("/{groupId}/invite-code/regenerate")
    public ResponseEntity<InviteLinkResponseDto> regenerateInviteCode(
            @PathVariable Long groupId,
            Principal principal) {

        InviteLinkResponseDto response = groupService.regenerateInviteCode(groupId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}/permissions")
    public ResponseEntity<GroupPermissionResponseDto> getUserGroupPermissions(
            @PathVariable Long groupId,
            Principal principal) {

        GroupPermissionResponseDto permissions = groupService.getUserGroupPermissions(groupId, principal.getName());
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberSummaryDto>> getGroupMembers(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<GroupMemberSummaryDto> members = groupService.getGroupMembersSummary(groupId, userDetails.getUser());
        return ResponseEntity.ok(members);
    }
}