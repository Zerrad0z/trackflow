package com.trackflow.module.user.service;

import com.trackflow.common.exception.DuplicateEmailException;
import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.module.user.dto.CreateUserRequest;
import com.trackflow.module.user.dto.UserMapper;
import com.trackflow.module.user.dto.UserResponse;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import com.trackflow.module.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserMapper userMapper;
    @Mock private JavaMailSender mailSender;

    @InjectMocks private UserServiceImpl userService;

    private User existingUser;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Amine Supervisor")
                .email("amine@trackflow.com")
                .password("hashed_password")
                .role(UserRole.FIELD_SUPERVISOR)
                .isActive(true)
                .firstLoginDone(true)
                .build();

        userResponse = new UserResponse(
                existingUser.getId(),
                existingUser.getFullName(),
                existingUser.getEmail(),
                existingUser.getRole(),
                existingUser.getIsActive(),
                existingUser.getCreatedAt()
        );
    }

    @Test
    void createUser_withNewEmail_shouldSucceed() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest(
                "New User", "new@trackflow.com", null, UserRole.FIELD_SUPERVISOR);

        when(userRepository.existsByEmail("new@trackflow.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed_password");
        when(userRepository.save(any())).thenReturn(existingUser);
        when(userMapper.toResponse(any())).thenReturn(userResponse);
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        // Act
        UserResponse response = userService.createUser(request);

        // Assert
        assertThat(response).isNotNull();
        verify(userRepository).save(any(User.class));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void createUser_withDuplicateEmail_shouldThrowException() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest(
                "Amine", "amine@trackflow.com", null, UserRole.FIELD_SUPERVISOR);
        when(userRepository.existsByEmail("amine@trackflow.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(DuplicateEmailException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_withValidUser_shouldUpdateHash() {
        // Arrange
        when(userRepository.findById(existingUser.getId()))
                .thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("newpassword123"))
                .thenReturn("new_hashed_password");
        when(userRepository.save(any())).thenReturn(existingUser);

        // Act
        userService.resetPassword(existingUser.getId(), "newpassword123");

        // Assert
        assertThat(existingUser.getPassword()).isEqualTo("new_hashed_password");
        verify(userRepository).save(existingUser);
    }

    @Test
    void resetPassword_withUnknownUser_shouldThrowException() {
        // Arrange
        UUID unknownId = UUID.randomUUID();
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userService.resetPassword(unknownId, "newpassword"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

}