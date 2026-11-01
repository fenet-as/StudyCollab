package com.studycollab.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "channels",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_channels_group_name", columnNames = {"group_id", "name"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private StudyGroup studyGroup;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "channel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChatMessage> messages = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}

