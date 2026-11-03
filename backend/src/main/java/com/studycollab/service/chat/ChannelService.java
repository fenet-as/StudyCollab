package com.studycollab.service.chat;

import com.studycollab.dto.chat.ChannelResponseDTO;
import com.studycollab.dto.chat.CreateChannelRequest;
import com.studycollab.exception.CustomExceptions;
import com.studycollab.model.Channel;
import com.studycollab.model.GroupMember;
import com.studycollab.model.GroupRole;
import com.studycollab.model.StudyGroup;
import com.studycollab.model.User;
import com.studycollab.repository.chat.ChannelRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public List<ChannelResponseDTO> getChannelsByGroupId(Long groupId, User currentUser) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        validateMembership(groupId, currentUser);

        List<Channel> channels = channelRepository.findByStudyGroupIdOrderByIdAsc(groupId);

        // Auto-seed default '#general' channel if group has no channels
        if (channels.isEmpty()) {
            Channel defaultChannel = Channel.builder()
                    .studyGroup(group)
                    .name("general")
                    .description("General discussions for the study group")
                    .isDefault(true)
                    .createdBy(currentUser)
                    .build();
            defaultChannel = channelRepository.save(defaultChannel);
            channels = new ArrayList<>();
            channels.add(defaultChannel);
        }

        return channels.stream()
                .map(ChannelResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChannelResponseDTO createChannel(Long groupId, CreateChannelRequest request, User currentUser) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        GroupMember member = validateMembership(groupId, currentUser);
        if (member.getRole() != GroupRole.CREATOR && member.getRole() != GroupRole.ADMIN) {
            throw new AccessDeniedException("Only group admins or creators can create channels");
        }

        long currentCount = channelRepository.countByStudyGroupId(groupId);
        if (currentCount >= 10) {
            throw new CustomExceptions.BadRequestException("Study group has reached the maximum limit of 10 channels");
        }

        String normalizedName = request.getName().trim().toLowerCase();
        if (channelRepository.existsByStudyGroupIdAndName(groupId, normalizedName)) {
            throw new CustomExceptions.BadRequestException("A channel named '" + normalizedName + "' already exists in this study group");
        }

        Channel channel = Channel.builder()
                .studyGroup(group)
                .name(normalizedName)
                .description(request.getDescription())
                .isDefault(false)
                .createdBy(currentUser)
                .build();

        Channel saved = channelRepository.save(channel);
        return ChannelResponseDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteChannel(Long groupId, Long channelId, User currentUser) {
        groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Group not found with id: " + groupId));

        GroupMember member = validateMembership(groupId, currentUser);
        if (member.getRole() != GroupRole.CREATOR && member.getRole() != GroupRole.ADMIN) {
            throw new AccessDeniedException("Only group admins or creators can delete channels");
        }

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Channel not found with id: " + channelId));

        if (!channel.getStudyGroup().getId().equals(groupId)) {
            throw new CustomExceptions.ResourceNotFoundException("Channel " + channelId + " does not belong to group " + groupId);
        }

        if (channel.isDefault()) {
            throw new CustomExceptions.BadRequestException("Cannot delete the default channel");
        }

        channelRepository.delete(channel);
    }

    private GroupMember validateMembership(Long groupId, User user) {
        if (user == null || user.getId() == null) {
            throw new AccessDeniedException("Authentication required to access group channels");
        }
        return groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("User is not an active member of this study group"));
    }
}

