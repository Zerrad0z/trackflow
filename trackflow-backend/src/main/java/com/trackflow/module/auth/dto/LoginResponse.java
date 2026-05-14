package com.trackflow.module.auth.dto;


import com.trackflow.module.user.dto.UserResponse;

public record LoginResponse(
        String token,
        UserResponse user
) {}




