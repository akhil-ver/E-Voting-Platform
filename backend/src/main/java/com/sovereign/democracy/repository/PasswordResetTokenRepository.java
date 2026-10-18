package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.PasswordResetToken;
import com.sovereign.democracy.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findByUserAccountAndUsedAtIsNull(UserAccount userAccount);

    @Query("SELECT p FROM PasswordResetToken p WHERE p.userAccount = :userAccount AND p.usedAt IS NULL AND p.expiresAt > :now")
    List<PasswordResetToken> findActiveTokensByUser(@Param("userAccount") UserAccount userAccount, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.usedAt = :usedAt WHERE p.userAccount = :userAccount AND p.usedAt IS NULL")
    int invalidateAllActiveTokensForUser(@Param("userAccount") UserAccount userAccount, @Param("usedAt") LocalDateTime usedAt);

    long countByUserAccountAndCreatedAtAfter(UserAccount userAccount, LocalDateTime after);
}
