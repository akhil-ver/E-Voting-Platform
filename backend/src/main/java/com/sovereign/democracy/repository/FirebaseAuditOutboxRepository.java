package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.FirebaseAuditOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FirebaseAuditOutboxRepository extends JpaRepository<FirebaseAuditOutbox, Long> {

    Optional<FirebaseAuditOutbox> findByEventId(String eventId);

    List<FirebaseAuditOutbox> findByStatus(String status);

    List<FirebaseAuditOutbox> findByStatusOrderByCreatedAtAsc(String status, Pageable pageable);

    @Query("SELECT COUNT(o) FROM FirebaseAuditOutbox o WHERE o.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT o FROM FirebaseAuditOutbox o ORDER BY o.createdAt DESC")
    List<FirebaseAuditOutbox> findRecentOutbox(Pageable pageable);
}
