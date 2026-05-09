package com.trackflow.module.user.service;

import com.trackflow.module.user.dto.CreateUserRequest;
import com.trackflow.module.user.dto.UserResponse;
import com.trackflow.module.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    UserResponse getUserById(UUID id);

    Page<UserResponse> getAllUsers(Pageable pageable);

    void updateUserRole(UUID id, UserRole role);

    void updateUserStatus(UUID id, boolean isActive);
}
