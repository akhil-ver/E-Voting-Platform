package com.sovereign.democracy.util;

import jakarta.servlet.http.HttpServletRequest;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

/**
 * Utility for resolving client IP addresses in audit logs and security telemetry.
 * Automatically resolves loopback requests to the local host's network IP (10.195.254.116)
 * while preserving actual remote IP addresses when requests originate from external systems.
 */
public final class ClientIpUtil {

    public static final String DEFAULT_HOST_IP = "10.195.254.116";

    private ClientIpUtil() {}

    /**
     * Resolves the real client IP address from the HTTP request.
     * Checks reverse proxy headers (X-Forwarded-For, X-Real-IP, etc.).
     * If the incoming request is from localhost / loopback (127.0.0.1, 0:0:0:0:0:0:0:1, ::1),
     * it resolves to the local host system's IP address (10.195.254.116).
     * If any other remote client connects from another device/system, their own remote IP is preserved.
     */
    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return getHostSystemIp();
        }

        String ip = null;
        String[] headerCandidates = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR"
        };

        for (String header : headerCandidates) {
            String headerVal = request.getHeader(header);
            if (headerVal != null && !headerVal.isBlank() && !"unknown".equalsIgnoreCase(headerVal)) {
                // In case of multiple proxies, take the first IP (originating client)
                ip = headerVal.split(",")[0].trim();
                break;
            }
        }

        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        if (isLoopback(ip)) {
            return getHostSystemIp();
        }

        return ip;
    }

    /**
     * Determines whether an IP represents localhost or a loopback interface.
     */
    public static boolean isLoopback(String ip) {
        if (ip == null || ip.isBlank()) {
            return true;
        }
        String trimmed = ip.trim();
        return trimmed.equals("127.0.0.1") ||
               trimmed.equals("0:0:0:0:0:0:0:1") ||
               trimmed.equals("::1") ||
               trimmed.equalsIgnoreCase("localhost");
    }

    /**
     * Finds the machine's active non-loopback IPv4 network address, defaulting to 10.195.254.116.
     */
    public static String getHostSystemIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface nif = interfaces.nextElement();
                if (nif.isLoopback() || !nif.isUp()) continue;
                Enumeration<InetAddress> addrs = nif.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        String host = addr.getHostAddress();
                        if (DEFAULT_HOST_IP.equals(host)) {
                            return DEFAULT_HOST_IP;
                        }
                    }
                }
            }

            Enumeration<NetworkInterface> interfaces2 = NetworkInterface.getNetworkInterfaces();
            while (interfaces2.hasMoreElements()) {
                NetworkInterface nif = interfaces2.nextElement();
                if (nif.isLoopback() || !nif.isUp()) continue;
                Enumeration<InetAddress> addrs = nif.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return DEFAULT_HOST_IP;
    }
}
