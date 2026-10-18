package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
    Optional<UserAccount> findByRecoveryEmailIgnoreCase(String recoveryEmail);
    Optional<UserAccount> findByUsernameIgnoreCaseOrRecoveryEmailIgnoreCase(String username, String recoveryEmail);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByVoterRecord(VoterRecord voterRecord);
    long countByRole(Role role);
}
