package com.stage.backend.repository;

import com.stage.backend.entity.Inquiry;
import com.stage.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByUserOrderByCreatedAtDesc(User user);
    List<Inquiry> findAllByOrderByCreatedAtDesc();
}
