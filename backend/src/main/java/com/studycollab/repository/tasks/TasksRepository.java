// backend/src/main/java/com/studycollab/repository/tasks/TasksRepository.java
package com.studycollab.repository.tasks;

import com.studycollab.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TasksRepository extends JpaRepository<Task, Long> {
    List<Task> findByStudyGroupId(Long groupId);



    long countByStudyGroupIdAndStatus(Long groupId, Task.Status status);
    List<Task> findTop5ByStudyGroupIdAndStatusOrderByDueDateAsc(Long groupId, Task.Status status);
}