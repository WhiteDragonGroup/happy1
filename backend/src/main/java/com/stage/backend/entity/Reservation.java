package com.stage.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reservations")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Reservation {

    // === PK ===
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === FK: User ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    // === FK: Schedule ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Schedule schedule;

    // === FK: TimeSlot (nullable) ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private TimeSlot timeSlot;

    // === Transient 응답용 필드 ===
    @Transient
    private Long userId;

    @Transient
    private String userName;

    @Transient
    private String userPhone;

    @Transient
    private String userEmail;

    @Transient
    private Long scheduleId;

    @Transient
    private Long timeSlotId;

    @PostLoad
    private void loadTransientFields() {
        if (user != null) {
            this.userId = user.getId();
            this.userName = user.getName();
            this.userPhone = user.getPhone();
            this.userEmail = user.getEmail();
        }
        if (schedule != null) {
            this.scheduleId = schedule.getId();
        }
        if (timeSlot != null) {
            this.timeSlotId = timeSlot.getId();
        }
    }

    // === Enums ===
    public enum PaymentStatus {
        PENDING, COMPLETED, REFUNDED, CANCELLED
    }

    public enum ReservationStatus {
        PENDING, CONFIRMED, CANCELLED, USED
    }

    public enum PaymentMethod {
        CARD, BANK
    }

    // === 상태 필드 ===
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus reservationStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    // === QR코드 ===
    @Column(unique = true)
    private String qrCode;

    // === 입장 ===
    @Builder.Default
    @Column(nullable = false)
    private Boolean isEntered = false;

    private LocalDateTime enteredAt;

    // === 금액 ===
    private BigDecimal amount;

    // === 타임스탬프 ===
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (qrCode == null) {
            qrCode = UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
