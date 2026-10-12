package com.honestroom.dto;

import com.honestroom.entity.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
        @NotBlank(message = "Room title is required.")
        @Size(min = 3, max = 150, message = "Room title must be between 3 and 150 characters.")
        String title,

        @Size(max = 2000, message = "Room description must not exceed 2,000 characters.")
        String description,

        RoomStatus status
) {
}
