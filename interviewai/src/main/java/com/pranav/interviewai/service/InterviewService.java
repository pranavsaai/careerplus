package com.pranav.interviewai.service;

import com.pranav.interviewai.dto.StartInterviewRequest;
import com.pranav.interviewai.dto.SubmitAnswerRequest;
import com.pranav.interviewai.entity.Session;
import com.pranav.interviewai.entity.Answer;
import com.pranav.interviewai.entity.Question;
import com.pranav.interviewai.entity.InterviewAttempt;
import com.pranav.interviewai.repository.SessionRepository;
import com.pranav.interviewai.repository.AnswerRepository;
import com.pranav.interviewai.repository.QuestionRepository;
import com.pranav.interviewai.repository.InterviewAttemptRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final SessionRepository sessionRepo;
    private final QuestionRepository questionRepo;
    private final AnswerRepository answerRepo;
    private final GroqService ai;
    private final InterviewAttemptRepository attemptRepository;
    public Map<String, String> start(StartInterviewRequest req, String userId) {

        Session s = new Session();
        s.setTopic(req.getTopic());
        s.setDifficulty(req.getDifficulty());
        s.setStartTime(LocalDateTime.now());
        s.setUserId(userId);   

        sessionRepo.save(s);

        String questionText =
                ai.generateQuestion(req.getTopic(), req.getDifficulty());

        String modelAnswer =
                ai.generateModelAnswer(questionText);

        Question q = new Question();
        q.setSessionId(s.getId());
        q.setQuestionText(questionText);
        q.setModelAnswer(modelAnswer);

        questionRepo.save(q);

        Map<String, String> response = new HashMap<>();
        response.put("sessionId", s.getId());
        response.put("questionId", q.getId());
        response.put("question", questionText);

        return response;
    }
    public Map<String, Object> submitAnswer(
            SubmitAnswerRequest req,
            String userId) {

        Question q =
                questionRepo.findById(req.getQuestionId()).orElseThrow();

        Session session =
                sessionRepo.findById(q.getSessionId()).orElseThrow();

        String evaluation =
                ai.evaluateAnswer(q.getQuestionText(), req.getAnswer());

        String modelAnswer =
                ai.generateModelAnswer(q.getQuestionText());

        int score = 0;
        String feedback = "Parsing failed";
        if (!session.getUserId().equals(userId)) {
    throw new RuntimeException("Unauthorized session access");
}

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(evaluation);

            score = node.get("score").asInt();
            feedback = node.get("feedback").asText();

        } catch (Exception e) {
            e.printStackTrace();
        }
        Answer a = new Answer();
        a.setQuestionId(req.getQuestionId());
        a.setUserAnswer(req.getAnswer());
        a.setScore(score);
        a.setFeedback(feedback);
        answerRepo.save(a);
        InterviewAttempt attempt = new InterviewAttempt();

        attempt.setUserId(userId); 

        attempt.setTopic(session.getTopic());
        attempt.setDifficulty(session.getDifficulty());

        attempt.setQuestion(q.getQuestionText());
        attempt.setUserAnswer(req.getAnswer());
        attempt.setModelAnswer(modelAnswer);
        attempt.setFeedback(feedback);

        attempt.setTextScore(score);
        attempt.setAnswerType("TEXT");
        attempt.setCreatedAt(LocalDateTime.now());

        attempt.setTestId(req.getTestId());
        attempt.setQuestionNumber(req.getQuestionNumber());

        attemptRepository.save(attempt);

        Map<String, Object> response = new HashMap<>();
        response.put("score", score);
        response.put("feedback", feedback);

        return response;
    }
}