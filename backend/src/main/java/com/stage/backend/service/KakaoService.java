package com.stage.backend.service;

import com.stage.backend.dto.AuthResponse;
import com.stage.backend.config.JwtUtil;
import com.stage.backend.entity.User;
import com.stage.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KakaoService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${kakao.rest-api-key}")
    private String kakaoRestApiKey;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    private final WebClient webClient = WebClient.builder().build();

    /**
     * 카카오 액세스 토큰으로 사용자 정보 조회 후 로그인/회원가입 처리
     */
    @Transactional
    public AuthResponse loginWithKakao(String accessToken) {
        // 1. 카카오 API로 사용자 정보 조회
        Map<String, Object> kakaoUser = getKakaoUserInfo(accessToken);

        Long kakaoId = ((Number) kakaoUser.get("id")).longValue();
        Map<String, Object> kakaoAccount = (Map<String, Object>) kakaoUser.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");

        String nickname = (String) profile.get("nickname");
        String profileImage = (String) profile.get("profile_image_url");
        String emailFromKakao = (String) kakaoAccount.get("email");

        // 이메일이 없으면 kakaoId로 대체 이메일 생성
        final String email = (emailFromKakao == null || emailFromKakao.isEmpty())
                ? "kakao_" + kakaoId + "@kakao.local"
                : emailFromKakao;

        // 2. 기존 사용자 확인 (kakaoId로)
        User user = userRepository.findByKakaoId(kakaoId)
                .orElseGet(() -> {
                    // 이메일로도 확인 (기존 이메일 가입 사용자가 카카오 연동하는 경우)
                    return userRepository.findByEmail(email).orElse(null);
                });

        // 3. 신규 사용자면 회원가입
        if (user == null) {
            user = User.builder()
                    .kakaoId(kakaoId)
                    .email(email)
                    .password(UUID.randomUUID().toString()) // 랜덤 비밀번호 (카카오 로그인만 사용)
                    .name(nickname != null ? nickname : "카카오사용자")
                    .profileImage(profileImage)
                    .role(User.Role.USER)
                    .build();
            user = userRepository.save(user);
            log.info("카카오 신규 가입: kakaoId={}, email={}", kakaoId, email);
        } else {
            // 기존 사용자면 kakaoId 연동 (없는 경우)
            if (user.getKakaoId() == null) {
                user.setKakaoId(kakaoId);
            }
            // 프로필 이미지 업데이트
            if (profileImage != null) {
                user.setProfileImage(profileImage);
            }
            log.info("카카오 로그인: kakaoId={}, email={}", kakaoId, email);
        }

        // 4. JWT 토큰 생성
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(userService.toResponse(user))
                .build();
    }

    /**
     * 카카오 인가 코드로 로그인 처리 (Authorization Code Flow)
     */
    @Transactional
    public AuthResponse loginWithKakaoCode(String code) {
        // 1. 인가 코드로 액세스 토큰 발급
        String accessToken = getAccessToken(code);

        // 2. 액세스 토큰으로 로그인 처리
        return loginWithKakao(accessToken);
    }

    /**
     * 카카오 인가 코드로 액세스 토큰 발급
     */
    private String getAccessToken(String code) {
        log.info("카카오 토큰 요청: client_id={}, redirect_uri={}, code={}",
                kakaoRestApiKey, kakaoRedirectUri, code.substring(0, Math.min(10, code.length())) + "...");

        try {
            Map<String, Object> response = webClient.post()
                    .uri("https://kauth.kakao.com/oauth/token")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                    .bodyValue("grant_type=authorization_code" +
                            "&client_id=" + kakaoRestApiKey +
                            "&redirect_uri=" + kakaoRedirectUri +
                            "&code=" + code)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("access_token")) {
                log.error("카카오 액세스 토큰 발급 실패: {}", response);
                throw new RuntimeException("카카오 액세스 토큰 발급에 실패했습니다.");
            }

            String accessToken = (String) response.get("access_token");
            log.info("카카오 액세스 토큰 발급 성공");
            return accessToken;
        } catch (Exception e) {
            log.error("카카오 토큰 요청 실패: {}", e.getMessage());
            throw new RuntimeException("카카오 토큰 요청 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 카카오 API로 사용자 정보 조회
     */
    private Map<String, Object> getKakaoUserInfo(String accessToken) {
        return webClient.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
