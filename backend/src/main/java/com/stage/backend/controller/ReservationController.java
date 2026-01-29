package com.stage.backend.controller;

import com.stage.backend.entity.*;
import com.stage.backend.repository.ReservationRepository;
import com.stage.backend.repository.ScheduleRepository;
import com.stage.backend.repository.TimeSlotRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final ScheduleRepository scheduleRepository;
    private final TimeSlotRepository timeSlotRepository;

    @GetMapping
    public ResponseEntity<List<Reservation>> getMyReservations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(reservationRepository.findByUser(user));
    }

    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<Reservation>> getBySchedule(@PathVariable Long scheduleId,
                                                           @AuthenticationPrincipal User user) {
        Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null) return ResponseEntity.notFound().build();

        // 본인 일정이거나 어드민만 조회 가능
        if (!schedule.getManager().getId().equals(user.getId()) &&
                user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(reservationRepository.findBySchedule(schedule));
    }

    @PostMapping
    public ResponseEntity<Reservation> create(@RequestBody ReservationRequest request,
                                              @AuthenticationPrincipal User user) {
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));

        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new RuntimeException("시간대를 찾을 수 없습니다."));

        // 잔여 좌석 확인
        int remainingSeats = timeSlot.getCapacity() - timeSlot.getReservedCount();
        if (remainingSeats <= 0) {
            throw new RuntimeException("잔여 좌석이 없습니다.");
        }

        Reservation.PaymentMethod paymentMethod =
                Reservation.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());

        int amount = schedule.getPrice() != null ? schedule.getPrice().intValue() : 0;

        Reservation reservation = Reservation.builder()
                .schedule(schedule)
                .user(user)
                .timeSlot(timeSlot)
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentMethod == Reservation.PaymentMethod.CARD ?
                        Reservation.PaymentStatus.COMPLETED :
                        Reservation.PaymentStatus.PENDING)
                .reservationStatus(paymentMethod == Reservation.PaymentMethod.CARD ?
                        Reservation.ReservationStatus.CONFIRMED :
                        Reservation.ReservationStatus.PENDING)
                .amount(amount)
                .qrCode(UUID.randomUUID().toString())
                .build();

        // 예약 카운트 증가
        timeSlot.setReservedCount(timeSlot.getReservedCount() + 1);
        timeSlotRepository.save(timeSlot);

        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    @PostMapping("/{id}/confirm-payment")
    public ResponseEntity<Reservation> confirmPayment(@PathVariable Long id,
                                                      @AuthenticationPrincipal User user) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));

        Schedule schedule = reservation.getSchedule();
        if (!schedule.getManager().getId().equals(user.getId()) &&
                user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        reservation.setPaymentStatus(Reservation.PaymentStatus.COMPLETED);
        reservation.setReservationStatus(Reservation.ReservationStatus.CONFIRMED);

        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    @PostMapping("/{id}/enter")
    public ResponseEntity<Reservation> enter(@PathVariable Long id,
                                             @AuthenticationPrincipal User user) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));

        Schedule schedule = reservation.getSchedule();
        if (!schedule.getManager().getId().equals(user.getId()) &&
                user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        reservation.setIsEntered(true);
        reservation.setEnteredAt(LocalDateTime.now());
        reservation.setReservationStatus(Reservation.ReservationStatus.USED);

        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    @PostMapping("/qr/{qrCode}")
    public ResponseEntity<Reservation> enterByQr(@PathVariable String qrCode,
                                                 @AuthenticationPrincipal User user) {
        Reservation reservation = reservationRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));

        Schedule schedule = reservation.getSchedule();
        if (!schedule.getManager().getId().equals(user.getId()) &&
                user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        reservation.setIsEntered(true);
        reservation.setEnteredAt(LocalDateTime.now());
        reservation.setReservationStatus(Reservation.ReservationStatus.USED);

        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    @Data
    public static class ReservationRequest {
        private Long scheduleId;
        private Long timeSlotId;
        private String paymentMethod;
    }
}
