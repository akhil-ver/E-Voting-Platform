package com.sovereign.democracy.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.repository.UserAccountRepository;
import java.io.IOException;
import java.time.ZoneId;
import java.util.Date;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final UserAccountRepository userAccountRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   CustomUserDetailsService userDetailsService,
                                   UserAccountRepository userAccountRepository) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                Date issuedAt = tokenProvider.getIssuedAtFromToken(jwt);

                // Revocation check: verify token wasn't issued before password_changed_at
                UserAccount account = userAccountRepository.findByUsernameIgnoreCase(username).orElse(null);
                if (account != null && account.isEnabled()) {
                    if (account.getPasswordChangedAt() != null && issuedAt != null) {
                        long issuedEpoch = issuedAt.getTime();
                        long changedEpoch = account.getPasswordChangedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                        if (issuedEpoch < (changedEpoch - 1000)) {
                            logger.warn("Rejecting invalidated JWT issued prior to password change for user: " + username);
                            filterChain.doFilter(request, response);
                            return;
                        }
                    }

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
