package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.AnomalyAlert;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.AnomalyReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnomalyAlertRepository extends JpaRepository<AnomalyAlert, Long> {

    List<AnomalyAlert> findByElectionOrderByObservationTimestampDesc(Election election);

    Page<AnomalyAlert> findByElectionOrderByObservationTimestampDesc(Election election, Pageable pageable);

    Page<AnomalyAlert> findByReviewStatusOrderByObservationTimestampDesc(AnomalyReviewStatus reviewStatus, Pageable pageable);

    Page<AnomalyAlert> findAllByOrderByObservationTimestampDesc(Pageable pageable);

    Optional<AnomalyAlert> findTopByElectionOrderByObservationTimestampDesc(Election election);

    boolean existsByElectionAndObservationTimestampBetween(Election election, LocalDateTime start, LocalDateTime end);

    long countByReviewStatus(AnomalyReviewStatus reviewStatus);
}
