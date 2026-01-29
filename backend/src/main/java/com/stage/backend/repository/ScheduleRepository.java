package com.stage.backend.repository;

import com.stage.backend.entity.Schedule;
import com.stage.backend.entity.Team;
import com.stage.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByIsDeletedFalseAndIsPublishedTrueOrderByDateAsc();

    List<Schedule> findByDateAndIsDeletedFalseAndIsPublishedTrue(LocalDate date);

    List<Schedule> findByDateBetweenAndIsDeletedFalse(LocalDate start, LocalDate end);

    List<Schedule> findByTeamAndIsDeletedFalse(Team team);

    List<Schedule> findByManagerAndIsDeletedFalse(User manager);

    List<Schedule> findByTeamIdInAndIsDeletedFalseAndIsPublishedTrue(List<Long> teamIds);
}
