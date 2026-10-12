package com.honestroom.controller;

import com.honestroom.dto.DashboardSummaryDto;
import com.honestroom.dto.FeedbackDto;
import com.honestroom.security.CustomUserDetails;
import com.honestroom.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(dashboardService.getDashboardSummary(currentUser.getId()));
    }

    @GetMapping("/recent-feedback")
    public ResponseEntity<List<FeedbackDto>> getRecentFeedback(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(defaultValue = "8") int limit
    ) {
        return ResponseEntity.ok(dashboardService.getRecentFeedback(currentUser.getId(), limit));
    }
}
