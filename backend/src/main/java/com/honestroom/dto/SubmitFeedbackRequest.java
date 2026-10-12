package com.honestroom.dto;

import com.honestroom.entity.FeedbackCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitFeedbackRequest(
        @NotBlank(message = "Feedback message cannot be empty.")
        @Size(min = 3, max = 5000, message = "Feedback message must be between 3 and 5,000 characters.")
        String message,

        @NotNull(message = "Feedback category is required.")
        FeedbackCategory category,

        // Optional honeypot field for lightweight spam detection; legitimate users leave this empty
        String websiteUrl
) {
}
