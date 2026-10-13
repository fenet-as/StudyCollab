package com.studycollab.security;

import com.studycollab.model.GroupMember;
import com.studycollab.repository.files.CategoryRepository;
import com.studycollab.repository.files.FilesRepository;
import com.studycollab.repository.group.GroupMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class GroupSecurityTest {

    private final Map<Long, Long> categoryToGroupMap = new HashMap<>();
    private final Map<Long, Long> fileToGroupMap = new HashMap<>();
    private final Set<String> groupMemberSet = new HashSet<>();

    private GroupSecurity groupSecurity;

    @BeforeEach
    void setUp() {
        categoryToGroupMap.clear();
        fileToGroupMap.clear();
        groupMemberSet.clear();

        CategoryRepository categoryRepository = (CategoryRepository) Proxy.newProxyInstance(
                CategoryRepository.class.getClassLoader(),
                new Class<?>[]{CategoryRepository.class},
                (proxy, method, args) -> {
                    if ("findGroupIdByCategoryId".equals(method.getName())) {
                        Long categoryId = (Long) args[0];
                        return Optional.ofNullable(categoryToGroupMap.get(categoryId));
                    }
                    return null;
                }
        );

        FilesRepository filesRepository = (FilesRepository) Proxy.newProxyInstance(
                FilesRepository.class.getClassLoader(),
                new Class<?>[]{FilesRepository.class},
                (proxy, method, args) -> {
                    if ("findGroupIdByFileId".equals(method.getName())) {
                        Long fileId = (Long) args[0];
                        return Optional.ofNullable(fileToGroupMap.get(fileId));
                    }
                    return null;
                }
        );

        GroupMemberRepository groupMemberRepository = (GroupMemberRepository) Proxy.newProxyInstance(
                GroupMemberRepository.class.getClassLoader(),
                new Class<?>[]{GroupMemberRepository.class},
                (proxy, method, args) -> {
                    if ("findByGroupIdAndUserId".equals(method.getName())) {
                        Long groupId = (Long) args[0];
                        Long userId = (Long) args[1];
                        if (groupMemberSet.contains(groupId + ":" + userId)) {
                            return Optional.of(new GroupMember());
                        }
                        return Optional.empty();
                    }
                    return null;
                }
        );

        groupSecurity = new GroupSecurity(groupMemberRepository, categoryRepository, filesRepository);
    }

    @Nested
    @DisplayName("isMember tests")
    class IsMemberTests {

        @Test
        @DisplayName("Should return true when user is a member of the group")
        void shouldReturnTrueWhenMemberExists() {
            groupMemberSet.add("10:42");

            assertThat(groupSecurity.isMember(10L, 42L)).isTrue();
        }

        @Test
        @DisplayName("Should return false when user is not a member of the group")
        void shouldReturnFalseWhenMemberDoesNotExist() {
            assertThat(groupSecurity.isMember(10L, 99L)).isFalse();
        }

        @Test
        @DisplayName("Should return false when groupId or userId is null")
        void shouldReturnFalseWhenArgumentsAreNull() {
            assertThat(groupSecurity.isMember(null, 42L)).isFalse();
            assertThat(groupSecurity.isMember(10L, null)).isFalse();
            assertThat(groupSecurity.isMember(null, null)).isFalse();
        }
    }

    @Nested
    @DisplayName("isCategoryMember tests")
    class IsCategoryMemberTests {

        @Test
        @DisplayName("Should return true when category exists and user is a member of the category's group")
        void shouldReturnTrueWhenCategoryMember() {
            categoryToGroupMap.put(5L, 10L);
            groupMemberSet.add("10:42");

            assertThat(groupSecurity.isCategoryMember(5L, 42L)).isTrue();
        }

        @Test
        @DisplayName("Should return false when category exists but user is not a member of the category's group")
        void shouldReturnFalseWhenCategoryExistsButNotMember() {
            categoryToGroupMap.put(5L, 10L);

            assertThat(groupSecurity.isCategoryMember(5L, 99L)).isFalse();
        }

        @Test
        @DisplayName("Should return false when category is not found")
        void shouldReturnFalseWhenCategoryNotFound() {
            assertThat(groupSecurity.isCategoryMember(999L, 42L)).isFalse();
        }

        @Test
        @DisplayName("Should return false when categoryId or userId is null")
        void shouldReturnFalseWhenArgumentsNull() {
            categoryToGroupMap.put(5L, 10L);

            assertThat(groupSecurity.isCategoryMember(null, 42L)).isFalse();
            assertThat(groupSecurity.isCategoryMember(5L, null)).isFalse();
            assertThat(groupSecurity.isCategoryMember(null, null)).isFalse();
        }
    }

    @Nested
    @DisplayName("isFileMember tests")
    class IsFileMemberTests {

        @Test
        @DisplayName("Should return true when file exists and user is a member of the file's group")
        void shouldReturnTrueWhenFileMember() {
            fileToGroupMap.put(20L, 10L);
            groupMemberSet.add("10:42");

            assertThat(groupSecurity.isFileMember(20L, 42L)).isTrue();
        }

        @Test
        @DisplayName("Should return false when file exists but user is not a member of the file's group")
        void shouldReturnFalseWhenFileExistsButNotMember() {
            fileToGroupMap.put(20L, 10L);

            assertThat(groupSecurity.isFileMember(20L, 99L)).isFalse();
        }

        @Test
        @DisplayName("Should return false when file is not found")
        void shouldReturnFalseWhenFileNotFound() {
            assertThat(groupSecurity.isFileMember(999L, 42L)).isFalse();
        }

        @Test
        @DisplayName("Should return false when fileId or userId is null")
        void shouldReturnFalseWhenArgumentsNull() {
            fileToGroupMap.put(20L, 10L);

            assertThat(groupSecurity.isFileMember(null, 42L)).isFalse();
            assertThat(groupSecurity.isFileMember(20L, null)).isFalse();
            assertThat(groupSecurity.isFileMember(null, null)).isFalse();
        }
    }
}
