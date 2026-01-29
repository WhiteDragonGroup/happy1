package com.stage.backend.repository;

import com.stage.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByNameContainingIgnoreCase(String name);
    List<Team> findByGenreContainingIgnoreCase(String genre);
}
