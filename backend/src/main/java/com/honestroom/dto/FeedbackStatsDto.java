package com.honestroom.dto;

public record FeedbackStatsDto(
        Long roomId,
        long total,
        long newCount,
        long reviewedCount,
        long resolvedCount,
        long suggestionCount,
        long appreciationCount,
        long concernCount,
        long generalCount
) {
}
