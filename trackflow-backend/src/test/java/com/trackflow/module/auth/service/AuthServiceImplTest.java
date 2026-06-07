package com.trackflow.module.auth.service;

import com.trackflow.common.exception.InvalidCredentialsException;
import com.trackflow.module.auth.dto.LoginRequest;
import com.trackflow.module.auth.dto.LoginResponse;
import com.trackflow.module.auth.security.JwtUtils;
import com.trackflow.module.user.dto.UserMapper;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import com.trackflow.module.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtils jwtUtils;
    @Mock private UserMapper userMapper;

    @InjectMocks private AuthServiceImpl authService;

    private User activeUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Amine Supervisor")
                .email("amine@trackflow.com")
                .password("hashed_password")
                .role(UserRole.FIELD_SUPERVISOR)
                .isActive(true)
                .firstLoginDone(true)
                .build();

        inactiveUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Inactive User")
                .email("inactive@trackflow.com")
                .password("hashed_password")
                .role(UserRole.FIELD_SUPERVISOR)
                .isActive(false)
                .firstLoginDone(true)
                .build();
    }

    @Test
    void login_withValidCredentials_shouldReturnToken() {
        // Arrange
        LoginRequest request = new LoginRequest("amine@trackflow.com", "password123");
        when(userRepository.findByEmail("amine@trackflow.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("password123", "hashed_password"))
                .thenReturn(true);
        when(jwtUtils.generateToken(activeUser)).thenReturn("mock_jwt_token");

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("mock_jwt_token");
        verify(userRepository).findByEmail("amine@trackflow.com");
    }

    @Test
    void login_withWrongPassword_shouldThrowException() {
        // Arrange
        LoginRequest request = new LoginRequest("amine@trackflow.com", "wrongpassword");
        when(userRepository.findByEmail("amine@trackflow.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongpassword", "hashed_password"))
                .thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void login_withNonExistentEmail_shouldThrowException() {
        // Arrange
        LoginRequest request = new LoginRequest("nobody@trackflow.com", "password123");
        when(userRepository.findByEmail("nobody@trackflow.com"))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_withDeactivatedAccount_shouldThrowException() {
        // Arrange
        LoginRequest request = new LoginRequest("inactive@trackflow.com", "password123");
        when(userRepository.findByEmail("inactive@trackflow.com"))
                .thenReturn(Optional.of(inactiveUser));
        when(passwordEncoder.matches("password123", "hashed_password"))
                .thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void login_firstLoginShouldActivateUser() {
        // Arrange
        User newUser = User.builder()
                .id(UUID.randomUUID())
                .email("new@trackflow.com")
                .password("hashed_password")
                .role(UserRole.FIELD_SUPERVISOR)
                .isActive(false)
                .firstLoginDone(false)
                .build();

        LoginRequest request = new LoginRequest("new@trackflow.com", "password123");
        when(userRepository.findByEmail("new@trackflow.com"))
                .thenReturn(Optional.of(newUser));
        when(passwordEncoder.matches("password123", "hashed_password"))
                .thenReturn(true);
        when(jwtUtils.generateToken(newUser)).thenReturn("mock_token");

        // Act
        authService.login(request);

        // Assert — user should be activated
        assertThat(newUser.getIsActive()).isTrue();
        assertThat(newUser.getFirstLoginDone()).isTrue();
        verify(userRepository).save(newUser);
    }
}