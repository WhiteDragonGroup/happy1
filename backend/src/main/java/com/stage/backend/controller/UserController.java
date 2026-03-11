package com.stage.backend.controller;

import com.stage.backend.dto.UserResponse;
import com.stage.backend.entity.User;
import com.stage.backend.repository.UserRepository;
import com.stage.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.stage.backend.repository.FavoriteRepository;
import com.stage.backend.repository.ReservationRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final ReservationRepository reservationRepository;
    private final FavoriteRepository favoriteRepository;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        List<UserResponse> users = userRepository.findAll().stream()
                .map(userService::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User currentUser) {

        if (currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        String newRole = request.get("role");
        if (newRole == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            User.Role role = User.Role.valueOf(newRole);
            UserResponse updated = userService.updateRole(id, role);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.toResponse(currentUser));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User currentUser) {

        if (request.containsKey("name")) {
            currentUser.setName(request.get("name"));
        }
        if (request.containsKey("nickname")) {
            currentUser.setNickname(request.get("nickname"));
        }
        if (request.containsKey("phone")) {
            currentUser.setPhone(request.get("phone"));
        }
        // 이메일은 변경 불가

        userRepository.save(currentUser);
        return ResponseEntity.ok(userService.toResponse(currentUser));
    }

    @DeleteMapping("/me")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteMe(@AuthenticationPrincipal User currentUser) {
        // 찜 목록 삭제
        favoriteRepository.deleteByUser(currentUser);
        // 예약 내역 삭제
        reservationRepository.deleteByUser(currentUser);
        // 회원 삭제
        userRepository.delete(currentUser);
        return ResponseEntity.ok().body("회원탈퇴가 완료되었습니다.");
    }
}
