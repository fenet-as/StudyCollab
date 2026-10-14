package com.studycollab.controller.group;

import java.security.Principal;
import java.util.List;

import com.studycollab.dto.group.*;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.StudyGroup;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.group.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<?> deleteGroup(
            @PathVariable("id") Long groupId,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            groupService.deleteGroup(groupId, currentUserEmail);
            return ResponseEntity.noContent().build();
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{groupId}/details")
    public ResponseEntity<?> updateGroupDetails(
            @PathVariable Long groupId,
            @Valid @RequestBody GroupUpdateRequest request,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            GroupResponseDto updatedGroup = groupService.updateGroupDetails(groupId, request, currentUserEmail);
            return ResponseEntity.ok(updatedGroup);
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<?> addMemberByEmail(
            @PathVariable Long groupId,
            @Valid @RequestBody AddMemberRequest request,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            GroupResponseDto updatedGroup = groupService.addMemberByEmail(groupId, request, currentUserEmail);
            return ResponseEntity.ok(updatedGroup);
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{groupId}/members/{memberUserId}/promote")
    public ResponseEntity<?> promoteMemberToAdmin(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            GroupResponseDto updatedGroup = groupService.promoteMemberToAdmin(groupId, memberUserId, currentUserEmail);
            return ResponseEntity.ok(updatedGroup);
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{groupId}/members/{memberUserId}")
    public ResponseEntity<?> removeGroupMember(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            GroupResponseDto updatedGroup = groupService.removeMember(groupId, memberUserId, currentUserEmail);
            return ResponseEntity.ok(updatedGroup);
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{groupId}/members/{memberUserId}/demote")
    public ResponseEntity<GroupResponseDto> demoteAdminToMember(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId,
            Principal principal) {

        String currentUserEmail = principal.getName();
        GroupResponseDto updatedGroup = groupService.demoteAdminToMember(groupId, memberUserId, currentUserEmail);
        return ResponseEntity.ok(updatedGroup);
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @PathVariable Long groupId,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            groupService.leaveGroup(groupId, currentUserEmail);
            return ResponseEntity.ok().body("{\"message\": \"Successfully left the study group.\"}");
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(
            @Valid @RequestBody JoinGroupRequest request,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            GroupResponseDto joinedGroup = groupService.joinGroupByInviteCode(request, currentUserEmail);
            return ResponseEntity.ok(joinedGroup);
        } catch (CustomExceptions.BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/{groupId}/invite-code/regenerate")
    public ResponseEntity<?> regenerateInviteCode(
            @PathVariable Long groupId,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            InviteLinkResponseDto response = groupService.regenerateInviteCode(groupId, currentUserEmail);
            return ResponseEntity.ok(response);
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/permissions")
    public ResponseEntity<?> getUserGroupPermissions(
            @PathVariable Long groupId,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();
            GroupPermissionResponseDto permissions = groupService.getUserGroupPermissions(groupId, currentUserEmail);
            return ResponseEntity.ok(permissions);
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberSummaryDto>> getGroupMembers(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<GroupMemberSummaryDto> members = groupService.getGroupMembersSummary(groupId, userDetails.getUser());
        return ResponseEntity.ok(members);
    }
}