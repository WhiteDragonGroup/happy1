package com.stage.backend.controller;

import com.stage.backend.entity.Favorite;
import com.stage.backend.entity.Team;
import com.stage.backend.entity.User;
import com.stage.backend.repository.FavoriteRepository;
import com.stage.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final TeamRepository teamRepository;

    @GetMapping
    public ResponseEntity<List<Favorite>> getMyFavorites(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(favoriteRepository.findByUser(user));
    }

    @PostMapping("/{teamId}")
    public ResponseEntity<Favorite> addFavorite(@PathVariable Long teamId,
                                                @AuthenticationPrincipal User user) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("팀을 찾을 수 없습니다."));

        if (favoriteRepository.existsByUserAndTeam(user, team)) {
            throw new RuntimeException("이미 찜한 팀입니다.");
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .team(team)
                .build();

        return ResponseEntity.ok(favoriteRepository.save(favorite));
    }

    @DeleteMapping("/{teamId}")
    @Transactional
    public ResponseEntity<Void> removeFavorite(@PathVariable Long teamId,
                                               @AuthenticationPrincipal User user) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("팀을 찾을 수 없습니다."));

        favoriteRepository.deleteByUserAndTeam(user, team);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check/{teamId}")
    public ResponseEntity<Boolean> checkFavorite(@PathVariable Long teamId,
                                                 @AuthenticationPrincipal User user) {
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.ok(false);

        return ResponseEntity.ok(favoriteRepository.existsByUserAndTeam(user, team));
    }
}
