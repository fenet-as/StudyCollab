package com.studycollab.dto.group;

import com.studycollab.model.Task;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GroupOverviewDto {

    private StatsDto stats;
    private List<UpcomingTaskDto> upcomingTasks;
    private List<RecentNoteDto> recentNotes;
    private List<RecentFileDto> recentFiles;
    private List<MemberSummaryDto> members;
    private long totalMembersCount;

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class StatsDto {
        private long totalNotes;
        private long pendingTasks;
        private long completedTasks;
        private long totalFiles;
        private long totalMembers;
    }






    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class UpcomingTaskDto {
        private Long id;
        private String title;
        private LocalDate dueDate;
        private Task.Priority priority;

        private Long assigneeId;
        private String assigneeName;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class RecentNoteDto {
        private Long id;
        private String title;
        private LocalDateTime updatedAt;
        private String authorName;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class RecentFileDto {
        private Long id;
        private String name;
        private String categoryName;
        private LocalDateTime createdAt;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class MemberSummaryDto {
        private Long id;
        private String name;
        private String avatarUrl;
    }
}