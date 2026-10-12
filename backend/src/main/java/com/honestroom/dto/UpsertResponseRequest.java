package com.honestroom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpsertResponseRequest(
        @NotBlank(message = "Response message cannot be empty.")
        @Size(min = 2, max = 3000, message = "Response message must be between 2 and 3,000 characters.")
        String message
) {
}
