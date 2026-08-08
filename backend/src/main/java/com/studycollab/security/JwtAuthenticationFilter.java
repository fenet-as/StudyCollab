package com.studycollab.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
// Registers this class as a Spring-managed component bean for security filtering.
public class JwtAuthenticationFilter extends OncePerRequestFilter {
// Extends OncePerRequestFilter to guarantee execution once per HTTP request lifecycle.

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    // Initializes the logger instance for logging filter errors and diagnostics.

    private static final String BEARER_PREFIX = "Bearer ";
    // Defines the standard prefix string expected in the HTTP Authorization header.

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserDetailsService userDetailsService) {
        // Injects dependencies needed to parse/validate tokens and load user security details.
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        // Intercepts incoming requests to perform JWT extraction and authentication setup.
        try {
            String jwt = getJwtFromRequest(request);
            // Extracts the raw token string from the request headers.

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // Checks if the token is present and validly signed and unexpired.

                String email = tokenProvider.getEmailFromJWT(jwt);
                // Retrieves the user's email/username claim stored inside the token payload.

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                // Fetches user account credentials and authorities from the database.

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                // Builds an authentication object containing user identity and granted roles.

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // Attaches web-specific request details like IP address and session ID to authentication.

                SecurityContextHolder.getContext().setAuthentication(authentication);
                // Stores the populated authentication object into Spring Security's context for current thread.
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
            // Logs any token parsing or user loading failures without halting the filter chain.
        }

        filterChain.doFilter(request, response);
        // Passes the request and response along to the next filter in the security chain.
    }





    private String getJwtFromRequest(HttpServletRequest request) {
        // Helper method to extract the JWT token from the HTTP Authorization header.

        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
        // Reads the raw value of the Authorization HTTP header.

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            // Verifies the header exists and starts with the "Bearer " prefix.

            return bearerToken.substring(BEARER_PREFIX.length());
            // Strips the "Bearer " prefix and returns only the clean token string.
        }

        return null;
        // Returns null if the header is missing or improperly formatted.
    }
}