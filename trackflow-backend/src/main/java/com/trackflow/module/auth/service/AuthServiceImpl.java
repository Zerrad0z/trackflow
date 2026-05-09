package com.trackflow.module.auth.service;

import com.trackflow.common.exception.InvalidCredentialsException;
import com.trackflow.module.auth.dto.LoginRequest;
import com.trackflow.module.auth.dto.LoginResponse;
import com.trackflow.module.auth.security.JwtUtils;
import com.trackflow.module.user.dto.UserMapper;
import com.trackflow.module.user.dto.UserResponse;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        String token = jwtUtils.generateToken(user);

        return new LoginResponse(
                token,
                userMapper.toResponse(user)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        User user = (User) authentication.getPrincipal();

        return userMapper.toResponse(user);
    }

}
