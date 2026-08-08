// backend/src/main/java/com/studycollab/model/User.java
package com.studycollab.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Entity
// Marks this class as a JPA entity mapped to a database table.
@Table(name = "users")
// Specifies "users" as the database table name for this entity.
public class User implements UserDetails {
// Implements Spring Security's UserDetails interface to integrate user entity directly with authentication mechanisms.

    @Id
    // Defines this field as the primary key of the entity.
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // Configures auto-increment strategy for generating the primary key value.
    private Long id;

    @Column(nullable = false)
    // Maps field to a non-nullable column in the database table.
    private String fullName;

    @Column(unique = true, nullable = false)
    // Maps field to a unique, non-nullable column to prevent duplicate email registrations.
    private String email;

    @Column(nullable = false)
    // Maps field to a non-nullable column to store the hashed password.
    private String password;

    @Column(nullable = true)
    // Maps field to an optional column to store the URL or path of the user's profile avatar.
    private String avatarUrl;

    // Boilerplate Getters and Setters
    public Long getId() { return id; }
    // Returns the user's database ID.

    public String getFullName() { return fullName; }
    // Returns the user's full name.

    public void setFullName(String fullName) { this.fullName = fullName; }
    // Updates the user's full name.

    public String getEmail() { return email; }
    // Returns the user's email address.

    public void setEmail(String email) { this.email = email; }
    // Updates the user's email address.

    public String getAvatarUrl() { return avatarUrl; }
    // Returns the URL of the user's avatar image.

    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    // Updates the URL of the user's avatar image.

    @Override
    public String getPassword() { return password; }
    // Implements UserDetails method to retrieve the user's hashed password.

    public void setPassword(String password) { this.password = password; }
    // Updates the user's password.

    // UserDetails Interface Overrides
    @Override
    public String getUsername() { return email; }
    // Overrides UserDetails to use the email address as the unique authentication username.

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }
    // Returns an empty collection of authorities/roles (extendable for role-based access control).

    @Override public boolean isAccountNonExpired() { return true; }
    // Indicates the user account never expires.

    @Override public boolean isAccountNonLocked() { return true; }
    // Indicates the user account is not locked.

    @Override public boolean isCredentialsNonExpired() { return true; }
    // Indicates the user credentials (password) do not expire.

    @Override public boolean isEnabled() { return true; }
    // Indicates the user account is enabled and active.

    @OneToMany(mappedBy = "user")
    // Defines a one-to-many relationship mapping this user to their group memberships.
    @JsonIgnoreProperties("user")
    // Prevents infinite JSON serialization recursion loops by ignoring back-references to the user.
    private List<GroupMember> memberships;
}