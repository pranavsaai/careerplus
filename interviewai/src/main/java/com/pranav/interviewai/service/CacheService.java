package com.pranav.interviewai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    // ── Resume Profile Cache ──────────────────────────────────────────────

    public void cacheResumeProfile(String userId, Map<String, Object> profile) {
        String key = "resume:profile:" + userId;
        redisTemplate.opsForValue().set(key, profile, Duration.ofHours(24));
        System.out.println("Cached resume profile for user: " + userId);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getCachedResumeProfile(String userId) {
        String key = "resume:profile:" + userId;
        return (Map<String, Object>) redisTemplate.opsForValue().get(key);
    }

    public void invalidateResumeProfile(String userId) {
        redisTemplate.delete("resume:profile:" + userId);
    }

    // ── Interview Question Cache ──────────────────────────────────────────

    public void cacheQuestion(String topic, String difficulty, String question) {
        String key = "question:" + topic.toLowerCase() + ":" + difficulty.toLowerCase();
        // store list of questions per topic+difficulty
        redisTemplate.opsForList().rightPush(key, question);
        redisTemplate.expire(key, Duration.ofHours(6));
        System.out.println("Cached question for topic: " + topic + " difficulty: " + difficulty);
    }

    public String getRandomCachedQuestion(String topic, String difficulty) {
        String key = "question:" + topic.toLowerCase() + ":" + difficulty.toLowerCase();
        Long size = redisTemplate.opsForList().size(key);
        if (size == null || size == 0) return null;

        // get random question from cached list
        long randomIndex = (long) (Math.random() * size);
        return (String) redisTemplate.opsForList().index(key, randomIndex);
    }

    // ── Leaderboard Cache ─────────────────────────────────────────────────

    public void cacheLeaderboard(String type, Object data) {
        String key = "leaderboard:" + type;
        redisTemplate.opsForValue().set(key, data, Duration.ofMinutes(5));
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getCachedLeaderboard(String type) {
        String key = "leaderboard:" + type;
        return (List<Map<String, Object>>) redisTemplate.opsForValue().get(key);
    }

    // ── User Session Cache ────────────────────────────────────────────────

    public void cacheUserSession(String userId, String sessionData) {
        String key = "session:" + userId;
        redisTemplate.opsForValue().set(key, sessionData, Duration.ofHours(1));
    }

    public String getCachedUserSession(String userId) {
        String key = "session:" + userId;
        return (String) redisTemplate.opsForValue().get(key);
    }

    // ── Generic helpers ───────────────────────────────────────────────────

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public Long getCacheSize() {
        return redisTemplate.getConnectionFactory()
            .getConnection().dbSize();
    }
}