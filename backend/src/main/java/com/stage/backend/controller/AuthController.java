package com.stage.backend.controller;

import com.stage.backend.config.JwtUtil;
import com.stage.backend.dto.AuthResponse;
import com.stage.backend.dto.LoginRequest;
import com.stage.backend.dto.RegisterRequest;
import com.stage.backend.dto.UserResponse;
import com.stage.backend.entity.User;
import com.stage.backend.service.KakaoService;
import com.stage.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final KakaoService kakaoService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse userResponse = userService.register(request);
        String token = jwtUtil.generateToken(userResponse.getId(), userResponse.getEmail(), userResponse.getRole());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .user(userResponse)
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.authenticate(request);
        UserResponse userResponse = userService.toResponse(user);
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .user(userResponse)
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.toResponse(user));
    }

    @PostMapping("/kakao")
    public ResponseEntity<AuthResponse> kakaoLogin(@RequestBody Map<String, String> request) {
        String accessToken = request.get("accessToken");
        if (accessToken == null || accessToken.isEmpty()) {
            throw new RuntimeException("카카오 액세스 토큰이 필요합니다.");
        }
        AuthResponse response = kakaoService.loginWithKakao(accessToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/kakao/callback")
    public ResponseEntity<AuthResponse> kakaoCallback(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null || code.isEmpty()) {
            throw new RuntimeException("카카오 인가 코드가 필요합니다.");
        }
        AuthResponse response = kakaoService.loginWithKakaoCode(code);
        return ResponseEntity.ok(response);
    }
}
