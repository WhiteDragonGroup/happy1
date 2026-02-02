package com.stage.backend.controller;

import com.stage.backend.entity.ManagerRequest;
import com.stage.backend.entity.User;
import com.stage.backend.repository.ManagerRequestRepository;
import com.stage.backend.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager-requests")
@RequiredArgsConstructor
public class ManagerRequestController {

    private final ManagerRequestRepository managerRequestRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ManagerRequest>> getMyRequests(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(managerRequestRepository.findByUserOrderByCreatedAtDesc(user));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ManagerRequest>> getAllRequests(@AuthenticationPrincipal User user) {
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        List<ManagerRequest> requests = managerRequestRepository.findAllByOrderByCreatedAtDesc();
        // Transient 필드에 유저 정보 설정
        requests.forEach(r -> {
            if (r.getUser() != null) {
                r.setUserName(r.getUser().getName());
                r.setUserEmail(r.getUser().getEmail());
            }
        });
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ManagerRequest>> getPendingRequests(@AuthenticationPrincipal User user) {
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        List<ManagerRequest> requests = managerRequestRepository.findByStatusOrderByCreatedAtDesc(ManagerRequest.Status.PENDING);
        requests.forEach(r -> {
            if (r.getUser() != null) {
                r.setUserName(r.getUser().getName());
                r.setUserEmail(r.getUser().getEmail());
            }
        });
        return ResponseEntity.ok(requests);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RequestForm form,
                                    @AuthenticationPrincipal User user) {
        // 이미 대기 중인 요청이 있는지 확인
        if (managerRequestRepository.findByUserAndStatus(user, ManagerRequest.Status.PENDING).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "이미 대기 중인 요청이 있습니다"));
        }

        ManagerRequest request = ManagerRequest.builder()
                .user(user)
                .teamName(form.getTeamName())
                .description(form.getDescription())
                .snsLink(form.getSnsLink())
                .reason(form.getReason())
                .build();

        return ResponseEntity.ok(managerRequestRepository.save(request));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ManagerRequest> approve(@PathVariable Long id,
                                                  @AuthenticationPrincipal User adminUser) {
        if (adminUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        return managerRequestRepository.findById(id)
                .map(request -> {
                    request.setStatus(ManagerRequest.Status.APPROVED);
                    request.setProcessedAt(LocalDateTime.now());
                    managerRequestRepository.save(request);

                    // 유저 권한을 MANAGER로 변경
                    User user = request.getUser();
                    user.setRole(User.Role.MANAGER);
                    userRepository.save(user);

                    return ResponseEntity.ok(request);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ManagerRequest> reject(@PathVariable Long id,
                                                 @RequestBody Map<String, String> body,
                                                 @AuthenticationPrincipal User adminUser) {
        if (adminUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        return managerRequestRepository.findById(id)
                .map(request -> {
                    request.setStatus(ManagerRequest.Status.REJECTED);
                    request.setRejectReason(body.get("reason"));
                    request.setProcessedAt(LocalDateTime.now());
                    return ResponseEntity.ok(managerRequestRepository.save(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Data
    public static class RequestForm {
        private String teamName;
        private String description;
        private String snsLink;
        private String reason;
    }
}
