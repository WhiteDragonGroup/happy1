package com.stage.backend.controller;

import com.stage.backend.entity.Reservation;
import com.stage.backend.entity.Schedule;
import com.stage.backend.entity.TimeSlot;
import com.stage.backend.entity.User;
import com.stage.backend.repository.ReservationRepository;
import com.stage.backend.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final ScheduleRepository scheduleRepository;

    // 1. 내 예약 목록
    @GetMapping
    public ResponseEntity<List<Reservation>> getMyReservations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(reservationRepository.findByUser(user));
    }

    // 2. 일정별 예약자 목록 (MANAGER 소유자 / ADMIN)
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<Reservation>> getBySchedule(
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal User user) {
        return scheduleRepository.findById(scheduleId)
                .filter(schedule -> schedule.getManager().getId().equals(user.getId()) ||
                        user.getRole() == User.Role.ADMIN)
                .map(schedule -> ResponseEntity.ok(reservationRepository.findBySchedule(schedule)))
                .orElse(ResponseEntity.status(403).build());
    }

    // 3. 예약 신청 (결제 없음 - 공연등록자가 입금 확인 후 확정)
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal User user) {
        Long scheduleId = ((Number) body.get("scheduleId")).longValue();

        return scheduleRepository.findById(scheduleId)
                .map(schedule -> {
                    // 중복 예약 체크
                    if (reservationRepository.existsByUserAndSchedule(user, schedule)) {
                        return ResponseEntity.badRequest().body("이미 예약한 일정입니다.");
                    }

                    // capacity 초과 체크
                    long currentCount = reservationRepository.countByScheduleAndReservationStatusNot(
                            schedule, Reservation.ReservationStatus.CANCELLED);
                    if (currentCount >= schedule.getCapacity()) {
                        return ResponseEntity.badRequest().body("예약이 마감되었습니다.");
                    }

                    // TimeSlot 찾기
                    TimeSlot timeSlot = null;
                    if (body.get("timeSlotId") != null) {
                        Long timeSlotId = ((Number) body.get("timeSlotId")).longValue();
                        if (schedule.getTimeSlots() != null) {
                            timeSlot = schedule.getTimeSlots().stream()
                                    .filter(ts -> ts.getId().equals(timeSlotId))
                                    .findFirst()
                                    .orElse(null);
                        }
                    }

                    // 금액 설정
                    BigDecimal amount = schedule.getAdvancePrice() != null
                            ? schedule.getAdvancePrice()
                            : BigDecimal.ZERO;

                    // 모든 예약은 PENDING 상태로 생성 (공연등록자가 입금 확인 후 확정)
                    Reservation reservation = Reservation.builder()
                            .user(user)
                            .schedule(schedule)
                            .timeSlot(timeSlot)
                            .paymentMethod(Reservation.PaymentMethod.BANK)
                            .paymentStatus(Reservation.PaymentStatus.PENDING)
                            .reservationStatus(Reservation.ReservationStatus.PENDING)
                            .amount(amount)
                            .isEntered(false)
                            .build();

                    Reservation saved = reservationRepository.save(reservation);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. 입금 확인 (MANAGER/ADMIN)
    @PostMapping("/{id}/confirm-payment")
    public ResponseEntity<?> confirmPayment(@PathVariable Long id,
                                            @AuthenticationPrincipal User user) {
        return reservationRepository.findById(id)
                .map(reservation -> {
                    Schedule schedule = reservation.getSchedule();
                    if (!schedule.getManager().getId().equals(user.getId()) &&
                            user.getRole() != User.Role.ADMIN) {
                        return ResponseEntity.status(403).body("권한이 없습니다.");
                    }

                    reservation.setPaymentStatus(Reservation.PaymentStatus.COMPLETED);
                    reservation.setReservationStatus(Reservation.ReservationStatus.CONFIRMED);
                    return ResponseEntity.ok(reservationRepository.save(reservation));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. 입장 처리 (ID)
    @PostMapping("/{id}/enter")
    public ResponseEntity<?> enter(@PathVariable Long id,
                                   @AuthenticationPrincipal User user) {
        return reservationRepository.findById(id)
                .map(reservation -> {
                    Schedule schedule = reservation.getSchedule();
                    if (!schedule.getManager().getId().equals(user.getId()) &&
                            user.getRole() != User.Role.ADMIN) {
                        return ResponseEntity.status(403).body("권한이 없습니다.");
                    }

                    if (Boolean.TRUE.equals(reservation.getIsEntered())) {
                        return ResponseEntity.badRequest().body("이미 입장 처리된 예약입니다.");
                    }

                    reservation.setIsEntered(true);
                    reservation.setEnteredAt(LocalDateTime.now());
                    reservation.setReservationStatus(Reservation.ReservationStatus.USED);
                    return ResponseEntity.ok(reservationRepository.save(reservation));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 6. 입장 처리 (QR)
    @PostMapping("/qr/{qrCode}")
    public ResponseEntity<?> enterByQr(@PathVariable String qrCode,
                                       @AuthenticationPrincipal User user) {
        return reservationRepository.findByQrCode(qrCode)
                .map(reservation -> {
                    Schedule schedule = reservation.getSchedule();
                    if (!schedule.getManager().getId().equals(user.getId()) &&
                            user.getRole() != User.Role.ADMIN) {
                        return ResponseEntity.status(403).body("권한이 없습니다.");
                    }

                    if (Boolean.TRUE.equals(reservation.getIsEntered())) {
                        return ResponseEntity.badRequest().body("이미 입장 처리된 예약입니다.");
                    }

                    reservation.setIsEntered(true);
                    reservation.setEnteredAt(LocalDateTime.now());
                    reservation.setReservationStatus(Reservation.ReservationStatus.USED);
                    return ResponseEntity.ok(reservationRepository.save(reservation));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
