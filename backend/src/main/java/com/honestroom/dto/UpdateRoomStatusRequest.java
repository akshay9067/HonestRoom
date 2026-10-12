package com.honestroom.dto;

import com.honestroom.entity.RoomStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRoomStatusRequest(
        @NotNull(message = "Room status is required.")
        RoomStatus status
) {
}
