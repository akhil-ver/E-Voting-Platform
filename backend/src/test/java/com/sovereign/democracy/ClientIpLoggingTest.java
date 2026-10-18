package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.LoginRequest;
import com.sovereign.democracy.entity.AuditLog;
import com.sovereign.democracy.repository.AuditLogRepository;
import com.sovereign.democracy.util.ClientIpUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ClientIpLoggingTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("Verify loopback detection identifies all local addresses")
    void testLoopbackIdentification() {
        assertThat(ClientIpUtil.isLoopback("127.0.0.1")).isTrue();
        assertThat(ClientIpUtil.isLoopback("0:0:0:0:0:0:0:1")).isTrue();
        assertThat(ClientIpUtil.isLoopback("::1")).isTrue();
        assertThat(ClientIpUtil.isLoopback("localhost")).isTrue();
        assertThat(ClientIpUtil.isLoopback(null)).isTrue();
        assertThat(ClientIpUtil.isLoopback("   ")).isTrue();

        assertThat(ClientIpUtil.isLoopback("10.195.254.116")).isFalse();
        assertThat(ClientIpUtil.isLoopback("192.168.1.100")).isFalse();
        assertThat(ClientIpUtil.isLoopback("203.0.113.1")).isFalse();
    }

    @Test
    @DisplayName("Verify getClientIp resolves loopback to host IP 10.195.254.116")
    void testLoopbackResolvesToHostIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");

        String ip = ClientIpUtil.getClientIp(request);
        assertThat(ip).isEqualTo(ClientIpUtil.DEFAULT_HOST_IP);

        MockHttpServletRequest requestIpv6 = new MockHttpServletRequest();
        requestIpv6.setRemoteAddr("0:0:0:0:0:0:0:1");
        assertThat(ClientIpUtil.getClientIp(requestIpv6)).isEqualTo(ClientIpUtil.DEFAULT_HOST_IP);
    }

    @Test
    @DisplayName("Verify getClientIp preserves remote system IP addresses from external clients")
    void testRemoteIpPreserved() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.29.50");

        String ip = ClientIpUtil.getClientIp(request);
        assertThat(ip).isEqualTo("192.168.29.50");

        // Test with X-Forwarded-For header
        MockHttpServletRequest proxiedRequest = new MockHttpServletRequest();
        proxiedRequest.setRemoteAddr("127.0.0.1");
        proxiedRequest.addHeader("X-Forwarded-For", "203.0.113.88, 10.0.0.1");

        String proxiedIp = ClientIpUtil.getClientIp(proxiedRequest);
        assertThat(proxiedIp).isEqualTo("203.0.113.88");
    }

    @Test
    @DisplayName("Verify audit log records 10.195.254.116 for local logins")
    void testAuditLogRecordsHostIpForLocalLogin() throws Exception {
        LoginRequest login = new LoginRequest("ADMIN-001", "admin123");

        mockMvc.perform(post("/api/auth/login")
                        .with(req -> {
                            req.setRemoteAddr("127.0.0.1");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk());

        List<AuditLog> logs = auditLogRepository.findTop50ByOrderByTimestampDesc();
        assertThat(logs).isNotEmpty();
        AuditLog latestLogin = logs.stream()
                .filter(l -> "LOGIN_SUCCESS".equals(l.getAction()) && "ADMIN-001".equals(l.getActorUsername()))
                .findFirst()
                .orElse(null);

        assertThat(latestLogin).isNotNull();
        assertThat(latestLogin.getIpAddress()).isEqualTo(ClientIpUtil.DEFAULT_HOST_IP);
    }

    @Test
    @DisplayName("Verify audit log records remote system IP when external device logs in")
    void testAuditLogRecordsRemoteIpForExternalDevice() throws Exception {
        LoginRequest login = new LoginRequest("ADMIN-001", "admin123");
        String externalDeviceIp = "192.168.1.77";

        mockMvc.perform(post("/api/auth/login")
                        .with(req -> {
                            req.setRemoteAddr("127.0.0.1");
                            req.addHeader("X-Forwarded-For", externalDeviceIp);
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk());

        List<AuditLog> logs = auditLogRepository.findTop50ByOrderByTimestampDesc();
        assertThat(logs).isNotEmpty();
        AuditLog latestLogin = logs.stream()
                .filter(l -> "LOGIN_SUCCESS".equals(l.getAction()) && externalDeviceIp.equals(l.getIpAddress()))
                .findFirst()
                .orElse(null);

        assertThat(latestLogin).isNotNull();
        assertThat(latestLogin.getIpAddress()).isEqualTo(externalDeviceIp);
    }
}
