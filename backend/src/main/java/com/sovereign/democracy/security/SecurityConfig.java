package com.sovereign.democracy.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints
                .requestMatchers("/api/auth/**").permitAll()
                // Public view endpoints
                .requestMatchers(HttpMethod.GET, "/api/areas/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/voters/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/elections").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/elections/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/elections/*/results").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/candidates/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/results/public/**").permitAll()
                .requestMatchers("/api/verify/**").permitAll()
                // H2 console for test profile
                .requestMatchers("/h2-console/**").permitAll()
                // Admin specific endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/elections/*/voter-participation").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/elections/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/elections/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/elections/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/candidates/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/candidates/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/candidates/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/areas/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/areas/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/areas/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/voters/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/voters/**").hasRole("ADMIN")
                // User voting operations
                .requestMatchers("/api/voting/**").hasAnyRole("USER", "ADMIN")
                // All other requests require authentication
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
