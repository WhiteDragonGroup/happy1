package com.stage.backend.controller;

import com.stage.backend.entity.Schedule;
import com.stage.backend.entity.User;
import com.stage.backend.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleRepository scheduleRepository;

    @GetMapping
    public ResponseEntity<List<Schedule>> getAll() {
        return ResponseEntity.ok(
                scheduleRepository.findByIsDeletedFalseAndIsPublishedTrueOrderByDateAsc()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Schedule> getById(@PathVariable Long id) {
        return scheduleRepository.findById(id)
                .filter(s -> !s.getIsDeleted())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<Schedule>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(
                scheduleRepository.findByDateAndIsDeletedFalseAndIsPublishedTrue(date)
        );
    }

    @GetMapping("/month")
    public ResponseEntity<List<Schedule>> getByMonth(
            @RequestParam int year,
            @RequestParam int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return ResponseEntity.ok(
                scheduleRepository.findByDateBetweenAndIsDeletedFalse(start, end)
        );
    }

    @GetMapping("/my")
    public ResponseEntity<List<Schedule>> getMySchedules(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                scheduleRepository.findByManagerAndIsDeletedFalse(user)
        );
    }

    @PostMapping
    public ResponseEntity<Schedule> create(@RequestBody Schedule schedule,
                                           @AuthenticationPrincipal User user) {
        schedule.setManager(user);
        // 타임슬롯에 스케줄 참조 설정
        if (schedule.getTimeSlots() != null) {
            for (var slot : schedule.getTimeSlots()) {
                slot.setSchedule(schedule);
            }
        }
        return ResponseEntity.ok(scheduleRepository.save(schedule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Schedule> update(@PathVariable Long id,
                                           @RequestBody Schedule scheduleData,
                                           @AuthenticationPrincipal User user) {
        return scheduleRepository.findById(id)
                .filter(s -> s.getManager().getId().equals(user.getId()) ||
                        user.getRole() == User.Role.ADMIN)
                .map(schedule -> {
                    schedule.setTitle(scheduleData.getTitle());
                    schedule.setOrganizer(scheduleData.getOrganizer());
                    schedule.setDate(scheduleData.getDate());
                    schedule.setPublicDate(scheduleData.getPublicDate());
                    schedule.setCapacity(scheduleData.getCapacity());
                    schedule.setAdvancePrice(scheduleData.getAdvancePrice());
                    schedule.setDoorPrice(scheduleData.getDoorPrice());
                    schedule.setVenue(scheduleData.getVenue());
                    schedule.setDescription(scheduleData.getDescription());
                    schedule.setImageUrl(scheduleData.getImageUrl());
                    schedule.setIsPublished(scheduleData.getIsPublished());

                    // 타임슬롯 업데이트
                    schedule.getTimeSlots().clear();
                    if (scheduleData.getTimeSlots() != null) {
                        for (var slot : scheduleData.getTimeSlots()) {
                            slot.setSchedule(schedule);
                            schedule.getTimeSlots().add(slot);
                        }
                    }

                    return ResponseEntity.ok(scheduleRepository.save(schedule));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal User user) {
        return scheduleRepository.findById(id)
                .filter(s -> s.getManager().getId().equals(user.getId()) ||
                        user.getRole() == User.Role.ADMIN)
                .map(s -> {
                    s.setIsDeleted(true);
                    scheduleRepository.save(s);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/all")
    public ResponseEntity<Void> deleteAll(@AuthenticationPrincipal User user) {
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        List<Schedule> all = scheduleRepository.findAll();
        all.forEach(s -> s.setIsDeleted(true));
        scheduleRepository.saveAll(all);
        return ResponseEntity.ok().build();
    }
}
