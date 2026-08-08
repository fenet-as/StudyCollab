// backend/src/main/java/com/studycollab/service/group/GroupService.java
package com.studycollab.service.group;

import com.studycollab.dto.group.*;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.*;
import com.studycollab.repository.auth.UserRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final Path rootLocation = Paths.get("uploads/avatars");

    // Constructor injection for all repositories
    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public StudyGroup createGroup(GroupCreateDto dto, MultipartFile file, User creator) {
        StudyGroup group = new StudyGroup();
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());

        String uniqueCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        group.setInviteCode(uniqueCode);

        if (file != null && !file.isEmpty()) {
            try {
                if (!Files.exists(rootLocation)) {
                    Files.createDirectories(rootLocation);
                }
                String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), this.rootLocation.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                group.setAvatarUrl("/uploads/avatars/" + filename);
            } catch (IOException e) {
                throw new RuntimeException("Could not store avatar image file. Error: " + e.getMessage());
            }
        }

        GroupMember membership = new GroupMember();
        membership.setStudyGroup(group);
        membership.setUser(creator);
        membership.setRole(GroupRole.CREATOR);

        group.getMembers().add(membership);

        return groupRepository.save(group);
    }

    @Transactional(readOnly = true)
    public List<GroupResponseDto> getUserGroups(Long userId) {
        List<StudyGroup> groups = groupRepository.findGroupsByUserId(userId);

        // Map elements to presentation DTO layer cleanly
        return groups.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    // Helper mapper to transform entities into response objects
    public GroupResponseDto convertToDto(StudyGroup group) {
        List<GroupMemberResponseDto> memberDtos = group.getMembers().stream()
                .map(this::convertToMemberDto)
                .collect(Collectors.toList());

        return new GroupResponseDto(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getAvatarUrl(),
                group.getInviteCode(),
                group.getCreatedAt(),
                memberDtos
        );
    }

    // Helper mapper to transform a single membership record into its response object
    public GroupMemberResponseDto convertToMemberDto(GroupMember member) {
        return new GroupMemberResponseDto(
                member.getUser().getId(),
                member.getUser().getFullName(),
                member.getUser().getEmail(),
                member.getRole(),
                member.getUser().getAvatarUrl(),
                member.getJoinedAt()

        );
    }




    @Transactional
    public void deleteGroup(Long groupId, String currentUserEmail) {
        // 1. Find the group
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        // 2. Security Check: Ensure current user is the OWNER/CREATOR of this group
        boolean isOwner = group.getMembers().stream()
                .anyMatch(member -> {
                    if (member.getUser() == null || member.getRole() == null) {
                        return false;
                    }

                    boolean emailMatches = currentUserEmail.equalsIgnoreCase(member.getUser().getEmail());
                    GroupRole role = member.getRole();
                    boolean isCreatorOrOwner = (role == GroupRole.CREATOR) || "OWNER".equalsIgnoreCase(role.name());

                    return emailMatches && isCreatorOrOwner;
                });

        if (!isOwner) {
            throw new CustomExceptions.UnauthorizedException("Only the group owner is authorized to delete this study group.");
        }

        groupRepository.delete(group);
    }
    // ==========================================
    //       GROUP SETTINGS & MEMBERSHIP
    // ==========================================

    // 1. Update Group Details (Creator only)
    @Transactional
    public GroupResponseDto updateGroupDetails(Long groupId, GroupUpdateRequest request, String currentUserEmail) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        // Find current user's membership
        GroupMember callerMembership = groupMemberRepository.findByGroupIdAndUserId(groupId, getUserIdByEmail(currentUserEmail))
                .orElseThrow(() -> new CustomExceptions.UnauthorizedException("You are not a member of this study group."));

        // Only the CREATOR is allowed to edit primary details
        if (callerMembership.getRole() != GroupRole.CREATOR) {
            throw new CustomExceptions.UnauthorizedException("Only the group creator is authorized to edit group details.");
        }

        // Apply changes cleanly
        if (request.getName() != null && !request.getName().isBlank()) {
            group.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription().trim());
        }

        StudyGroup updatedGroup = groupRepository.save(group);
        return convertToDto(updatedGroup);
    }

    // 2. Add Group Member by Email (Creator or Admin)


    // ==========================================================================
    // ADD THIS READ METHOD TO YOUR SERVICE
    // ==========================================================================
    @Transactional(readOnly = true)
    public GroupResponseDto getGroupById(Long groupId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));
        return convertToDto(group);
    }

    // ==========================================================================
    // UPDATE THIS METHOD (Changed return type from GroupMemberResponseDto to GroupResponseDto)
    // ==========================================================================
    @Transactional
    public GroupResponseDto addMemberByEmail(Long groupId, AddMemberRequest request, String currentUserEmail) {
        // Verify caller permissions (Must be Creator or Admin)
        verifyAdminOrCreatorPermission(groupId, currentUserEmail);

        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        String emailToInvite = request.getEmail().trim().toLowerCase();

        // Resolve target user
        User userToInvite = userRepository.findByEmail(emailToInvite)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("No registered classmate found with email: " + emailToInvite));

        // Guard: Verify target is not already a member
        boolean alreadyMember = groupMemberRepository.findByGroupIdAndUserId(groupId, userToInvite.getId()).isPresent();
        if (alreadyMember) {
            throw new CustomExceptions.BadRequestException("This classmate is already a member of this study group.");
        }

        // Create new membership entity with the default MEMBER role
        GroupMember newMember = new GroupMember();
        newMember.setStudyGroup(group);
        newMember.setUser(userToInvite);
        newMember.setRole(GroupRole.MEMBER);

        // Crucial for Hibernate: Link both sides of the relationship so convertToDto reads it instantly!
        group.getMembers().add(newMember);

        // Save the association
        groupMemberRepository.save(newMember);

        // Return the fully updated group representation containing the new member array
        return convertToDto(group);
    }

    // 3. Promote Member to Admin (Creator or Admin)


    // ==========================================================================
    // UPDATE THIS METHOD (Changed return type from GroupMemberResponseDto to GroupResponseDto)
    // ==========================================================================
    @Transactional
    public GroupResponseDto promoteMemberToAdmin(Long groupId, Long memberUserId, String currentUserEmail) {
        // Verify caller permissions (Must be Creator or Admin)
        verifyAdminOrCreatorPermission(groupId, currentUserEmail);

        // Fetch the group so we can convert it to a DTO later
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        // Look up target membership via the GroupMember table cleanly
        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, memberUserId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Membership record not found for this user in the specified group."));

        // Guard: Prevent redundant updates or attempting to change Creator role
        if (targetMember.getRole() == GroupRole.CREATOR || targetMember.getRole() == GroupRole.ADMIN) {
            throw new CustomExceptions.BadRequestException("This classmate is already an administrator or owner.");
        }

        // Apply the promotion and save
        targetMember.setRole(GroupRole.ADMIN);
        groupMemberRepository.save(targetMember);

        // Return the fully updated group representation containing the new roles
        return convertToDto(group);
    }
    // ==========================================
    //       INTERNAL SERVICE HELPERS
    // ==========================================

    private Long getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found with email: " + email))
                .getId();
    }

    private void verifyAdminOrCreatorPermission(Long groupId, String currentUserEmail) {
        GroupMember callerMembership = groupMemberRepository.findByGroupIdAndUserId(groupId, getUserIdByEmail(currentUserEmail))
                .orElseThrow(() -> new CustomExceptions.UnauthorizedException("You are not a member of this study group."));

        GroupRole role = callerMembership.getRole();
        if (role != GroupRole.CREATOR && role != GroupRole.ADMIN) {
            throw new CustomExceptions.UnauthorizedException("You do not have administrative permission to perform this action.");
        }
    }




    // ==========================================================================
    // 4. Remove Member from Group (Creator or Admin only)
    // ==========================================================================
    @Transactional
    public GroupResponseDto removeMember(Long groupId, Long memberUserId, String currentUserEmail) {
        // Verify caller permissions (Must be Creator or Admin to kick someone out)
        verifyAdminOrCreatorPermission(groupId, currentUserEmail);

        // Fetch the group entity
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        // Locate the target member's association row
        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, memberUserId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("The user is not a member of this study group."));

        // Guard: Prevent removing the Creator/Owner
        if (targetMember.getRole() == GroupRole.CREATOR) {
            throw new CustomExceptions.BadRequestException("The group creator cannot be removed from the study group.");
        }

        // Guard: Prevent Admins from removing other Admins (Only Creator can remove an Admin)
        GroupMember callerMembership = groupMemberRepository.findByGroupIdAndUserId(groupId, getUserIdByEmail(currentUserEmail))
                .orElseThrow(() -> new CustomExceptions.UnauthorizedException("You are not a member of this group."));

        if (callerMembership.getRole() == GroupRole.ADMIN && targetMember.getRole() == GroupRole.ADMIN) {
            throw new CustomExceptions.UnauthorizedException("Administrators cannot remove other administrators.");
        }

        // 1. Remove from the local Hibernate list collection so convertToDto reflects it instantly
        group.getMembers().remove(targetMember);

        // 2. Delete the actual row record out of the database mapping table
        groupMemberRepository.delete(targetMember);

        // Return the fresh group representation without the kicked member
        return convertToDto(group);
    }


    // ==========================================================================
    // 5. Demote Admin to Member (Creator or Admin only)
    // ==========================================================================
    @Transactional
    public GroupResponseDto demoteAdminToMember(Long groupId, Long memberUserId, String currentUserEmail) {
        // Verify caller permissions (Must be Creator or Admin)
        verifyAdminOrCreatorPermission(groupId, currentUserEmail);

        // Fetch the group entity
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        // Locate target membership mapping
        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, memberUserId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Membership record not found for this user in the specified group."));

        // Guard: Prevent demoting the Creator/Owner
        if (targetMember.getRole() == GroupRole.CREATOR) {
            throw new CustomExceptions.BadRequestException("The group creator's role cannot be modified.");
        }

        // Guard: Prevent redundant updates if they are already a standard member
        if (targetMember.getRole() == GroupRole.MEMBER) {
            throw new CustomExceptions.BadRequestException("This classmate is already a regular member.");
        }

        // Guard: Optional security check (Prevents Admins from demoting other Admins)
        GroupMember callerMembership = groupMemberRepository.findByGroupIdAndUserId(groupId, getUserIdByEmail(currentUserEmail))
                .orElseThrow(() -> new CustomExceptions.UnauthorizedException("You are not a member of this group."));

        if (callerMembership.getRole() == GroupRole.ADMIN && targetMember.getRole() == GroupRole.ADMIN) {
            throw new CustomExceptions.UnauthorizedException("Administrators cannot demote other administrators. Only the group creator can perform this action.");
        }

        // Apply demotion and save the row record
        targetMember.setRole(GroupRole.MEMBER);
        groupMemberRepository.save(targetMember);

        // Return the fully updated group representation with the updated role arrays
        return convertToDto(group);
    }



    @Transactional
    public void leaveGroup(Long groupId, String currentUserEmail) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        Long userId = getUserIdByEmail(currentUserEmail);

        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new CustomExceptions.UnauthorizedException("You are not a member of this study group."));

        // Guard: Owners / Creators cannot leave — they must delete the group instead
        GroupRole role = membership.getRole();
        if (role == GroupRole.CREATOR || "OWNER".equalsIgnoreCase(role.name())) {
            throw new CustomExceptions.BadRequestException("Group owners cannot leave the group. You must delete the group if you no longer wish to maintain it.");
        }

        groupMemberRepository.delete(membership);
    }




    // ==========================================================================
    //       INVITE CODE & JOIN GROUP METHODS
    // ==========================================================================

    /**
     * Join a group using an invite code or full invite URL.
     */
    @Transactional
    public GroupResponseDto joinGroupByInviteCode(JoinGroupRequest request, String currentUserEmail) {
        if (request == null || request.getInviteCode() == null || request.getInviteCode().isBlank()) {
            throw new CustomExceptions.BadRequestException("Invite code cannot be empty.");
        }

        // Sanitize input in case user pasted a full URL path (e.g. ".../join/ABC12345")
        String cleanedCode = extractInviteCode(request.getInviteCode());

        // 1. Fetch group by invite code (case-insensitive search)
        StudyGroup group = groupRepository.findByInviteCode(cleanedCode.toUpperCase())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Invalid or expired invite code."));

        // 2. Resolve current authenticated user
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found with email: " + currentUserEmail));

        // 3. Guard: Check if user is already a member
        boolean alreadyMember = groupMemberRepository.findByGroupIdAndUserId(group.getId(), user.getId()).isPresent();
        if (alreadyMember) {
            throw new CustomExceptions.BadRequestException("You are already a member of this study group.");
        }

        // 4. Create new GroupMember record with standard MEMBER role
        GroupMember newMember = new GroupMember();
        newMember.setStudyGroup(group);
        newMember.setUser(user);
        newMember.setRole(GroupRole.MEMBER);

        // Link both sides for Hibernate consistency
        group.getMembers().add(newMember);

        // 5. Persist new membership record
        groupMemberRepository.save(newMember);

        // 6. Return converted Group DTO containing updated member list
        return convertToDto(group);
    }

    /**
     * Regenerate a group's invite code (Creator/Admin only).
     */
    @Transactional
    public InviteLinkResponseDto regenerateInviteCode(Long groupId, String currentUserEmail) {
        // Verify caller permissions (Must be Creator or Admin)
        verifyAdminOrCreatorPermission(groupId, currentUserEmail);

        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Study group not found with id: " + groupId));

        // Generate fresh 8-character uppercase code
        String newCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        group.setInviteCode(newCode);

        groupRepository.save(group);

        return new InviteLinkResponseDto(newCode);
    }

    /**
     * Helper to extract the raw code if the user enters/pastes a full invite link.
     */
    private String extractInviteCode(String rawInput) {
        String trimmed = rawInput.trim();
        if (trimmed.contains("/")) {
            return trimmed.substring(trimmed.lastIndexOf('/') + 1);
        }
        return trimmed;
    }




    @Transactional(readOnly = true)
    public GroupPermissionResponseDto getUserGroupPermissions(Long groupId, String currentUserEmail) {
        Long userId = getUserIdByEmail(currentUserEmail);

        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new CustomExceptions.UnauthorizedException("You are not a member of this study group."));

        GroupRole role = membership.getRole();
        boolean isCreator = (role == GroupRole.CREATOR);
        boolean isAdmin = (role == GroupRole.ADMIN);
        boolean isOwnerOrAdmin = isCreator || isAdmin;

        return new GroupPermissionResponseDto(role, isAdmin, isCreator, isOwnerOrAdmin);
    }


    @Transactional(readOnly = true)
    public List<GroupMemberSummaryDto> getGroupMembersSummary(Long groupId, User currentUser) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        // Ensure the requesting user is a member of the group
        validateMembership(currentUser, group);

        return group.getMembers().stream()
                .map(member -> new GroupMemberSummaryDto(
                        member.getUser().getId(),
                        member.getUser().getFullName(), // Use getUser().getName() if that's your field name
                        member.getUser().getEmail()
                ))
                .collect(Collectors.toList());
    }

    private void validateMembership(User user, StudyGroup group) {
        if (user == null) {
            return;
        }

        boolean isMember = group.getMembers() != null && group.getMembers().stream()
                .anyMatch(member -> member.getUser() != null
                        && member.getUser().getId().equals(user.getId()));

        if (!isMember) {
            throw new CustomExceptions.BadRequestException("User " + user.getId() + " is not a member of group " + group.getId());
        }
    }


}