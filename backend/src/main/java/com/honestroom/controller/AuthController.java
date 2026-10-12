package com.honestroom.controller;

import com.honestroom.dto.AuthResponse;
import com.honestroom.dto.LoginRequest;
import com.honestroom.dto.RegisterRequest;
import com.honestroom.security.JwtTokenProvider;
import com.honestroom.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(AuthService authService, JwtTokenProvider jwtTokenProvider) {
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.register(request);
        attachJwtCookie(response, authResponse.accessToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authService.login(request);
        attachJwtCookie(response, authResponse.accessToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        ResponseCookie clearCookie = ResponseCookie.from(jwtTokenProvider.getCookieName(), "")
                .httpOnly(true)
                .secure(jwtTokenProvider.isCookieSecure())
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    private void attachJwtCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(jwtTokenProvider.getCookieName(), token)
                .httpOnly(true)
                .secure(jwtTokenProvider.isCookieSecure())
                .path("/")
                .maxAge(Duration.ofMillis(jwtTokenProvider.getExpirationMs()))
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
