package com.pranav.interviewai.controller;

import com.pranav.interviewai.entity.InterviewAttempt;
import com.pranav.interviewai.entity.InterviewTest;
import com.pranav.interviewai.entity.Question;
import com.pranav.interviewai.entity.User;
import com.pranav.interviewai.repository.InterviewAttemptRepository;
import com.pranav.interviewai.repository.InterviewTestRepository;
import com.pranav.interviewai.repository.QuestionRepository;
import com.pranav.interviewai.repository.UserRepository;
import com.pranav.interviewai.service.GroqService;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final InterviewAttemptRepository attemptRepository;
    private final MongoTemplate mongoTemplate;
    private final QuestionRepository questionRepo;
    private final GroqService groqService;
    private final UserRepository userRepo;
    private final InterviewTestRepository testRepository;
    private User getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepo.findByEmail(email).orElseThrow();
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(HttpServletRequest request) {
        User user = getCurrentUser();
        List<InterviewAttempt> attempts =
                attemptRepository.findByUserId(user.getId());

        double avgText = attempts.stream()
                .filter(a -> a.getTextScore() != null)
                .mapToInt(InterviewAttempt::getTextScore)
                .average()
                .orElse(0);

        double avgVoice = attempts.stream()
                .filter(a -> a.getVoiceScore() != null)
                .mapToInt(InterviewAttempt::getVoiceScore)
                .average()
                .orElse(0);

        return ResponseEntity.ok(Map.of(
                "totalAttempts", attempts.size(),
                "avgTextScore", avgText,
                "avgVoiceScore", avgVoice
        ));
    }

    @GetMapping("/progress")
    public ResponseEntity<?> getProgress(HttpServletRequest request) {
        User user = getCurrentUser();

        List<InterviewAttempt> attempts =
                attemptRepository.findByUserId(user.getId());

        List<Map<String, Object>> progress = attempts.stream()
                .map(a -> {
                    Integer score = a.getTextScore() != null
                            ? a.getTextScore()
                            : a.getVoiceScore();

                    Map<String, Object> map = new HashMap<>();
                    map.put("date", a.getCreatedAt());
                    map.put("score", score);
                    map.put("correct", score != null && score >= 7);
                    return map;
                })
                .toList();

        return ResponseEntity.ok(progress);
    }

    @GetMapping("/accuracy")
    public ResponseEntity<?> getAccuracy(HttpServletRequest request) {
        User user = getCurrentUser();
        List<InterviewAttempt> attempts =
                attemptRepository.findByUserId(user.getId());

        long correct = attempts.stream()
                .filter(a -> {
                    Integer score = a.getTextScore() != null
                            ? a.getTextScore()
                            : a.getVoiceScore();
                    return score != null && score >= 7;
                })
                .count();

        long wrong = attempts.size() - correct;

        return ResponseEntity.ok(Map.of(
                "correct", correct,
                "wrong", wrong
        ));
    }

    @GetMapping("/topic-analysis")
    public ResponseEntity<?> topicAnalysis(HttpServletRequest request) {
        User user = getCurrentUser();

        List<InterviewAttempt> attempts =
                attemptRepository.findByUserId(user.getId());

        Map<String, List<InterviewAttempt>> grouped =
                attempts.stream()
                        .collect(Collectors.groupingBy(a ->
                                a.getTopic() == null ? "Unknown" : a.getTopic()
                        ));

        List<Map<String, Object>> response = new ArrayList<>();

        for (String topic : grouped.keySet()) {

            List<InterviewAttempt> topicAttempts = grouped.get(topic);

            double avgScore = topicAttempts.stream()
                    .mapToDouble(a -> {
                        if (a.getTextScore() != null && a.getVoiceScore() != null) {
                            return (a.getTextScore() + a.getVoiceScore()) / 2.0;
                        } else if (a.getTextScore() != null) {
                            return a.getTextScore();
                        } else if (a.getVoiceScore() != null) {
                            return a.getVoiceScore();
                        }
                        return 0;
                    })
                    .average()
                    .orElse(0);

            List<String> feedbackList = topicAttempts.stream()
                    .map(InterviewAttempt::getFeedback)
                    .filter(Objects::nonNull)
                    .toList();

            String combinedFeedback = String.join("\n", feedbackList);

            response.add(Map.of(
                    "topic", topic,
                    "attempts", topicAttempts.size(),
                    "avgScore", avgScore,
                    "feedbackSummary",
                    combinedFeedback.isEmpty()
                            ? "Click to see detailed analysis"
                            : combinedFeedback
            ));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/topic-details/{topic}")
    public ResponseEntity<?> topicDetails(@PathVariable String topic) {

        List<InterviewAttempt> attempts =
                attemptRepository.findAll()
                        .stream()
                        .filter(a -> a.getTopic() != null &&
                                a.getTopic().equalsIgnoreCase(topic))
                        .toList();

        List<Map<String, Object>> response = attempts.stream()
                .map(a -> Map.<String, Object>of(
                        "question", a.getQuestion(),
                        "userAnswer", a.getUserAnswer(),
                        "modelAnswer", a.getModelAnswer(),
                        "feedback", a.getFeedback(),
                        "score",
                        a.getTextScore() != null
                                ? a.getTextScore()
                                : a.getVoiceScore()
                ))
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/skill-breakdown")
    public ResponseEntity<?> skillBreakdown() {

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.group()
                        .avg("contentScore").as("content")
                        .avg("grammarScore").as("grammar")
                        .avg("fluencyScore").as("fluency")
                        .avg("keywordScore").as("keyword")
                        .avg("clarityScore").as("clarity")
        );

        AggregationResults<Document> results =
                mongoTemplate.aggregate(
                        aggregation,
                        "interview_attempts",
                        Document.class
                );

        List<Document> mapped = results.getMappedResults();

        if (mapped.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "content", 0,
                    "grammar", 0,
                    "fluency", 0,
                    "keyword", 0,
                    "clarity", 0
            ));
        }

        Document doc = mapped.get(0);
        doc.remove("_id");

        return ResponseEntity.ok(doc);
    }

    @GetMapping("/practice-library")
    public ResponseEntity<?> practiceLibrary() {

        List<Question> questions = mongoTemplate.findAll(Question.class);

        List<Map<String, String>> library = questions.stream()
                .map(q -> Map.of(
                        "question", q.getQuestionText(),
                        "modelAnswer", q.getModelAnswer()
                ))
                .toList();

        return ResponseEntity.ok(library);
    }

    @GetMapping("/questions/{topic}")
    public ResponseEntity<?> questionsByTopic(@PathVariable String topic) {

        List<Question> questions = questionRepo.findAll();

        List<Map<String, Object>> response = questions.stream()
                .filter(q -> q.getQuestionText() != null &&
                        q.getQuestionText().toLowerCase()
                                .contains(topic.toLowerCase()))
                .map(q -> Map.<String, Object>of(
                        "question", q.getQuestionText(),
                        "modelAnswer",
                        groqService.generateModelAnswer(
                                q.getQuestionText()
                        )
                ))
                .toList();

        return ResponseEntity.ok(response);
    }
    @GetMapping("/topic-tests/{topic}")
public ResponseEntity<?> topicTests(@PathVariable String topic, HttpServletRequest request) {
        User user = getCurrentUser();

        List<InterviewAttempt> attempts =
                attemptRepository.findByUserIdAndTopicIgnoreCase(
                        user.getId(), topic);

    // Group by testId
    Map<String, List<InterviewAttempt>> grouped =
            attempts.stream().collect(Collectors.groupingBy(a ->
        a.getTestId() == null ? "UNKNOWN" : a.getTestId()
));

    List<Map<String, Object>> response = new ArrayList<>();

    for (String testId : grouped.keySet()) {

        List<InterviewAttempt> testAttempts = grouped.get(testId);

        List<Map<String, Object>> questions = testAttempts.stream()
        .sorted(Comparator.comparingInt(InterviewAttempt::getQuestionNumber))
        .map(a -> {
            Map<String, Object> map = new HashMap<>();

            map.put("questionNumber", a.getQuestionNumber());
            map.put("question", a.getQuestion());
            map.put("userAnswer", a.getUserAnswer());
            map.put("modelAnswer", a.getModelAnswer());
            map.put("feedback", a.getFeedback());

            Integer score = a.getTextScore() != null
                    ? a.getTextScore()
                    : a.getVoiceScore();

            map.put("score", score);

            map.put("answerType", a.getAnswerType());
            map.put("audioUrl", a.getAudioUrl());

            map.put("contentScore", a.getContentScore());
            map.put("grammarScore", a.getGrammarScore());
            map.put("fluencyScore", a.getFluencyScore());
            map.put("keywordScore", a.getKeywordScore());
            map.put("clarityScore", a.getClarityScore());

            return map;
        })
        .collect(Collectors.toList());

        double avgScore = testAttempts.stream()
                .mapToDouble(a ->
                        a.getTextScore() != null
                                ? a.getTextScore()
                                : a.getVoiceScore())
                .average()
                .orElse(0);

        response.add(Map.of(
                "testId", testId,
                "averageScore", avgScore,
                "questions", questions
        ));
    }

    return ResponseEntity.ok(response);
}
}