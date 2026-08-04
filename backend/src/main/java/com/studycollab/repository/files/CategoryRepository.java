package com.studycollab.repository.files;

import com.studycollab.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Fetch top-level categories of a specific group (where parent is null)
    List<Category> findByStudyGroupIdAndParentIsNull(Long groupId);
}