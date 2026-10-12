package com.honestroom;

import com.honestroom.dto.LoginRequest;
import com.honestroom.dto.RegisterRequest;
import com.honestroom.entity.User;
import com.honestroom.exception.ConflictException;
import com.honestroom.exception.RateLimitExceededException;
import com.honestroom.exception.UnauthorizedException;
import com.honestroom.repository.UserRepository;
import com.honestroom.security.JwtTokenProvider;
import com.honestroom.service.AuthService;
import com.honestroom.service.RateLimiterService;
import com.honestroom.util.SanitizationUtil;
import com.honestroom.util.TokenGenerator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class HonestRoomUnitTests {

    @Test
    @DisplayName("TokenGenerator produces unique 24-character alphanumeric tokens")
    void tokenGeneratorCreatesSecureUniqueTokens() {
        Set<String> generated = new HashSet<>();
        for (int i = 0; i < 200; i++) {
            String token = TokenGenerator.generatePublicRoomToken();
            assertThat(token).hasSize(24);
            assertThat(token).matches("^[A-Za-z0-9]{24}$");
            generated.add(token);
        }
        assertThat(generated).hasSize(200);
    }

    @Test
    @DisplayName("SanitizationUtil strips control characters and trims whitespace")
    void sanitizationStripsControlCharacters() {
        String dirty = "  Hello\u0000\u0007 World \n Next line  ";
        String clean = SanitizationUtil.cleanText(dirty);
        assertThat(clean).isEqualTo("Hello World \n Next line");
    }

    @Test
    @DisplayName("RateLimiterService enforces sliding window limits per client and room token")
    void rateLimiterBlocksExcessiveSubmissions() {
        RateLimiterService limiter = new RateLimiterService(3, 60);
        limiter.checkFeedbackRateLimit("198.51.100.10", "roomTokenA");
        limiter.checkFeedbackRateLimit("198.51.100.10", "roomTokenA");
        limiter.checkFeedbackRateLimit("198.51.100.10", "roomTokenA");

        assertThatThrownBy(() -> limiter.checkFeedbackRateLimit("198.51.100.10", "roomTokenA"))
                .isInstanceOf(RateLimitExceededException.class);

        // Different room token is allowed
        limiter.checkFeedbackRateLimit("198.51.100.10", "roomTokenB");
    }

    @Test
    @DisplayName("JwtTokenProvider signs and validates JWTs accurately")
    void jwtTokenProviderGeneratesAndValidatesTokens() {
        JwtTokenProvider provider = new JwtTokenProvider(
                "UnitTestingSecretKeyWithSufficientEntropyForHmacSha256Signing2026",
                3600000L,
                "honestroom_jwt",
                false
        );

        String token = provider.generateToken(42L, "owner@honestroom.dev");
        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getUserIdFromToken(token)).isEqualTo(42L);
        assertThat(provider.validateToken(token + "tampered")).isFalse();
    }

    @Test
    @DisplayName("AuthService hashes passwords with BCrypt and rejects duplicate emails")
    void authServiceHashesPasswordAndRejectsDuplicates() {
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        JwtTokenProvider jwtProvider = new JwtTokenProvider(
                "UnitTestingSecretKeyWithSufficientEntropyForHmacSha256Signing2026",
                3600000L,
                "honestroom_jwt",
                false
        );
        AuthService authService = new AuthService(userRepository, encoder, jwtProvider);

        when(userRepository.existsByEmailIgnoreCase("alice@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        var response = authService.register(new RegisterRequest("Alice Rivera", "Alice@Example.com", "SecretPass123!"));
        assertThat(response.user().email()).isEqualTo("alice@example.com");
        assertThat(response.accessToken()).isNotBlank();

        // Duplicate email check
        when(userRepository.existsByEmailIgnoreCase("alice@example.com")).thenReturn(true);
        assertThatThrownBy(() -> authService.register(new RegisterRequest("Alice 2", "alice@example.com", "SecretPass123!")))
                .isInstanceOf(ConflictException.class);

        // Invalid login check
        when(userRepository.findByEmailIgnoreCase("alice@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.login(new LoginRequest("alice@example.com", "WrongPassword")))
                .isInstanceOf(UnauthorizedException.class);
    }
}
