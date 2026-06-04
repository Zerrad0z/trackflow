package com.trackflow.module.user.repository;

import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
}
