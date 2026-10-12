package com.honestroom.service;

import com.honestroom.dto.CreateRoomRequest;
import com.honestroom.dto.PublicRoomDto;
import com.honestroom.dto.RoomDto;
import com.honestroom.dto.UpdateRoomRequest;
import com.honestroom.dto.UpdateRoomStatusRequest;
import com.honestroom.entity.ActivityLog;
import com.honestroom.entity.FeedbackStatus;
import com.honestroom.entity.Room;
import com.honestroom.entity.RoomStatus;
import com.honestroom.entity.User;
import com.honestroom.exception.BadRequestException;
import com.honestroom.exception.ForbiddenException;
import com.honestroom.exception.ResourceNotFoundException;
import com.honestroom.repository.ActivityLogRepository;
import com.honestroom.repository.FeedbackRepository;
import com.honestroom.repository.ResponseRepository;
import com.honestroom.repository.RoomRepository;
import com.honestroom.util.SanitizationUtil;
import com.honestroom.util.TokenGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final FeedbackRepository feedbackRepository;
    private final ResponseRepository responseRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserService userService;

    public RoomService(
            RoomRepository roomRepository,
            FeedbackRepository feedbackRepository,
            ResponseRepository responseRepository,
            ActivityLogRepository activityLogRepository,
            UserService userService
    ) {
        this.roomRepository = roomRepository;
        this.feedbackRepository = feedbackRepository;
        this.responseRepository = responseRepository;
        this.activityLogRepository = activityLogRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<RoomDto> getOwnerRooms(Long ownerId, RoomStatus status, String search) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Room> rooms = roomRepository.searchRoomsByOwner(ownerId, status, cleanSearch);
        return rooms.stream().map(this::toRoomDto).toList();
    }

    @Transactional
    public RoomDto createRoom(Long ownerId, CreateRoomRequest request) {
        User owner = userService.getUserEntity(ownerId);
        String title = SanitizationUtil.cleanText(request.title());
        if (title == null || title.length() < 3) {
            throw new BadRequestException("Room title must be between 3 and 150 characters.");
        }
        String description = SanitizationUtil.cleanText(request.description());
        RoomStatus status = request.status() != null ? request.status() : RoomStatus.OPEN;

        String publicToken = generateUniquePublicToken();
        Room room = new Room(owner, title, description, publicToken, status);
        Room savedRoom = roomRepository.save(room);

        activityLogRepository.save(new ActivityLog(
                savedRoom,
                owner,
                "ROOM_CREATED",
                "Room created with status " + savedRoom.getStatus()
        ));

        return toRoomDto(savedRoom);
    }

    @Transactional(readOnly = true)
    public RoomDto getOwnerRoomById(Long ownerId, Long roomId) {
        Room room = getOwnedRoomOrThrow(ownerId, roomId);
        return toRoomDto(room);
    }

    @Transactional
    public RoomDto updateRoom(Long ownerId, Long roomId, UpdateRoomRequest request) {
        Room room = getOwnedRoomOrThrow(ownerId, roomId);
        String title = SanitizationUtil.cleanText(request.title());
        if (title == null || title.length() < 3) {
            throw new BadRequestException("Room title must be between 3 and 150 characters.");
        }
        String description = SanitizationUtil.cleanText(request.description());

        room.setTitle(title);
        room.setDescription(description);
        if (request.status() != null) {
            room.setStatus(request.status());
        }

        Room saved = roomRepository.save(room);
        activityLogRepository.save(new ActivityLog(
                saved,
                saved.getOwner(),
                "ROOM_UPDATED",
                "Room details updated"
        ));
        return toRoomDto(saved);
    }

    @Transactional
    public RoomDto updateRoomStatus(Long ownerId, Long roomId, UpdateRoomStatusRequest request) {
        if (request.status() == null) {
            throw new BadRequestException("Room status is required.");
        }
        Room room = getOwnedRoomOrThrow(ownerId, roomId);
        room.setStatus(request.status());
        Room saved = roomRepository.save(room);

        activityLogRepository.save(new ActivityLog(
                saved,
                saved.getOwner(),
                "ROOM_STATUS_CHANGED",
                "Room status changed to " + saved.getStatus()
        ));
        return toRoomDto(saved);
    }

    @Transactional
    public void deleteRoom(Long ownerId, Long roomId) {
        Room room = getOwnedRoomOrThrow(ownerId, roomId);
        // Transactionally remove dependent records to prevent any orphaned rows
        responseRepository.deleteAllByRoomId(room.getId());
        feedbackRepository.deleteAllByRoomId(room.getId());
        activityLogRepository.deleteAllByRoomId(room.getId());
        roomRepository.delete(room);
    }

    @Transactional(readOnly = true)
    public PublicRoomDto getPublicRoomByToken(String token) {
        if (token == null || token.isBlank()) {
            throw new ResourceNotFoundException("Feedback room not found.");
        }
        Room room = roomRepository.findByPublicToken(token.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Feedback room not found."));
        return new PublicRoomDto(
                room.getTitle(),
                room.getDescription(),
                room.getPublicToken(),
                room.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public Room getOwnedRoomOrThrow(Long ownerId, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found."));
        if (!room.getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("You do not have permission to access or modify this room.");
        }
        return room;
    }

    public RoomDto toRoomDto(Room room) {
        Long roomId = room.getId();
        long total = feedbackRepository.countByRoomId(roomId);
        long newCount = feedbackRepository.countByRoomIdAndStatus(roomId, FeedbackStatus.NEW);
        long reviewedCount = feedbackRepository.countByRoomIdAndStatus(roomId, FeedbackStatus.REVIEWED);
        long resolvedCount = feedbackRepository.countByRoomIdAndStatus(roomId, FeedbackStatus.RESOLVED);

        return new RoomDto(
                room.getId(),
                room.getTitle(),
                room.getDescription(),
                room.getPublicToken(),
                room.getStatus(),
                total,
                newCount,
                reviewedCount,
                resolvedCount,
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }

    private String generateUniquePublicToken() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String candidate = TokenGenerator.generatePublicRoomToken();
            if (!roomRepository.existsByPublicToken(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique public room token.");
    }
}
