package com.pranav.interviewai.controller;

import com.pranav.interviewai.entity.User;
import com.pranav.interviewai.repository.InterviewAttemptRepository;
import com.pranav.interviewai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.bson.Document;

import java.util.*;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepo;
    private final InterviewAttemptRepository attemptRepo;

    // GET /api/leaderboard/global — top 10 overall
    @GetMapping("/global")
    public ResponseEntity<?> globalLeaderboard() {
        try {
            Aggregation agg = Aggregation.newAggregation(
                Aggregation.group("userId")
                    .avg("textScore").as("avgScore")
                    .count().as("totalAttempts")
                    .addToSet("topic").as("topics")
                    .max("textScore").as("bestScore"),
                Aggregation.sort(Sort.Direction.DESC, "avgScore"),
                Aggregation.limit(10)
            );

            AggregationResults<Document> results = mongoTemplate.aggregate(
                agg, "interview_attempts", Document.class
            );

            List<Map<String, Object>> leaderboard = new ArrayList<>();
            int rank = 1;

            for (Document doc : results.getMappedResults()) {
                String userId = doc.getString("_id");
                double avgScore = doc.getDouble("avgScore") != null ? doc.getDouble("avgScore") : 0;
                int attempts = doc.getInteger("totalAttempts", 0);
                int bestScore = doc.getInteger("bestScore", 0);

                String name = userRepo.findById(userId)
                    .map(User::getName)
                    .orElse("Anonymous");

                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("rank", rank++);
                entry.put("name", name);
                entry.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
                entry.put("totalAttempts", attempts);
                entry.put("bestScore", bestScore);
                entry.put("topics", doc.get("topics"));

                leaderboard.add(entry);
            }

            return ResponseEntity.ok(leaderboard);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/leaderboard/topic/{topic} — top 10 for specific topic
    @GetMapping("/topic/{topic}")
    public ResponseEntity<?> topicLeaderboard(@PathVariable String topic) {
        try {
            Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(
                    Criteria.where("topic").regex(topic, "i")
                ),
                Aggregation.group("userId")
                    .avg("textScore").as("avgScore")
                    .count().as("attempts")
                    .max("textScore").as("bestScore"),
                Aggregation.sort(Sort.Direction.DESC, "avgScore"),
                Aggregation.limit(10)
            );

            AggregationResults<Document> results = mongoTemplate.aggregate(
                agg, "interview_attempts", Document.class
            );

            List<Map<String, Object>> leaderboard = new ArrayList<>();
            int rank = 1;

            for (Document doc : results.getMappedResults()) {
                String userId = doc.getString("_id");
                double avgScore = doc.getDouble("avgScore") != null ? doc.getDouble("avgScore") : 0;
                int attempts = doc.getInteger("attempts", 0);
                int bestScore = doc.getInteger("bestScore", 0);

                String name = userRepo.findById(userId)
                    .map(User::getName)
                    .orElse("Anonymous");

                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("rank", rank++);
                entry.put("name", name);
                entry.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
                entry.put("bestScore", bestScore);
                entry.put("attempts", attempts);

                leaderboard.add(entry);
            }

            return ResponseEntity.ok(leaderboard);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }
}