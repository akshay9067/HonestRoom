package com.honestroom.service;

import com.honestroom.dto.CategoryCountDto;
import com.honestroom.dto.DailyActivityDto;
import com.honestroom.dto.DashboardSummaryDto;
import com.honestroom.dto.FeedbackDto;
import com.honestroom.dto.RoomDto;
import com.honestroom.entity.Feedback;
import com.honestroom.entity.FeedbackCategory;
import com.honestroom.entity.FeedbackResponse;
import com.honestroom.entity.FeedbackStatus;
import com.honestroom.entity.Room;
import com.honestroom.entity.RoomStatus;
import com.honestroom.repository.FeedbackRepository;
import com.honestroom.repository.ResponseRepository;
import com.honestroom.repository.RoomRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("MMM d");

    private final RoomRepository roomRepository;
    private final FeedbackRepository feedbackRepository;
    private final ResponseRepository responseRepository;
    private final RoomService roomService;

    public DashboardService(
            RoomRepository roomRepository,
            FeedbackRepository feedbackRepository,
            ResponseRepository responseRepository,
            RoomService roomService
    ) {
        this.roomRepository = roomRepository;
        this.feedbackRepository = feedbackRepository;
        this.responseRepository = responseRepository;
        this.roomService = roomService;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary(Long ownerId) {
        long totalRooms = roomRepository.countByOwnerId(ownerId);
        long openRooms = roomRepository.countByOwnerIdAndStatus(ownerId, RoomStatus.OPEN);
        long closedRooms = roomRepository.countByOwnerIdAndStatus(ownerId, RoomStatus.CLOSED);

        long totalFeedback = feedbackRepository.countByRoomOwnerId(ownerId);
        long newFeedback = feedbackRepository.countByRoomOwnerIdAndStatus(ownerId, FeedbackStatus.NEW);
        long reviewedFeedback = feedbackRepository.countByRoomOwnerIdAndStatus(ownerId, FeedbackStatus.REVIEWED);
        long resolvedFeedback = feedbackRepository.countByRoomOwnerIdAndStatus(ownerId, FeedbackStatus.RESOLVED);
        long pendingFeedback = newFeedback + reviewedFeedback;

        List<Room> ownerRooms = roomRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        List<RoomDto> recentRooms = ownerRooms.stream()
                .limit(5)
                .map(roomService::toRoomDto)
                .toList();

        List<CategoryCountDto> categoryBreakdown = Arrays.stream(FeedbackCategory.values())
                .map(cat -> new CategoryCountDto(
                        cat,
                        feedbackRepository.countByRoomOwnerIdAndCategory(ownerId, cat)
                ))
                .toList();

        List<DailyActivityDto> activityTimeline = computeActivityTimeline(ownerId);

        return new DashboardSummaryDto(
                totalRooms,
                openRooms,
                closedRooms,
                totalFeedback,
                pendingFeedback,
                newFeedback,
                reviewedFeedback,
                resolvedFeedback,
                recentRooms,
                categoryBreakdown,
                activityTimeline
        );
    }

    @Transactional(readOnly = true)
    public List<FeedbackDto> getRecentFeedback(Long ownerId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        List<Feedback> recent = feedbackRepository.findRecentByOwnerId(ownerId, PageRequest.of(0, safeLimit));
        List<Long> ids = recent.stream().map(Feedback::getId).toList();
        Map<Long, FeedbackResponse> responseMap = ids.isEmpty()
                ? Map.of()
                : responseRepository.findByFeedbackIdIn(ids).stream()
                        .collect(Collectors.toMap(r -> r.getFeedback().getId(), Function.identity()));

        return recent.stream()
                .map(f -> FeedbackService.toFeedbackDto(f, f.getRoom().getTitle(), responseMap.get(f.getId())))
                .toList();
    }

    private List<DailyActivityDto> computeActivityTimeline(Long ownerId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<LocalDate, Long> countsByDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            countsByDay.put(today.minusDays(i), 0L);
        }

        List<Feedback> recentItems = feedbackRepository.findRecentByOwnerId(ownerId, PageRequest.of(0, 500));
        for (Feedback item : recentItems) {
            if (item.getCreatedAt() != null) {
                LocalDate itemDate = item.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
                if (countsByDay.containsKey(itemDate)) {
                    countsByDay.put(itemDate, countsByDay.get(itemDate) + 1L);
                }
            }
        }

        List<DailyActivityDto> result = new ArrayList<>();
        for (Map.Entry<LocalDate, Long> entry : countsByDay.entrySet()) {
            result.add(new DailyActivityDto(entry.getKey().format(DAY_FORMATTER), entry.getValue()));
        }
        return result;
    }
}
