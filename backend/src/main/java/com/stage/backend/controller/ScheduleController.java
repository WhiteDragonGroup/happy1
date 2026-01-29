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
        return ResponseEntity.ok(scheduleRepository.save(schedule));
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
}
