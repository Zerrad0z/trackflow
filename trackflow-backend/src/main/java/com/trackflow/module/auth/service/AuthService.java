package com.trackflow.module.auth.service;

import com.trackflow.module.auth.dto.LoginRequest;
import com.trackflow.module.auth.dto.LoginResponse;
import com.trackflow.module.user.dto.UserResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    UserResponse getProfile();
}
