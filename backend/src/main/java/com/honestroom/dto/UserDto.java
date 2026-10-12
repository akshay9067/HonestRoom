package com.honestroom.dto;

import java.time.Instant;

public record UserDto(
        Long id,
        String name,
        String email,
        Instant createdAt,
        Instant updatedAt
) {
}
