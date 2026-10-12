package com.honestroom.util;

public final class SanitizationUtil {

    private SanitizationUtil() {
    }

    public static String cleanText(String input) {
        if (input == null) {
            return null;
        }
        // Strip null bytes and non-printable control characters except newline, carriage return, and tab
        return input.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "").trim();
    }
}
