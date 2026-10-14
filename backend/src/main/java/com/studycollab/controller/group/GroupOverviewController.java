package com.studycollab.controller.group;

import com.studycollab.dto.group.GroupOverviewDto;
import com.studycollab.security.CustomUserDetails;
import com.studycollab.service.group.GroupOverviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups/{groupId}/overview")
@RequiredArgsConstructor
public class GroupOverviewController {

    private final GroupOverviewService groupOverviewService;

    @GetMapping
    @PreAuthorize("@groupSecurity.isMember(#groupId, principal.id)")
    public ResponseEntity<GroupOverviewDto> getOverview(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        GroupOverviewDto overview = groupOverviewService.getGroupOverview(groupId, userId);
        return ResponseEntity.ok(overview);
    }
}