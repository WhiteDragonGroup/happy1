package com.stage.backend.controller;

import com.stage.backend.entity.Team;
import com.stage.backend.entity.User;
import com.stage.backend.repository.FavoriteRepository;
import com.stage.backend.repository.ScheduleRepository;
import com.stage.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final FavoriteRepository favoriteRepository;
    private final ScheduleRepository scheduleRepository;

    @GetMapping
    public ResponseEntity<List<Team>> getAll() {
        return ResponseEntity.ok(teamRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getById(@PathVariable Long id) {
        return teamRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Team>> search(@RequestParam String q) {
        // 팀/아티스트 이름으로만 검색 (장르 검색 제외)
        List<Team> byName = teamRepository.findByNameContainingIgnoreCase(q);
        return ResponseEntity.ok(byName);
    }

    @PostMapping
    public ResponseEntity<Team> create(@RequestBody Team team,
                                       @AuthenticationPrincipal User user) {
        team.setOwner(user);
        return ResponseEntity.ok(teamRepository.save(team));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Team> update(@PathVariable Long id,
                                       @RequestBody Team teamData,
                                       @AuthenticationPrincipal User user) {
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        return teamRepository.findById(id)
                .map(team -> {
                    team.setName(teamData.getName());
                    team.setDescription(teamData.getDescription());
                    team.setGenre(teamData.getGenre());
                    if (teamData.getImageUrl() != null) {
                        team.setImageUrl(teamData.getImageUrl());
                    }
                    return ResponseEntity.ok(teamRepository.save(team));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal User user) {
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        return teamRepository.findById(id)
                .map(team -> {
                    // 먼저 해당 팀을 참조하는 Schedule의 team_id를 null로 설정
                    scheduleRepository.clearTeamReference(team.getId());
                    // 해당 팀을 참조하는 Favorite 레코드 삭제
                    favoriteRepository.deleteByTeam(team);
                    // 그 후 팀 삭제
                    teamRepository.delete(team);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
