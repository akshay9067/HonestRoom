package com.honestroom.controller;

import com.honestroom.dto.ResponseDto;
import com.honestroom.dto.UpsertResponseRequest;
import com.honestroom.security.CustomUserDetails;
import com.honestroom.service.ResponseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ResponseController {

    private final ResponseService responseService;

    public ResponseController(ResponseService responseService) {
        this.responseService = responseService;
    }

    @PostMapping("/feedback/{id}/responses")
    public ResponseEntity<ResponseDto> createResponse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpsertResponseRequest request
    ) {
        ResponseDto created = responseService.createResponse(currentUser.getId(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/feedback/{id}/responses")
    public ResponseEntity<List<ResponseDto>> getResponses(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(responseService.getResponsesForFeedback(currentUser.getId(), id));
    }

    @PutMapping("/responses/{id}")
    public ResponseEntity<ResponseDto> updateResponse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpsertResponseRequest request
    ) {
        return ResponseEntity.ok(responseService.updateResponse(currentUser.getId(), id, request));
    }

    @DeleteMapping("/responses/{id}")
    public ResponseEntity<Void> deleteResponse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id
    ) {
        responseService.deleteResponse(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
