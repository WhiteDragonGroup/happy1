package com.stage.backend.config;

import com.stage.backend.entity.Reservation;
import com.stage.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationScheduler {

    private final ReservationRepository reservationRepository;

    /**
     * 3일(72시간) 이내 미입금 예약 자동 취소
     * 매 시간 정각에 실행
     */
    @Scheduled(cron = "0 0 * * * *")
    public void autoCancelExpiredReservations() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(3);

        List<Reservation> expired = reservationRepository
                .findByPaymentStatusAndReservationStatusAndCreatedAtBefore(
                        Reservation.PaymentStatus.PENDING,
                        Reservation.ReservationStatus.PENDING,
                        cutoff
                );

        if (expired.isEmpty()) return;

        for (Reservation reservation : expired) {
            reservation.setReservationStatus(Reservation.ReservationStatus.CANCELLED);
            reservation.setPaymentStatus(Reservation.PaymentStatus.CANCELLED);
        }

        reservationRepository.saveAll(expired);
        log.info("미입금 예약 {}건 자동 취소 완료 (기준: {})", expired.size(), cutoff);
    }
}
