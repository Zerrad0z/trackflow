package com.trackflow.module.auth.dto;

import com.trackflow.module.user.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class LoginResponse {

    private String token;
    private UUID id;
    private String fullName;
    private String email;
    private UserRole role;
}
