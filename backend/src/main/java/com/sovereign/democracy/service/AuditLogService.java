package com.sovereign.democracy.service;

import com.sovereign.democracy.entity.AuditLog;
import com.sovereign.democracy.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog logAction(String actorUsername, String role, String action, String target, String details, String ipAddress) {
        String resolvedIp = com.sovereign.democracy.util.ClientIpUtil.isLoopback(ipAddress) 
                ? com.sovereign.democracy.util.ClientIpUtil.getHostSystemIp() 
                : ipAddress;
        AuditLog log = new AuditLog(actorUsername, role, action, target, details, resolvedIp);
        return auditLogRepository.save(log);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
