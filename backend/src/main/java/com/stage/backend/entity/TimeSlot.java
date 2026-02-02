package com.stage.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "time_slots")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot {

    // === PK ===
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === 필수 컬럼 (FK) ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    @JsonIgnore
    private Schedule schedule;

    // === 필수 컬럼 ===
    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String teamName;  // 출연 팀/아티스트 이름

    // === 일반 컬럼 ===
    private String description;
}
