package com.stage.backend.controller;

import com.stage.backend.entity.Team;
import com.stage.backend.entity.User;
import com.stage.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;

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
        List<Team> byName = teamRepository.findByNameContainingIgnoreCase(q);
        List<Team> byGenre = teamRepository.findByGenreContainingIgnoreCase(q);
        byName.addAll(byGenre);
        return ResponseEntity.ok(byName.stream().distinct().toList());
    }

    @PostMapping
    public ResponseEntity<Team> create(@RequestBody Team team,
                                       @AuthenticationPrincipal User user) {
        team.setOwner(user);
        return ResponseEntity.ok(teamRepository.save(team));
    }
}
