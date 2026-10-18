package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.SecretVotingKey;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.enums.SecretKeyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SecretVotingKeyRepository extends JpaRepository<SecretVotingKey, Long> {

    Optional<SecretVotingKey> findTopByElectionAndVoterRecordAndStatusOrderByIssuedAtDesc(
            Election election, VoterRecord voterRecord, SecretKeyStatus status
    );

    List<SecretVotingKey> findByElectionAndVoterRecordOrderByIssuedAtDesc(
            Election election, VoterRecord voterRecord
    );

    @Modifying
    @Query("UPDATE SecretVotingKey s SET s.status = :newStatus, s.consumedAt = :consumedAt " +
           "WHERE s.id = :id AND s.status = :expectedStatus")
    int consumeKeyAtomically(
            @Param("id") Long id,
            @Param("expectedStatus") SecretKeyStatus expectedStatus,
            @Param("newStatus") SecretKeyStatus newStatus,
            @Param("consumedAt") LocalDateTime consumedAt
    );
}
