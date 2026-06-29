package com.pranav.interviewai.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    // per user bucket store
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    // 10 requests per minute per user
    private Bucket createBucket() {
        Bandwidth limit = Bandwidth.builder()
            .capacity(10)
            .refillGreedy(10, Duration.ofMinutes(1))
            .build();
        return Bucket.builder().addLimit(limit).build();
    }

    // get or create bucket for user
    private Bucket getBucket(String userId) {
        return buckets.computeIfAbsent(userId, k -> createBucket());
    }

    // returns true if request allowed, false if rate limited
    public boolean tryConsume(String userId) {
        return getBucket(userId).tryConsume(1);
    }

    // how many tokens left for user
    public long getAvailableTokens(String userId) {
        return getBucket(userId).getAvailableTokens();
    }
}