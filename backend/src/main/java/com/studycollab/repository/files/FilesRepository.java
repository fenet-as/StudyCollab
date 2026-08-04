package com.studycollab.repository.files;

import com.studycollab.model.FileResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FilesRepository extends JpaRepository<FileResource, Long> {

    List<FileResource> findByStudyGroupId(Long groupId);

    List<FileResource> findByStudyGroupIdAndCategoryId(Long groupId, Long categoryId);

    // 🌟 CHANGED: Fixed 'username' error to map against 'fullName' and 'email'
    @Query("SELECT f FROM FileResource f WHERE f.studyGroup.id = :groupId AND " +
            "(LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(f.uploader.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(f.uploader.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<FileResource> searchFiles(@Param("groupId") Long groupId, @Param("query") String query);




    long countByStudyGroupId(Long groupId);
    List<FileResource> findTop5ByStudyGroupIdOrderByCreatedAtDesc(Long groupId);
}