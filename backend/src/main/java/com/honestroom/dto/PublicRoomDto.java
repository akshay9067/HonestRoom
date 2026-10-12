package com.honestroom.dto;

import com.honestroom.entity.RoomStatus;

public record PublicRoomDto(
        String title,
        String description,
        String publicToken,
        RoomStatus status
) {
}
