package com.stage.backend.repository;

import com.stage.backend.entity.TimeSlot;
import com.stage.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    List<TimeSlot> findBySchedule(Schedule schedule);
}
