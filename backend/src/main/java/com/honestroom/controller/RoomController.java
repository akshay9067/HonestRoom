package com.honestroom.controller;

import com.honestroom.dto.CreateRoomRequest;
import com.honestroom.dto.RoomDto;
import com.honestroom.dto.UpdateRoomRequest;
import com.honestroom.dto.UpdateRoomStatusRequest;
import com.honestroom.entity.RoomStatus;
import com.honestroom.security.CustomUserDetails;
import com.honestroom.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<RoomDto>> getRooms(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(roomService.getOwnerRooms(currentUser.getId(), status, search));
    }

    @PostMapping
    public ResponseEntity<RoomDto> createRoom(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateRoomRequest request
    ) {
        RoomDto created = roomService.createRoom(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDto> getRoomById(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(roomService.getOwnerRoomById(currentUser.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomDto> updateRoom(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomRequest request
    ) {
        return ResponseEntity.ok(roomService.updateRoom(currentUser.getId(), id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RoomDto> updateRoomStatus(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomStatusRequest request
    ) {
        return ResponseEntity.ok(roomService.updateRoomStatus(currentUser.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id
    ) {
        roomService.deleteRoom(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
