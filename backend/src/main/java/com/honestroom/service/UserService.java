package com.honestroom.service;

import com.honestroom.dto.ChangePasswordRequest;
import com.honestroom.dto.UpdateProfileRequest;
import com.honestroom.dto.UserDto;
import com.honestroom.entity.User;
import com.honestroom.exception.BadRequestException;
import com.honestroom.exception.ResourceNotFoundException;
import com.honestroom.repository.UserRepository;
import com.honestroom.util.SanitizationUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(Long userId) {
        User user = getUserEntity(userId);
        return AuthService.toUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserEntity(userId);
        String cleanName = SanitizationUtil.cleanText(request.name());
        if (cleanName == null || cleanName.length() < 2) {
            throw new BadRequestException("Full name must be between 2 and 100 characters.");
        }
        user.setName(cleanName);
        User saved = userRepository.save(user);
        return AuthService.toUserDto(saved);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserEntity(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (request.newPassword() == null || request.newPassword().length() < 8) {
            throw new BadRequestException("New password must be at least 8 characters long.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from your current password.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getUserEntity(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
    }
}
