package com.honestroom.dto;

import com.honestroom.entity.RoomStatus;

import java.time.Instant;

public record RoomDto(
        Long id,
        String title,
        String description,
        String publicToken,
        RoomStatus status,
        long feedbackCount,
        long newFeedbackCount,
        long reviewedFeedbackCount,
        long resolvedFeedbackCount,
        Instant createdAt,
        Instant updatedAt
) {
}
