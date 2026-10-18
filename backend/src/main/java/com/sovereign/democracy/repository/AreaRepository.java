package com.sovereign.democracy.repository;

import com.sovereign.democracy.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AreaRepository extends JpaRepository<Area, Long> {
    Optional<Area> findByNameIgnoreCase(String name);
    Optional<Area> findByAreaCodeIgnoreCase(String areaCode);
    List<Area> findByActiveTrue();
    boolean existsByNameIgnoreCase(String name);
    boolean existsByAreaCodeIgnoreCase(String areaCode);
}
