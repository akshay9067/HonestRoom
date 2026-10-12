package com.honestroom.controller;

import com.honestroom.dto.PublicFeedbackSubmittedDto;
import com.honestroom.dto.PublicRoomDto;
import com.honestroom.dto.SubmitFeedbackRequest;
import com.honestroom.service.FeedbackService;
import com.honestroom.service.RoomService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/rooms")
public class PublicRoomController {

    private final RoomService roomService;
    private final FeedbackService feedbackService;

    public PublicRoomController(RoomService roomService, FeedbackService feedbackService) {
        this.roomService = roomService;
        this.feedbackService = feedbackService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<PublicRoomDto> getPublicRoom(@PathVariable String token) {
        return ResponseEntity.ok(roomService.getPublicRoomByToken(token));
    }

    @PostMapping("/{token}/feedback")
    public ResponseEntity<PublicFeedbackSubmittedDto> submitFeedback(
            @PathVariable String token,
            @Valid @RequestBody SubmitFeedbackRequest request,
            HttpServletRequest servletRequest
    ) {
        // Used only for transient in-memory hashed rate limiting; never persisted
        String clientKey = servletRequest.getRemoteAddr();
        PublicFeedbackSubmittedDto submitted = feedbackService.submitAnonymousFeedback(token, request, clientKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(submitted);
    }
}
