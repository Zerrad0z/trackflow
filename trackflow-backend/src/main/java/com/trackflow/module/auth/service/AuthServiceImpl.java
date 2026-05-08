package com.trackflow.module.auth.service;

import com.trackflow.common.exception.InvalidCredentialsException;
import com.trackflow.module.auth.dto.LoginRequest;
import com.trackflow.module.auth.dto.LoginResponse;
import com.trackflow.module.auth.security.JwtUtils;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    public LoginResponse login(LoginRequest request) {
        // 1. Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        // 2. Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        // 3. Generate JWT token with role
        String token = jwtUtils.generateToken(user);

        // 4. Return response DTO with role
        return new LoginResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
