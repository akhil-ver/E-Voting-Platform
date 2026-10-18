package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.ElectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ElectionRepository extends JpaRepository<Election, Long> {
    Optional<Election> findByElectionCodeIgnoreCase(String electionCode);
    List<Election> findByArea(Area area);
    List<Election> findByAreaId(Long areaId);
    List<Election> findByStatus(ElectionStatus status);
    long countByStatus(ElectionStatus status);
}
