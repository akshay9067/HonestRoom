package com.honestroom.service;

import com.honestroom.dto.AuthResponse;
import com.honestroom.dto.LoginRequest;
import com.honestroom.dto.RegisterRequest;
import com.honestroom.dto.UserDto;
import com.honestroom.entity.User;
import com.honestroom.exception.BadRequestException;
import com.honestroom.exception.ConflictException;
import com.honestroom.exception.UnauthorizedException;
import com.honestroom.repository.UserRepository;
import com.honestroom.security.JwtTokenProvider;
import com.honestroom.util.SanitizationUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String name = SanitizationUtil.cleanText(request.name());
        String email = SanitizationUtil.cleanText(request.email());
        String password = request.password();

        if (name == null || name.length() < 2) {
            throw new BadRequestException("Full name must be at least 2 characters long.");
        }
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email address is required.");
        }
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("An account with this email address already exists.");
        }
        if (password == null || password.length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters long.");
        }

        String passwordHash = passwordEncoder.encode(password);
        User user = new User(name, normalizedEmail, passwordHash);
        User savedUser = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail());
        return new AuthResponse(
                token,
                "Bearer",
                jwtTokenProvider.getExpirationMs(),
                toUserDto(savedUser)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = SanitizationUtil.cleanText(request.email());
        String password = request.password();

        if (email == null || password == null) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        User user = userRepository.findByEmailIgnoreCase(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(
                token,
                "Bearer",
                jwtTokenProvider.getExpirationMs(),
                toUserDto(user)
        );
    }

    public static UserDto toUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
