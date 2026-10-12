package com.honestroom.dto;

import com.honestroom.entity.FeedbackCategory;

public record CategoryCountDto(
        FeedbackCategory category,
        long count
) {
}
