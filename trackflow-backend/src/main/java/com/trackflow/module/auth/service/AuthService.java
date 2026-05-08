package com.trackflow.module.auth.service;

import com.trackflow.module.auth.dto.LoginRequest;
import com.trackflow.module.auth.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}
