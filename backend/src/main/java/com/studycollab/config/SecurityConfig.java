package com.studycollab.config;

import com.studycollab.config.properties.CorsProperties;
import com.studycollab.security.JwtAuthenticationFilter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
// Marks this class as a Spring configuration class for defining beans.
@EnableWebSecurity
// Enables Spring Security's web security support for the application.
@EnableConfigurationProperties(CorsProperties.class)
// Binds custom configuration properties defined in CorsProperties.
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsProperties corsProperties;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, CorsProperties corsProperties) {
        // Injects the custom JWT filter and CORS properties via constructor.
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsProperties = corsProperties;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Defines a BCrypt encoder bean for hashing and verifying user passwords.
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        // Exposes the AuthenticationManager bean from Spring Security's authentication configuration.
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Applies the custom CORS rules defined in the corsConfigurationSource bean.
                .csrf(AbstractHttpConfigurer::disable)
                // Disables CSRF protection since the application relies on stateless JWT authentication.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Configures session management to stateless (no HTTP server session created or used).
                .authorizeHttpRequests(auth -> auth
                                .requestMatchers("/api/auth/**", "/api/test/**", "/error", "/uploads/**").permitAll()
                                // Publicly allows requests matching specific endpoints (e.g., login, static uploads).
                                .anyRequest().authenticated()
                        // Enforces authentication requirement for all other incoming requests.
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        // Inserts the JWT filter ahead of the default username/password filter in the security chain.

        return http.build();
        // Constructs and returns the configured SecurityFilterChain.
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Instantiates a new CORS configuration object.
        configuration.setAllowedOrigins(corsProperties.allowedOrigins());
        // Sets permitted origin URLs from externalized properties.
        configuration.setAllowedMethods(corsProperties.allowedMethods());
        // Sets permitted HTTP methods (GET, POST, etc.) from externalized properties.
        configuration.setAllowedHeaders(corsProperties.allowedHeaders());
        // Sets permitted HTTP headers from externalized properties.
        configuration.setAllowCredentials(corsProperties.allowCredentials());
        // Enables or disables cross-origin credential sharing (cookies, HTTP auth).

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Instantiates a URL-pattern-based CORS configuration registry.
        source.registerCorsConfiguration("/**", configuration);
        // Maps the configured CORS policy to all application endpoints.
        return source;
        // Returns the configured CorsConfigurationSource bean.
    }
}