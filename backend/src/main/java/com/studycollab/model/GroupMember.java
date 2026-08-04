package com.studycollab.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "group_members")
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnoreProperties("members") // 👈 This breaks the infinite loop!
    private StudyGroup studyGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)


//    @JsonIgnoreProperties({"password", "roles", "enabled", "authorities"}) // 👈 Prevents spilling user credentials or mapping back loops
//    private User user;

    @JsonIgnoreProperties({"password", "roles", "enabled", "authorities", "hibernateLazyInitializer", "handler"})
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupRole role;

    private LocalDateTime joinedAt = LocalDateTime.now();

    // Boilerplate Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StudyGroup getStudyGroup() { return studyGroup; }
    public void setStudyGroup(StudyGroup studyGroup) { this.studyGroup = studyGroup; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

// Replace your old getRole and setRole with these:

    public GroupRole getRole() {
        return role;
    }

    public void setRole(GroupRole role) {
        this.role = role;
    }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}