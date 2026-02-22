package com.pranav.interviewai.controller;

import com.pranav.interviewai.dto.StartInterviewRequest;
import com.pranav.interviewai.dto.SubmitAnswerRequest;
import com.pranav.interviewai.entity.Question;
import com.pranav.interviewai.entity.Session;
import com.pranav.interviewai.entity.InterviewAttempt;
import com.pranav.interviewai.entity.User;
import com.pranav.interviewai.repository.QuestionRepository;
import com.pranav.interviewai.repository.SessionRepository;
import com.pranav.interviewai.repository.InterviewAttemptRepository;
import com.pranav.interviewai.repository.UserRepository;
import com.pranav.interviewai.service.DeepgramService;
import com.pranav.interviewai.service.GroqService;
import com.pranav.interviewai.service.InterviewService;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService service;
    private final DeepgramService deepgramService;
    private final GroqService groqService;

    private final QuestionRepository questionRepo;
    private final SessionRepository sessionRepo;
    private final InterviewAttemptRepository attemptRepository;
    private final UserRepository userRepo;   
    private User getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepo.findByEmail(email).orElseThrow();
    }
    @PostMapping("/start")
    public ResponseEntity<?> start(
            @RequestBody StartInterviewRequest req) {
                User user = getCurrentUser();

        return ResponseEntity.ok(service.start(req, user.getId()));
    }
    @PostMapping("/answer")
    public ResponseEntity<?> answer(
            @RequestBody SubmitAnswerRequest req) {
                User user = getCurrentUser();

        return ResponseEntity.ok(service.submitAnswer(req, user.getId()));
    }
    @PostMapping("/voice")
    public ResponseEntity<?> handleVoice(
            @RequestParam("file") MultipartFile file,
            @RequestParam("questionId") String questionId,
            @RequestParam("testId") String testId,
            @RequestParam("questionNumber") int questionNumber) throws Exception {
                User user = getCurrentUser();

        String fileName = java.util.UUID.randomUUID() + ".webm";
        java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads/audio");

        if (!java.nio.file.Files.exists(uploadDir)) {
            java.nio.file.Files.createDirectories(uploadDir);
        }

        java.nio.file.Path filePath = uploadDir.resolve(fileName);
        java.nio.file.Files.write(filePath, file.getBytes());

        File tempFile = File.createTempFile("audio", ".wav");
        file.transferTo(tempFile);
        String transcript = deepgramService.transcribeAudio(tempFile);
        tempFile.delete();

        if (transcript == null || transcript.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "No voice detected. Please speak before stopping recording.")
            );
        }

        Question question = questionRepo.findById(questionId).orElseThrow();
        Session session = sessionRepo.findById(question.getSessionId()).orElseThrow();

        String evaluation =
                groqService.evaluateVoiceAnswer(
                        question.getQuestionText(),
                        transcript
                );

        String modelAnswer =
                groqService.generateModelAnswer(question.getQuestionText());

        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(evaluation);

        int contentScore = node.get("contentScore").asInt();
        int grammarScore = node.get("grammarScore").asInt();
        int fluencyScore = node.get("fluencyScore").asInt();
        int keywordScore = node.get("keywordScore").asInt();
        int clarityScore = node.get("clarityScore").asInt();

        int overallScore =
                (contentScore
                        + grammarScore
                        + fluencyScore
                        + keywordScore
                        + clarityScore) / 5;

        InterviewAttempt attempt = new InterviewAttempt();
        attempt.setUserId(user.getId());

        attempt.setTopic(session.getTopic());
        attempt.setDifficulty(session.getDifficulty());

        attempt.setQuestion(question.getQuestionText());
        attempt.setUserAnswer(transcript);
        attempt.setModelAnswer(modelAnswer);
        attempt.setFeedback(node.get("feedback").asText());

        attempt.setAnswerType("VOICE");
        attempt.setAudioUrl("/audio/" + fileName);

        attempt.setVoiceScore(overallScore);
        attempt.setContentScore(contentScore);
        attempt.setGrammarScore(grammarScore);
        attempt.setFluencyScore(fluencyScore);
        attempt.setKeywordScore(keywordScore);
        attempt.setClarityScore(clarityScore);

        attempt.setTestId(testId);
        attempt.setQuestionNumber(questionNumber);
        attempt.setCreatedAt(LocalDateTime.now());

        attemptRepository.save(attempt);

        return ResponseEntity.ok(
                Map.of(
                        "transcript", transcript,
                        "contentScore", contentScore,
                        "grammarScore", grammarScore,
                        "fluencyScore", fluencyScore,
                        "keywordScore", keywordScore,
                        "clarityScore", clarityScore,
                        "overallScore", overallScore,
                        "feedback", node.get("feedback").asText()
                )
        );
    }
}