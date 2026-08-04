package com.studycollab.controller.group;

import com.studycollab.dto.group.GroupOverviewDto;
import com.studycollab.service.group.GroupOverviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups/{groupId}/overview")
@RequiredArgsConstructor
public class GroupOverviewController {

    private final GroupOverviewService groupOverviewService;

    @GetMapping
    public ResponseEntity<GroupOverviewDto> getOverview(@PathVariable Long groupId) {
        GroupOverviewDto overview = groupOverviewService.getGroupOverview(groupId);
        return ResponseEntity.ok(overview);
    }
}