package com.stage.backend.controller;

import com.stage.backend.config.JwtUtil;
import com.stage.backend.dto.AuthResponse;
import com.stage.backend.dto.LoginRequest;
import com.stage.backend.dto.RegisterRequest;
import com.stage.backend.dto.UserResponse;
import com.stage.backend.entity.User;
import com.stage.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
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
}
