package com.honestroom.dto;

import java.time.Instant;

public record ResponseDto(
        Long id,
        Long feedbackId,
        String ownerName,
        String message,
        Instant createdAt,
        Instant updatedAt
) {
}
