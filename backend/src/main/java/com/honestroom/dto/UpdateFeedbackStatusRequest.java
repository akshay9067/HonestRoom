package com.honestroom.dto;

import com.honestroom.entity.FeedbackStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateFeedbackStatusRequest(
        @NotNull(message = "Feedback status is required.")
        FeedbackStatus status
) {
}
