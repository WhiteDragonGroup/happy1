package com.stage.backend.config;

import com.stage.backend.entity.*;
import com.stage.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TeamRepository teamRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 특정 전화번호 유저를 ADMIN으로 설정
        userRepository.findByPhone("01089514449").ifPresent(user -> {
            if (user.getRole() != User.Role.ADMIN) {
                user.setRole(User.Role.ADMIN);
                userRepository.save(user);
                log.info("01089514449 유저를 ADMIN으로 설정 완료");
            }
        });

        if (teamRepository.count() > 0 || userRepository.count() > 1) {
            log.info("데이터가 이미 존재합니다. 초기화를 건너뜁니다.");
            return;
        }

        log.info("테스트 데이터 초기화 시작...");

        // 테스트 유저 생성
        User adminUser = User.builder()
                .username("admin")
                .email("admin@stage.com")
                .password(passwordEncoder.encode("admin1234"))
                .name("관리자")
                .phone("010-1234-5678")
                .role(User.Role.ADMIN)
                .build();
        userRepository.save(adminUser);

        User managerUser = User.builder()
                .username("manager")
                .email("manager@stage.com")
                .password(passwordEncoder.encode("manager1234"))
                .name("일정관리자")
                .phone("010-2345-6789")
                .role(User.Role.MANAGER)
                .build();
        userRepository.save(managerUser);

        User normalUser = User.builder()
                .username("user")
                .email("user@stage.com")
                .password(passwordEncoder.encode("user1234"))
                .name("일반회원")
                .phone("010-3456-7890")
                .role(User.Role.USER)
                .build();
        userRepository.save(normalUser);

        // 팀 생성 (아티스트 목록)
        List<Team> teams = List.of(
                Team.builder()
                        .name("나이트멜로")
                        .description("감성 인디 밴드")
                        .genre("인디")
                        .imageUrl("https://picsum.photos/seed/nightmelo/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("미루하")
                        .description("신예 여성 솔로")
                        .genre("발라드")
                        .imageUrl("https://picsum.photos/seed/miruha/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("사이버네틱스")
                        .description("일렉트로닉 유닛")
                        .genre("일렉트로닉")
                        .imageUrl("https://picsum.photos/seed/cybernetics/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("17Hz.")
                        .description("지하아이돌 그룹")
                        .genre("아이돌")
                        .imageUrl("https://picsum.photos/seed/17hz/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("하늘빛소녀")
                        .description("청순 아이돌")
                        .genre("아이돌")
                        .imageUrl("https://picsum.photos/seed/skyblue/400/600")
                        .owner(managerUser)
                        .build()
        );
        teamRepository.saveAll(teams);

        // 샘플 일정 생성
        Schedule schedule1 = Schedule.builder()
                .manager(managerUser)
                .title("LIVE in SETi Vol.73")
                .organizer("SETi")
                .date(LocalDate.now().plusDays(7))
                .venue("홍대 클럽 FF")
                .advancePrice(BigDecimal.valueOf(15000))
                .doorPrice(BigDecimal.valueOf(20000))
                .capacity(100)
                .description("지하아이돌 합동 공연!\n\n주의사항:\n- 음식물 반입 금지\n- 공연 중 촬영 금지")
                .isPublished(true)
                .build();

        // 타임슬롯 추가
        schedule1.getTimeSlots().add(TimeSlot.builder()
                .schedule(schedule1)
                .startTime(LocalTime.of(18, 50))
                .endTime(LocalTime.of(19, 10))
                .teamName("나이트멜로")
                .build());
        schedule1.getTimeSlots().add(TimeSlot.builder()
                .schedule(schedule1)
                .startTime(LocalTime.of(19, 10))
                .endTime(LocalTime.of(19, 30))
                .teamName("미루하")
                .build());
        schedule1.getTimeSlots().add(TimeSlot.builder()
                .schedule(schedule1)
                .startTime(LocalTime.of(19, 30))
                .endTime(LocalTime.of(19, 50))
                .teamName("사이버네틱스")
                .build());
        schedule1.getTimeSlots().add(TimeSlot.builder()
                .schedule(schedule1)
                .startTime(LocalTime.of(19, 50))
                .endTime(LocalTime.of(20, 10))
                .teamName("17Hz.")
                .description("특전권 구매 가능")
                .build());
        schedule1.getTimeSlots().add(TimeSlot.builder()
                .schedule(schedule1)
                .startTime(LocalTime.of(20, 10))
                .endTime(LocalTime.of(20, 30))
                .teamName("하늘빛소녀")
                .build());

        scheduleRepository.save(schedule1);

        log.info("테스트 데이터 초기화 완료!");
        log.info("생성된 팀 수: {}", teams.size());
        log.info("테스트 계정:");
        log.info("  - 관리자: admin / admin1234");
        log.info("  - 일정관리자: manager / manager1234");
        log.info("  - 일반회원: user / user1234");
    }
}
