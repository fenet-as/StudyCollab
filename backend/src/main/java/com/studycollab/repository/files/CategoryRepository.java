package com.studycollab.repository.files;

import com.studycollab.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Fetch top-level categories of a specific group (where parent is null)
    List<Category> findByStudyGroupIdAndParentIsNull(Long groupId);

    @Query("SELECT c.studyGroup.id FROM Category c WHERE c.id = :categoryId")
    Optional<Long> findGroupIdByCategoryId(@Param("categoryId") Long categoryId);
}