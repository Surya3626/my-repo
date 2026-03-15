package com.example.devtrack.config;

import com.example.devtrack.security.JwtAuthenticationFilter;
import com.example.devtrack.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/auth/login", "/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/bug-report").hasAnyRole("TEST_ADMIN", "ADMIN")
                        .requestMatchers("/bug-manager").hasAnyRole("TESTING", "ADMIN")
                        .requestMatchers("/my-tasks").hasAnyRole("DEVELOPER", "ADMIN")
                        .requestMatchers("/my-bugs").hasAnyRole("DEVELOPER", "ADMIN")
                        .requestMatchers("/task/**").hasAnyRole("DEVELOPER", "ADMIN")
                        .requestMatchers("/bug/**").hasAnyRole("TESTING", "DEVELOPER", "ADMIN")
                        .requestMatchers("/cr/**").hasAnyRole("TESTING", "DEVELOPER", "ADMIN", "TEST_ADMIN")
                        .requestMatchers("/").authenticated()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .formLogin(form -> form.disable()) // Disable default form login as we use custom controller
                .logout(logout -> logout.disable()); // Disable default logout

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance(); // For simplicity as per requirements, use BCrypt in production
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
