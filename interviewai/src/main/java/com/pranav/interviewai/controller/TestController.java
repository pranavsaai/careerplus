package com.pranav.interviewai.controller;

import com.pranav.interviewai.entity.*;
import com.pranav.interviewai.repository.*;
import com.pranav.interviewai.service.GroqService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final InterviewTestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final GroqService groqService;
    private final UserRepository userRepo; 

    private final ObjectMapper mapper = new ObjectMapper();

    @PostMapping("/start")
    public ResponseEntity<?> startTest(
            @RequestParam String topic,
            @RequestParam String difficulty,
            HttpServletRequest request
    ) {
        String email = (String) request.getAttribute("userEmail");
        User user = userRepo.findByEmail(email).orElseThrow();

        InterviewTest test = new InterviewTest();
        test.setTopic(topic);
        test.setDifficulty(difficulty);
        test.setQuestions(new ArrayList<>());
        test.setUserId(user.getId());
        test.setStartedAt(LocalDateTime.now());

        testRepository.save(test);

        return ResponseEntity.ok(Map.of(
                "testId", test.getId()
        ));
    }

    @PostMapping("/answer")
    public ResponseEntity<?> submitAnswer(
            @RequestParam String testId,
            @RequestParam String questionText,
            @RequestParam String answer,
            @RequestParam Long timeTakenSeconds,
            HttpServletRequest request
    ) throws Exception {
        String email = (String) request.getAttribute("userEmail");
        User user = userRepo.findByEmail(email).orElseThrow();

        InterviewTest test = testRepository.findById(testId).orElseThrow();
        if (!test.getUserId().equals(user.getId())) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Unauthorized test access"));
        }

        String evaluation =
                groqService.evaluateAnswer(questionText, answer);

        JsonNode node = mapper.readTree(evaluation);

        int score = node.get("score").asInt();

        String modelAnswer =
                groqService.generateModelAnswer(questionText);

        InterviewAttempt attempt = new InterviewAttempt();
        attempt.setTopic(test.getTopic());
        attempt.setDifficulty(test.getDifficulty());
        attempt.setQuestion(questionText);
        attempt.setUserId(user.getId());
        attempt.setUserAnswer(answer);
        attempt.setModelAnswer(modelAnswer);
        attempt.setFeedback(node.get("feedback").asText());
        attempt.setTextScore(score);
        attempt.setAnswerType("TEXT");
        attempt.setTimeTakenSeconds(timeTakenSeconds);
        attempt.setCreatedAt(LocalDateTime.now());

        test.getQuestions().add(attempt);

        testRepository.save(test);

        return ResponseEntity.ok(Map.of(
                "score", score,
                "feedback", node.get("feedback").asText()
        ));
    }

    @PostMapping("/stop/{testId}")
    public ResponseEntity<?> stopTest(
            @PathVariable String testId,
            HttpServletRequest request
    ) {
        String email = (String) request.getAttribute("userEmail");
        User user = userRepo.findByEmail(email).orElseThrow();

        InterviewTest test = testRepository.findById(testId).orElseThrow();
        if (!test.getUserId().equals(user.getId())) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Unauthorized test access"));
        }

        double avg = test.getQuestions()
                .stream()
                .mapToInt(q ->
                        q.getTextScore() != null
                                ? q.getTextScore()
                                : q.getVoiceScore()
                )
                .average()
                .orElse(0);

        long totalTime = test.getQuestions()
                .stream()
                .mapToLong(q ->
                        q.getTimeTakenSeconds() != null
                                ? q.getTimeTakenSeconds()
                                : 0
                )
                .sum();

        test.setFinalScore((int) Math.round(avg));
        test.setEndedAt(LocalDateTime.now());
        test.setTotalTimeSeconds(totalTime);

        testRepository.save(test);

        return ResponseEntity.ok(Map.of(
                "finalScore", test.getFinalScore(),
                "totalQuestions", test.getQuestions().size(),
                "totalTimeSeconds", totalTime
        ));
    }
}
