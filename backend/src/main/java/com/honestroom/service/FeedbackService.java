package com.honestroom.service;

import com.honestroom.dto.FeedbackDto;
import com.honestroom.dto.FeedbackStatsDto;
import com.honestroom.dto.PagedResponse;
import com.honestroom.dto.PublicFeedbackSubmittedDto;
import com.honestroom.dto.ResponseDto;
import com.honestroom.dto.SubmitFeedbackRequest;
import com.honestroom.dto.UpdateFeedbackStatusRequest;
import com.honestroom.entity.ActivityLog;
import com.honestroom.entity.Feedback;
import com.honestroom.entity.FeedbackCategory;
import com.honestroom.entity.FeedbackResponse;
import com.honestroom.entity.FeedbackStatus;
import com.honestroom.entity.Room;
import com.honestroom.entity.RoomStatus;
import com.honestroom.exception.BadRequestException;
import com.honestroom.exception.ForbiddenException;
import com.honestroom.exception.ResourceNotFoundException;
import com.honestroom.repository.ActivityLogRepository;
import com.honestroom.repository.FeedbackRepository;
import com.honestroom.repository.ResponseRepository;
import com.honestroom.repository.RoomRepository;
import com.honestroom.util.SanitizationUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final RoomRepository roomRepository;
    private final ResponseRepository responseRepository;
    private final ActivityLogRepository activityLogRepository;
    private final RoomService roomService;
    private final RateLimiterService rateLimiterService;

    public FeedbackService(
            FeedbackRepository feedbackRepository,
            RoomRepository roomRepository,
            ResponseRepository responseRepository,
            ActivityLogRepository activityLogRepository,
            RoomService roomService,
            RateLimiterService rateLimiterService
    ) {
        this.feedbackRepository = feedbackRepository;
        this.roomRepository = roomRepository;
        this.responseRepository = responseRepository;
        this.activityLogRepository = activityLogRepository;
        this.roomService = roomService;
        this.rateLimiterService = rateLimiterService;
    }

    @Transactional
    public PublicFeedbackSubmittedDto submitAnonymousFeedback(
            String token,
            SubmitFeedbackRequest request,
            String clientIdentifier
    ) {
        if (token == null || token.isBlank()) {
            throw new ResourceNotFoundException("Feedback room not found.");
        }

        // Honeypot check: if a bot filled out the hidden websiteUrl field, silently discard
        if (request.websiteUrl() != null && !request.websiteUrl().isBlank()) {
            return new PublicFeedbackSubmittedDto(
                    true,
                    "Your anonymous feedback has been submitted.",
                    Instant.now()
            );
        }

        rateLimiterService.checkFeedbackRateLimit(clientIdentifier, token.trim());

        Room room = roomRepository.findByPublicToken(token.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Feedback room not found."));

        if (room.getStatus() != RoomStatus.OPEN) {
            throw new BadRequestException("This feedback room is currently closed and not accepting new submissions.");
        }

        String cleanMessage = SanitizationUtil.cleanText(request.message());
        if (cleanMessage == null || cleanMessage.length() < 3) {
            throw new BadRequestException("Feedback message must be at least 3 characters long.");
        }
        if (cleanMessage.length() > 5000) {
            throw new BadRequestException("Feedback message must not exceed 5,000 characters.");
        }
        if (request.category() == null) {
            throw new BadRequestException("Feedback category is required.");
        }

        Feedback feedback = new Feedback(room, cleanMessage, request.category(), FeedbackStatus.NEW);
        Feedback saved = feedbackRepository.save(feedback);

        // Log room event without storing the message body or any sender metadata
        activityLogRepository.save(new ActivityLog(
                room,
                null,
                "FEEDBACK_SUBMITTED",
                "Anonymous feedback submitted under category " + saved.getCategory()
        ));

        return new PublicFeedbackSubmittedDto(
                true,
                "Your anonymous feedback has been submitted.",
                saved.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public PagedResponse<FeedbackDto> getRoomFeedback(
            Long ownerId,
            Long roomId,
            FeedbackStatus status,
            FeedbackCategory category,
            String search,
            int page,
            int size,
            String sortParam
    ) {
        Room room = roomService.getOwnedRoomOrThrow(ownerId, roomId);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Sort sort = parseSort(sortParam);
        Pageable pageable = PageRequest.of(safePage, safeSize, sort);

        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Feedback> feedbackPage = feedbackRepository.findByRoomWithFilters(
                room.getId(),
                status,
                category,
                cleanSearch,
                pageable
        );

        List<Long> feedbackIds = feedbackPage.getContent().stream().map(Feedback::getId).toList();
        Map<Long, FeedbackResponse> responseMap = feedbackIds.isEmpty()
                ? Map.of()
                : responseRepository.findByFeedbackIdIn(feedbackIds).stream()
                        .collect(Collectors.toMap(r -> r.getFeedback().getId(), Function.identity()));

        List<FeedbackDto> dtos = feedbackPage.getContent().stream()
                .map(f -> toFeedbackDto(f, room.getTitle(), responseMap.get(f.getId())))
                .toList();

        return new PagedResponse<>(
                dtos,
                feedbackPage.getNumber(),
                feedbackPage.getSize(),
                feedbackPage.getTotalElements(),
                feedbackPage.getTotalPages(),
                feedbackPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public FeedbackStatsDto getRoomFeedbackStats(Long ownerId, Long roomId) {
        Room room = roomService.getOwnedRoomOrThrow(ownerId, roomId);
        Long id = room.getId();
        return new FeedbackStatsDto(
                id,
                feedbackRepository.countByRoomId(id),
                feedbackRepository.countByRoomIdAndStatus(id, FeedbackStatus.NEW),
                feedbackRepository.countByRoomIdAndStatus(id, FeedbackStatus.REVIEWED),
                feedbackRepository.countByRoomIdAndStatus(id, FeedbackStatus.RESOLVED),
                feedbackRepository.countByRoomIdAndCategory(id, FeedbackCategory.SUGGESTION),
                feedbackRepository.countByRoomIdAndCategory(id, FeedbackCategory.APPRECIATION),
                feedbackRepository.countByRoomIdAndCategory(id, FeedbackCategory.CONCERN),
                feedbackRepository.countByRoomIdAndCategory(id, FeedbackCategory.GENERAL)
        );
    }

    @Transactional(readOnly = true)
    public FeedbackDto getFeedbackById(Long ownerId, Long feedbackId) {
        Feedback feedback = getOwnedFeedbackOrThrow(ownerId, feedbackId);
        FeedbackResponse response = responseRepository.findByFeedbackId(feedback.getId()).orElse(null);
        return toFeedbackDto(feedback, feedback.getRoom().getTitle(), response);
    }

    @Transactional
    public FeedbackDto updateFeedbackStatus(
            Long ownerId,
            Long feedbackId,
            UpdateFeedbackStatusRequest request
    ) {
        if (request.status() == null) {
            throw new BadRequestException("Feedback status is required.");
        }
        Feedback feedback = getOwnedFeedbackOrThrow(ownerId, feedbackId);
        feedback.setStatus(request.status());
        Feedback saved = feedbackRepository.save(feedback);

        activityLogRepository.save(new ActivityLog(
                saved.getRoom(),
                saved.getRoom().getOwner(),
                "FEEDBACK_STATUS_UPDATED",
                "Feedback #" + saved.getId() + " marked as " + saved.getStatus()
        ));

        FeedbackResponse response = responseRepository.findByFeedbackId(saved.getId()).orElse(null);
        return toFeedbackDto(saved, saved.getRoom().getTitle(), response);
    }

    @Transactional
    public void deleteFeedback(Long ownerId, Long feedbackId) {
        Feedback feedback = getOwnedFeedbackOrThrow(ownerId, feedbackId);
        Room room = feedback.getRoom();
        responseRepository.deleteByFeedbackId(feedback.getId());
        feedbackRepository.delete(feedback);

        activityLogRepository.save(new ActivityLog(
                room,
                room.getOwner(),
                "FEEDBACK_DELETED",
                "Feedback item deleted"
        ));
    }

    @Transactional(readOnly = true)
    public Feedback getOwnedFeedbackOrThrow(Long ownerId, Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback item not found."));
        if (!feedback.getRoom().getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("You do not have permission to access or manage this feedback.");
        }
        return feedback;
    }

    public static FeedbackDto toFeedbackDto(Feedback feedback, String roomTitle, FeedbackResponse response) {
        ResponseDto responseDto = response != null ? toResponseDto(response) : null;
        return new FeedbackDto(
                feedback.getId(),
                feedback.getRoom().getId(),
                roomTitle,
                feedback.getMessage(),
                feedback.getCategory(),
                feedback.getStatus(),
                feedback.getCreatedAt(),
                feedback.getUpdatedAt(),
                responseDto
        );
    }

    public static ResponseDto toResponseDto(FeedbackResponse response) {
        return new ResponseDto(
                response.getId(),
                response.getFeedback().getId(),
                response.getOwner().getName(),
                response.getMessage(),
                response.getCreatedAt(),
                response.getUpdatedAt()
        );
    }

    private Sort parseSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sortParam.split(",");
        String property = parts[0].trim();
        if (!property.equals("createdAt") && !property.equals("updatedAt") && !property.equals("status")) {
            property = "createdAt";
        }
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.ASC;
        }
        return Sort.by(direction, property);
    }
}
