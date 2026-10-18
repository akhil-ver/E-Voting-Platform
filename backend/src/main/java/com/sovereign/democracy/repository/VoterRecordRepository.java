package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.VoterRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoterRecordRepository extends JpaRepository<VoterRecord, Long> {
    Optional<VoterRecord> findByVoterIdIgnoreCase(String voterId);
    List<VoterRecord> findByArea(Area area);
    List<VoterRecord> findByAreaId(Long areaId);
    boolean existsByVoterIdIgnoreCase(String voterId);
    long countByArea(Area area);
    long countByAreaAndHasRegisteredAccountTrue(Area area);
    long countByHasRegisteredAccountTrue();

    @Query("SELECT v FROM VoterRecord v WHERE " +
           "(:areaId IS NULL OR v.area.id = :areaId) AND " +
           "(:search IS NULL OR LOWER(v.voterId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<VoterRecord> findFiltered(@Param("areaId") Long areaId, @Param("search") String search, Pageable pageable);
}
