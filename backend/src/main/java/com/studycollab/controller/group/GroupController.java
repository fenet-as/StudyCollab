package com.studycollab.controller.group;


import java.security.Principal;

import com.studycollab.dto.group.*;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.GroupMember;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.service.group.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<GroupResponseDto> createGroup(
            @RequestPart("groupData") GroupCreateDto groupData,
            @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile,
            @AuthenticationPrincipal User currentUser) {

        StudyGroup dynamicGroup = groupService.createGroup(groupData, avatarFile, currentUser);

        // Convert to DTO before returning
        return ResponseEntity.ok(groupService.convertToDto(dynamicGroup));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<List<GroupResponseDto>> getCurrentUserGroups(
            @AuthenticationPrincipal User currentUser) {

        List<GroupResponseDto> groups = groupService.getUserGroups(currentUser.getId());
        return ResponseEntity.ok(groups);
    }




    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(
            @PathVariable("id") Long groupId,
            Principal principal) { // Use Principal principal consistently across endpoints
        try {
            // Extract email of current logged-in user safely
            String currentUserEmail = principal.getName();

            // Process deletion
            groupService.deleteGroup(groupId, currentUserEmail);

            // Return 204 No Content on successful deletion
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
            @RequestBody GroupUpdateRequest request,
            Principal principal) { // 1. Inject the Principal object here
        try {
            // 2. Extract the email from principal and pass it as the third argument
            String currentUserEmail = principal.getName();

            GroupResponseDto updatedGroup = groupService.updateGroupDetails(groupId, request, currentUserEmail);
            return ResponseEntity.ok(updatedGroup);
        } catch (CustomExceptions.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // 2. Invite Member (Creator/Admin)

    @PostMapping("/{groupId}/members")
    public ResponseEntity<?> addMemberByEmail(
            @PathVariable Long groupId,
            @RequestBody AddMemberRequest request,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();

            // The service now takes care of adding the member and returning the full GroupResponseDto!
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

    // 3. Promote Member (Creator/Admin)
    @PutMapping("/{groupId}/members/{memberUserId}/promote")
    public ResponseEntity<?> promoteMemberToAdmin(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();

            // The service now returns the updated GroupResponseDto!
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

        // Retrieve the authenticated user's email
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






    // -------------------------------------------------------------------------
    // INVITE CODE & JOINING ENDPOINTS
    // -------------------------------------------------------------------------

    /**
     * Join a group using an invite code or full invite URL string.
     */


    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(
            @RequestBody JoinGroupRequest request,
            Principal principal) {
        try {
            String currentUserEmail = principal.getName();

            // Pass 'request' (JoinGroupRequest object) directly to the service:
            GroupResponseDto joinedGroup = groupService.joinGroupByInviteCode(request, currentUserEmail);

            return ResponseEntity.ok(joinedGroup);
        } catch (CustomExceptions.BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (CustomExceptions.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Regenerate an invite code for a group (Admins/Creators only).
     */
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





}




