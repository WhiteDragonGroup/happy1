package com.stage.backend.repository;

import com.stage.backend.entity.Reservation;
import com.stage.backend.entity.Schedule;
import com.stage.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUser(User user);

    List<Reservation> findBySchedule(Schedule schedule);

    Optional<Reservation> findByQrCode(String qrCode);

    boolean existsByUserAndSchedule(User user, Schedule schedule);

    long countByScheduleAndReservationStatusNot(Schedule schedule, Reservation.ReservationStatus status);

    long countBySchedule_Id(Long scheduleId);

    // 미입금 예약 자동 취소용: PENDING 상태이고 생성일이 특정 시간 이전인 예약들
    List<Reservation> findByPaymentStatusAndReservationStatusAndCreatedAtBefore(
            Reservation.PaymentStatus paymentStatus,
            Reservation.ReservationStatus reservationStatus,
            LocalDateTime before);
}
