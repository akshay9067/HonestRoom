package com.honestroom.service;

import com.honestroom.dto.ResponseDto;
import com.honestroom.dto.UpsertResponseRequest;
import com.honestroom.entity.ActivityLog;
import com.honestroom.entity.Feedback;
import com.honestroom.entity.FeedbackResponse;
import com.honestroom.entity.FeedbackStatus;
import com.honestroom.entity.User;
import com.honestroom.exception.BadRequestException;
import com.honestroom.exception.ConflictException;
import com.honestroom.exception.ForbiddenException;
import com.honestroom.exception.ResourceNotFoundException;
import com.honestroom.repository.ActivityLogRepository;
import com.honestroom.repository.FeedbackRepository;
import com.honestroom.repository.ResponseRepository;
import com.honestroom.util.SanitizationUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResponseService {

    private final ResponseRepository responseRepository;
    private final FeedbackRepository feedbackRepository;
    private final ActivityLogRepository activityLogRepository;
    private final FeedbackService feedbackService;

    public ResponseService(
            ResponseRepository responseRepository,
            FeedbackRepository feedbackRepository,
            ActivityLogRepository activityLogRepository,
            FeedbackService feedbackService
    ) {
        this.responseRepository = responseRepository;
        this.feedbackRepository = feedbackRepository;
        this.activityLogRepository = activityLogRepository;
        this.feedbackService = feedbackService;
    }

    @Transactional
    public ResponseDto createResponse(Long ownerId, Long feedbackId, UpsertResponseRequest request) {
        Feedback feedback = feedbackService.getOwnedFeedbackOrThrow(ownerId, feedbackId);
        if (responseRepository.existsByFeedbackId(feedbackId)) {
            throw new ConflictException("A response already exists for this feedback item.");
        }

        String cleanMessage = SanitizationUtil.cleanText(request.message());
        if (cleanMessage == null || cleanMessage.length() < 2) {
            throw new BadRequestException("Response message must be at least 2 characters long.");
        }

        User owner = feedback.getRoom().getOwner();
        FeedbackResponse response = new FeedbackResponse(feedback, owner, cleanMessage);
        FeedbackResponse saved = responseRepository.save(response);

        if (feedback.getStatus() == FeedbackStatus.NEW) {
            feedback.setStatus(FeedbackStatus.REVIEWED);
            feedbackRepository.save(feedback);
        }

        activityLogRepository.save(new ActivityLog(
                feedback.getRoom(),
                owner,
                "RESPONSE_CREATED",
                "Owner added a private response to feedback #" + feedback.getId()
        ));

        return FeedbackService.toResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ResponseDto> getResponsesForFeedback(Long ownerId, Long feedbackId) {
        Feedback feedback = feedbackService.getOwnedFeedbackOrThrow(ownerId, feedbackId);
        return responseRepository.findByFeedbackId(feedback.getId())
                .map(r -> List.of(FeedbackService.toResponseDto(r)))
                .orElseGet(List::of);
    }

    @Transactional
    public ResponseDto updateResponse(Long ownerId, Long responseId, UpsertResponseRequest request) {
        FeedbackResponse response = getOwnedResponseOrThrow(ownerId, responseId);
        String cleanMessage = SanitizationUtil.cleanText(request.message());
        if (cleanMessage == null || cleanMessage.length() < 2) {
            throw new BadRequestException("Response message must be at least 2 characters long.");
        }
        response.setMessage(cleanMessage);
        FeedbackResponse saved = responseRepository.save(response);
        return FeedbackService.toResponseDto(saved);
    }

    @Transactional
    public void deleteResponse(Long ownerId, Long responseId) {
        FeedbackResponse response = getOwnedResponseOrThrow(ownerId, responseId);
        responseRepository.delete(response);
    }

    private FeedbackResponse getOwnedResponseOrThrow(Long ownerId, Long responseId) {
        FeedbackResponse response = responseRepository.findById(responseId)
                .orElseThrow(() -> new ResourceNotFoundException("Response not found."));
        if (!response.getFeedback().getRoom().getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("You do not have permission to modify this response.");
        }
        return response;
    }
}
