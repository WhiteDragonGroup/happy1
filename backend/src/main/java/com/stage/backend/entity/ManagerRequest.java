package com.stage.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "manager_requests")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String teamName;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String snsLink;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    private String rejectReason;

    private LocalDateTime processedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    // 응답용 필드
    @Transient
    private String userName;

    @Transient
    private String userEmail;

    @PostLoad
    private void loadUserInfo() {
        if (user != null) {
            this.userName = user.getName();
            this.userEmail = user.getEmail();
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
