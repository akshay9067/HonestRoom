package com.honestroom.dto;

import java.time.Instant;

public record PublicFeedbackSubmittedDto(
        boolean submitted,
        String message,
        Instant submittedAt
) {
}
