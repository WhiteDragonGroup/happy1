package com.stage.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private String profileImage;
    private String role;
    private LocalDateTime createdAt;
}
