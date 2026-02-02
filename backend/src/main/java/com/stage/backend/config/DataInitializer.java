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
    private final TimeSlotRepository timeSlotRepository;
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

        if (teamRepository.count() > 0) {
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

        // 팀 생성
        List<Team> teams = List.of(
                Team.builder()
                        .name("블랙핑크")
                        .description("세계적인 K-POP 걸그룹")
                        .genre("K-POP")
                        .imageUrl("https://picsum.photos/seed/blackpink/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("BTS")
                        .description("글로벌 아이콘 방탄소년단")
                        .genre("K-POP")
                        .imageUrl("https://picsum.photos/seed/bts/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("아이유")
                        .description("국민 솔로 가수")
                        .genre("발라드")
                        .imageUrl("https://picsum.photos/seed/iu/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("뉴진스")
                        .description("새로운 세대의 아이콘")
                        .genre("K-POP")
                        .imageUrl("https://picsum.photos/seed/newjeans/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("세븐틴")
                        .description("자체 제작 아이돌")
                        .genre("K-POP")
                        .imageUrl("https://picsum.photos/seed/seventeen/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("에스파")
                        .description("메타버스 걸그룹")
                        .genre("K-POP")
                        .imageUrl("https://picsum.photos/seed/aespa/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("스트레이키즈")
                        .description("자체 프로듀싱 그룹")
                        .genre("K-POP")
                        .imageUrl("https://picsum.photos/seed/straykids/400/600")
                        .owner(managerUser)
                        .build(),
                Team.builder()
                        .name("트와이스")
                        .description("아시아 원톱 걸그룹")
                        .genre("K-POP")
                        .imageUrl("https://picsum.photos/seed/twice/400/600")
                        .owner(managerUser)
                        .build()
        );
        teamRepository.saveAll(teams);

        // 1월 일정 생성
        LocalDate baseDate = LocalDate.of(2025, 1, 1);

        for (int day = 1; day <= 31; day++) {
            LocalDate scheduleDate = baseDate.plusDays(day - 1);

            // 각 날짜마다 1~3개의 랜덤 일정
            int scheduleCount = (day % 3) + 1;

            for (int i = 0; i < scheduleCount && i < teams.size(); i++) {
                Team team = teams.get((day + i) % teams.size());

                Schedule schedule = Schedule.builder()
                        .team(team)
                        .manager(managerUser)
                        .title(team.getName() + " 콘서트")
                        .date(scheduleDate)
                        .venue("올림픽공원 체조경기장")
                        .price(BigDecimal.valueOf(88000 + (day * 1000)))
                        .capacity(100)
                        .description("특별한 무대를 선사합니다.\n\n주의사항:\n- 음식물 반입 금지\n- 공연 중 촬영 금지")
                        .imageUrl("https://picsum.photos/seed/" + team.getName() + day + "/400/600")
                        .isPublished(true)
                        .build();
                scheduleRepository.save(schedule);

                // 타임슬롯 생성
                TimeSlot slot1 = TimeSlot.builder()
                        .schedule(schedule)
                        .startTime(LocalTime.of(14, 0))
                        .endTime(LocalTime.of(16, 0))
                        .capacity(50)
                        .build();
                timeSlotRepository.save(slot1);

                TimeSlot slot2 = TimeSlot.builder()
                        .schedule(schedule)
                        .startTime(LocalTime.of(19, 0))
                        .endTime(LocalTime.of(21, 0))
                        .capacity(50)
                        .build();
                timeSlotRepository.save(slot2);
            }
        }

        log.info("테스트 데이터 초기화 완료!");
        log.info("생성된 팀 수: {}", teams.size());
        log.info("테스트 계정:");
        log.info("  - 관리자: admin / admin1234");
        log.info("  - 일정관리자: manager / manager1234");
        log.info("  - 일반회원: user / user1234");
    }
}
