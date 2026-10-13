package com.studycollab.security;

import com.studycollab.repository.files.CategoryRepository;
import com.studycollab.repository.files.FilesRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Security authorization component referenced in SpEL expressions (e.g., @groupSecurity.isMember(...)).
 * Evaluates whether a given user possesses access rights to a study group, category, or file resource.
 */
@Component("groupSecurity")
public class GroupSecurity {

    private final GroupMemberRepository groupMemberRepository;
    private final CategoryRepository categoryRepository;
    private final FilesRepository filesRepository;

    public GroupSecurity(
            GroupMemberRepository groupMemberRepository,
            CategoryRepository categoryRepository,
            FilesRepository filesRepository
    ) {
        this.groupMemberRepository = groupMemberRepository;
        this.categoryRepository = categoryRepository;
        this.filesRepository = filesRepository;
    }

    /**
     * Checks if a user is an active member of the specified study group.
     */
    @Transactional(readOnly = true)
    public boolean isMember(Long groupId, Long userId) {
        if (groupId == null || userId == null) {
            return false;
        }
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId).isPresent();
    }

    /**
     * Checks if a user is a member of the study group that owns the specified category.
     * Uses targeted repository query to look up the group ID without loading full category entity.
     */
    @Transactional(readOnly = true)
    public boolean isCategoryMember(Long categoryId, Long userId) {
        if (categoryId == null || userId == null) {
            return false;
        }
        return categoryRepository.findGroupIdByCategoryId(categoryId)
                .map(groupId -> isMember(groupId, userId))
                .orElse(false);
    }

    /**
     * Checks if a user is a member of the study group that owns the specified file.
     * Uses targeted repository query to look up the group ID without loading full file entity.
     */
    @Transactional(readOnly = true)
    public boolean isFileMember(Long fileId, Long userId) {
        if (fileId == null || userId == null) {
            return false;
        }
        return filesRepository.findGroupIdByFileId(fileId)
                .map(groupId -> isMember(groupId, userId))
                .orElse(false);
    }
}
