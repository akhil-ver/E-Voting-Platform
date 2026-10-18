package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.AreaDto;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.AreaRepository;
import com.sovereign.democracy.repository.VoterRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AreaService {

    private final AreaRepository areaRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final AuditLogService auditLogService;

    public AreaService(AreaRepository areaRepository,
                       VoterRecordRepository voterRecordRepository,
                       AuditLogService auditLogService) {
        this.areaRepository = areaRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.auditLogService = auditLogService;
    }

    public List<AreaDto> getAllAreasWithStats() {
        return areaRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<AreaDto> getActiveAreas() {
        return areaRepository.findByActiveTrue().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public AreaDto getAreaById(Long id) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + id));
        return mapToDto(area);
    }

    @Transactional
    public AreaDto createArea(Area area, String adminUsername, String ipAddress) {
        if (areaRepository.existsByNameIgnoreCase(area.getName())) {
            throw new BadRequestException("An area with the name '" + area.getName() + "' already exists.");
        }
        if (areaRepository.existsByAreaCodeIgnoreCase(area.getAreaCode())) {
            throw new BadRequestException("An area with code '" + area.getAreaCode() + "' already exists.");
        }

        Area saved = areaRepository.save(area);
        auditLogService.logAction(adminUsername, "ADMIN", "CREATE_AREA", "Area:" + saved.getName(),
                "Created area " + saved.getName() + " (" + saved.getAreaCode() + ")", ipAddress);

        return mapToDto(saved);
    }

    @Transactional
    public AreaDto updateArea(Long id, Area updated, String adminUsername, String ipAddress) {
        Area existing = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + id));

        if (!existing.getName().equalsIgnoreCase(updated.getName()) && areaRepository.existsByNameIgnoreCase(updated.getName())) {
            throw new BadRequestException("Area name '" + updated.getName() + "' is already in use.");
        }

        existing.setName(updated.getName());
        existing.setConstituencyName(updated.getConstituencyName());
        existing.setElectionType(updated.getElectionType());
        existing.setDescription(updated.getDescription());
        existing.setActive(updated.isActive());

        Area saved = areaRepository.save(existing);
        auditLogService.logAction(adminUsername, "ADMIN", "UPDATE_AREA", "Area:" + saved.getName(),
                "Updated details for area " + saved.getName(), ipAddress);

        return mapToDto(saved);
    }

    @Transactional
    public void toggleAreaStatus(Long id, boolean active, String adminUsername, String ipAddress) {
        Area existing = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + id));
        existing.setActive(active);
        areaRepository.save(existing);

        auditLogService.logAction(adminUsername, "ADMIN", active ? "ACTIVATE_AREA" : "DEACTIVATE_AREA",
                "Area:" + existing.getName(), "Changed active status to " + active, ipAddress);
    }

    private AreaDto mapToDto(Area area) {
        long totalVoters = voterRecordRepository.countByArea(area);
        long registeredAccounts = voterRecordRepository.countByAreaAndHasRegisteredAccountTrue(area);

        return new AreaDto(
                area.getId(),
                area.getAreaCode(),
                area.getName(),
                area.getConstituencyName(),
                area.getElectionType(),
                area.getDescription(),
                area.isActive(),
                totalVoters,
                registeredAccounts
        );
    }
}
