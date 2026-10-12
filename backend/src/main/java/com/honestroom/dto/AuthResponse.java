package com.honestroom.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserDto user
) {
}
