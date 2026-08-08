package com.studycollab.service.group;

import com.studycollab.dto.group.GroupOverviewDto;
import com.studycollab.exception.CustomExceptions.ResourceNotFoundException;
import com.studycollab.model.Task;
import com.studycollab.repository.files.FilesRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import com.studycollab.repository.group.GroupRepository;
import com.studycollab.repository.notes.NotesRepository;
import com.studycollab.repository.tasks.TasksRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupOverviewService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final NotesRepository notesRepository;
    private final TasksRepository tasksRepository;
    private final FilesRepository filesRepository;

    @Transactional(readOnly = true)
    public GroupOverviewDto getGroupOverview(Long groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Group not found with id: " + groupId);
        }

        // 1. Fetch Aggregated Counts
        long totalNotes = notesRepository.countByStudyGroupId(groupId);
        long pendingTasks = tasksRepository.countByStudyGroupIdAndStatus(groupId, Task.Status.TODO);
        long completedTasks = tasksRepository.countByStudyGroupIdAndStatus(groupId, Task.Status.DONE);
        long totalFiles = filesRepository.countByStudyGroupId(groupId);
        long totalMembers = groupMemberRepository.countByStudyGroupId(groupId);

        GroupOverviewDto.StatsDto stats = GroupOverviewDto.StatsDto.builder()
                .totalNotes(totalNotes)
                .pendingTasks(pendingTasks)
                .completedTasks(completedTasks)
                .totalFiles(totalFiles)
                .totalMembers(totalMembers)
                .build();

        // 2. Fetch Recent Items




        var upcomingTasks = tasksRepository
                .findTop5ByStudyGroupIdAndStatusOrderByDueDateAsc(groupId, Task.Status.TODO)
                .stream()
                .map(t -> GroupOverviewDto.UpcomingTaskDto.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .dueDate(
                                t.getDueDate() != null
                                        ? t.getDueDate().toLocalDate()
                                        : null
                        )
                        .priority(t.getPriority())
                        .assigneeId(
                                t.getAssignee() != null
                                        ? t.getAssignee().getId()
                                        : null
                        )
                        .assigneeName(
                                t.getAssignee() != null
                                        ? t.getAssignee().getFullName()
                                        : "Unassigned"
                        )
                        .build()
                )
                .collect(Collectors.toList());

        var recentNotes = notesRepository.findTop5ByStudyGroupIdOrderByUpdatedAtDesc(groupId)
                .stream().map(n -> GroupOverviewDto.RecentNoteDto.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .updatedAt(n.getUpdatedAt())
                        .authorName(n.getOwner() != null ? n.getOwner().getFullName() : "Unknown")
                        .build()
                ).collect(Collectors.toList());

        var recentFiles = filesRepository.findTop5ByStudyGroupIdOrderByCreatedAtDesc(groupId)
                .stream().map(f -> GroupOverviewDto.RecentFileDto.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .categoryName(f.getCategory() != null ? f.getCategory().getName() : "General")
                        .createdAt(f.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());

        var members = groupMemberRepository.findTop4ByStudyGroupIdOrderByJoinedAtAsc(groupId)
                .stream().map(m -> GroupOverviewDto.MemberSummaryDto.builder()
                        .id(m.getUser().getId())
                        .name(m.getUser().getFullName())
                        .avatarUrl(m.getUser().getAvatarUrl())
                        .build()
                ).collect(Collectors.toList());

        return GroupOverviewDto.builder()
                .stats(stats)
                .upcomingTasks(upcomingTasks)
                .recentNotes(recentNotes)
                .recentFiles(recentFiles)
                .members(members)
                .totalMembersCount(totalMembers)
                .build();
    }
}