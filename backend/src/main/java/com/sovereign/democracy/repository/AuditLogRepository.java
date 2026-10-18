package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop50ByOrderByTimestampDesc();
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    long countByActionAndTimestampBetween(String action, java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByActionInAndTimestampBetween(List<String> actions, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
