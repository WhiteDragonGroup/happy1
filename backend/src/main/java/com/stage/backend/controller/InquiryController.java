package com.stage.backend.controller;

import com.stage.backend.entity.Inquiry;
import com.stage.backend.entity.User;
import com.stage.backend.repository.InquiryRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryRepository inquiryRepository;

    @GetMapping
    public ResponseEntity<List<Inquiry>> getMyInquiries(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(inquiryRepository.findByUserOrderByCreatedAtDesc(user));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Inquiry>> getAllInquiries(@AuthenticationPrincipal User user) {
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }
        List<Inquiry> inquiries = inquiryRepository.findAllByOrderByCreatedAtDesc();
        inquiries.forEach(inq -> {
            if (inq.getUser() != null) {
                inq.setUserName(inq.getUser().getName());
                inq.setUserEmail(inq.getUser().getEmail());
            }
        });
        return ResponseEntity.ok(inquiries);
    }

    @PostMapping
    public ResponseEntity<Inquiry> create(@RequestBody InquiryRequest request,
                                          @AuthenticationPrincipal User user) {
        Inquiry inquiry = Inquiry.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .build();
        return ResponseEntity.ok(inquiryRepository.save(inquiry));
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<Inquiry> answer(@PathVariable Long id,
                                          @RequestBody AnswerRequest request,
                                          @AuthenticationPrincipal User user) {
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        return inquiryRepository.findById(id)
                .map(inquiry -> {
                    inquiry.setAnswer(request.getAnswer());
                    inquiry.setStatus(Inquiry.Status.ANSWERED);
                    inquiry.setAnsweredAt(LocalDateTime.now());
                    return ResponseEntity.ok(inquiryRepository.save(inquiry));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Data
    public static class InquiryRequest {
        private String title;
        private String content;
    }

    @Data
    public static class AnswerRequest {
        private String answer;
    }
}
