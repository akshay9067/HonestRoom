package com.honestroom.dto;

import java.util.List;

public record DashboardSummaryDto(
        long totalRooms,
        long openRooms,
        long closedRooms,
        long totalFeedback,
        long pendingFeedback,
        long newFeedback,
        long reviewedFeedback,
        long resolvedFeedback,
        List<RoomDto> recentRooms,
        List<CategoryCountDto> categoryBreakdown,
        List<DailyActivityDto> activityTimeline
) {
}
