package com.studycollab.security;

import com.studycollab.repository.auth.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
// Marks this class as a Spring service bean responsible for user authentication lookups.
public class CustomUserDetailsService implements UserDetailsService {
// Implements Spring Security's UserDetailsService interface to customize user retrieval.

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        // Injects the UserRepository instance via constructor injection.
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Overrides method to fetch user credentials and roles from the database using email.
        return userRepository.findByEmail(email)
                // Queries database repository for a user record matching the given email.
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        // Throws UsernameNotFoundException if no user matching the email is found.
    }
}