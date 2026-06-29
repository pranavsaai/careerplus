package com.pranav.interviewai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterviewWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    // send status update to specific user
    public void sendStatus(String userId, String status, String message) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/interview-status",
            Map.of(
                "status", status,
                "message", message,
                "timestamp", System.currentTimeMillis()
            )
        );
    }

    // notify question is being generated
    public void notifyGenerating(String userId, String topic) {
        sendStatus(userId, "GENERATING",
            "AI is crafting your " + topic + " question...");
    }

    // notify question is ready
    public void notifyQuestionReady(String userId, String question) {
        sendStatus(userId, "READY", question);
    }

    // notify evaluation in progress
    public void notifyEvaluating(String userId) {
        sendStatus(userId, "EVALUATING",
            "AI is evaluating your answer...");
    }

    // notify evaluation complete
    public void notifyEvaluationDone(String userId, int score) {
        sendStatus(userId, "EVALUATED",
            "Score: " + score + "/10");
    }

    // broadcast to all users — leaderboard update
    public void broadcastLeaderboardUpdate(String topic) {
        messagingTemplate.convertAndSend(
            "/topic/leaderboard",
            (Object) Map.of(
                "event", "LEADERBOARD_UPDATED",
                "topic", topic,
                "timestamp", System.currentTimeMillis()
            )
        );
    }
}