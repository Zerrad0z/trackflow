package com.trackflow.module.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "users")
public class User {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    String fullName;

    @Column(nullable = false, unique = true)
    String email;

    @Column(name = "password_hash", nullable = false)
    String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    UserRole role;

    @Column(nullable = false)
    Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    LocalDateTime updatedAt = LocalDateTime.now();
}
