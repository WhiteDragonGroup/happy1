package com.stage.backend.repository;

import com.stage.backend.entity.Schedule;
import com.stage.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    @Modifying
    @Query(value = "UPDATE schedules SET team_id = NULL WHERE team_id = :teamId", nativeQuery = true)
    void clearTeamReference(@Param("teamId") Long teamId);

    List<Schedule> findByIsDeletedFalseAndIsPublishedTrueOrderByDateAsc();

    List<Schedule> findByDateAndIsDeletedFalseAndIsPublishedTrue(LocalDate date);

    List<Schedule> findByDateBetweenAndIsDeletedFalse(LocalDate start, LocalDate end);

    List<Schedule> findByManagerAndIsDeletedFalse(User manager);

    List<Schedule> findByOrganizerContainingAndIsDeletedFalseAndIsPublishedTrue(String organizer);
}
