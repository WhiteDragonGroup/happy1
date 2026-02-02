package com.stage.backend.repository;

import com.stage.backend.entity.ManagerRequest;
import com.stage.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ManagerRequestRepository extends JpaRepository<ManagerRequest, Long> {
    List<ManagerRequest> findByUserOrderByCreatedAtDesc(User user);
    List<ManagerRequest> findAllByOrderByCreatedAtDesc();
    List<ManagerRequest> findByStatusOrderByCreatedAtDesc(ManagerRequest.Status status);
    Optional<ManagerRequest> findByUserAndStatus(User user, ManagerRequest.Status status);
}
