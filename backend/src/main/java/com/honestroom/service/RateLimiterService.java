package com.honestroom.service;

import com.honestroom.exception.RateLimitExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Deque;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class RateLimiterService {

    private final int maxRequests;
    private final long windowSeconds;
    private final String ephemeralSalt = UUID.randomUUID().toString();
    private final Map<String, Deque<Long>> requestBuckets = new ConcurrentHashMap<>();

    public RateLimiterService(
            @Value("${app.rate-limit.public-feedback-max-requests:10}") int maxRequests,
            @Value("${app.rate-limit.public-feedback-window-seconds:60}") long windowSeconds
    ) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
    }

    public void checkFeedbackRateLimit(String clientIdentifier, String roomToken) {
        String bucketKey = hashKey(clientIdentifier, roomToken);
        long nowEpochSecond = Instant.now().getEpochSecond();
        long cutoff = nowEpochSecond - windowSeconds;

        Deque<Long> timestamps = requestBuckets.computeIfAbsent(bucketKey, k -> new ConcurrentLinkedDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() <= cutoff) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                throw new RateLimitExceededException(
                        "Too many feedback submissions in a short period. Please wait a minute and try again."
                );
            }
            timestamps.addLast(nowEpochSecond);
        }
    }

    public void clearAll() {
        requestBuckets.clear();
    }

    private String hashKey(String clientIdentifier, String roomToken) {
        String safeClient = clientIdentifier == null ? "anonymous" : clientIdentifier;
        String input = ephemeralSalt + ":" + safeClient + ":" + roomToken;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(input.hashCode());
        }
    }
}
