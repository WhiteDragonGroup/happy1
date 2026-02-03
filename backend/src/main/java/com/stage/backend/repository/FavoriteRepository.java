package com.stage.backend.repository;

import com.stage.backend.entity.Favorite;
import com.stage.backend.entity.Team;
import com.stage.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser(User user);
    Optional<Favorite> findByUserAndTeam(User user, Team team);
    boolean existsByUserAndTeam(User user, Team team);
    void deleteByUserAndTeam(User user, Team team);
    void deleteByTeam(Team team);
}
