package com.honestroom.controller;

import com.honestroom.dto.FeedbackDto;
import com.honestroom.dto.FeedbackStatsDto;
import com.honestroom.dto.PagedResponse;
import com.honestroom.dto.UpdateFeedbackStatusRequest;
import com.honestroom.entity.FeedbackCategory;
import com.honestroom.entity.FeedbackStatus;
import com.honestroom.security.CustomUserDetails;
import com.honestroom.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping("/rooms/{id}/feedback")
    public ResponseEntity<PagedResponse<FeedbackDto>> getRoomFeedback(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) FeedbackCategory category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        return ResponseEntity.ok(feedbackService.getRoomFeedback(
                currentUser.getId(),
                id,
                status,
                category,
                search,
                page,
                size,
                sort
        ));
    }

    @GetMapping("/rooms/{id}/feedback/stats")
    public ResponseEntity<FeedbackStatsDto> getRoomFeedbackStats(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(feedbackService.getRoomFeedbackStats(currentUser.getId(), id));
    }

    @GetMapping("/feedback/{id}")
    public ResponseEntity<FeedbackDto> getFeedbackById(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(feedbackService.getFeedbackById(currentUser.getId(), id));
    }

    @PatchMapping("/feedback/{id}/status")
    public ResponseEntity<FeedbackDto> updateFeedbackStatus(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateFeedbackStatusRequest request
    ) {
        return ResponseEntity.ok(feedbackService.updateFeedbackStatus(currentUser.getId(), id, request));
    }

    @DeleteMapping("/feedback/{id}")
    public ResponseEntity<Void> deleteFeedback(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id
    ) {
        feedbackService.deleteFeedback(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
