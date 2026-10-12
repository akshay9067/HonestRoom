package com.honestroom.dto;

import com.honestroom.entity.FeedbackCategory;
import com.honestroom.entity.FeedbackStatus;

import java.time.Instant;

public record FeedbackDto(
        Long id,
        Long roomId,
        String roomTitle,
        String message,
        FeedbackCategory category,
        FeedbackStatus status,
        Instant createdAt,
        Instant updatedAt,
        ResponseDto response
) {
}
