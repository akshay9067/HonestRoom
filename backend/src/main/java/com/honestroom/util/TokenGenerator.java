package com.honestroom.util;

import java.security.SecureRandom;

public final class TokenGenerator {

    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int DEFAULT_TOKEN_LENGTH = 24;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private TokenGenerator() {
    }

    public static String generatePublicRoomToken() {
        StringBuilder sb = new StringBuilder(DEFAULT_TOKEN_LENGTH);
        for (int i = 0; i < DEFAULT_TOKEN_LENGTH; i++) {
            int index = SECURE_RANDOM.nextInt(ALPHABET.length());
            sb.append(ALPHABET.charAt(index));
        }
        return sb.toString();
    }
}
