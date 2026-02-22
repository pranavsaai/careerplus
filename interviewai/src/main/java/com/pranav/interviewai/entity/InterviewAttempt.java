package com.pranav.interviewai.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "interview_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder  
public class InterviewAttempt {

    @Id
    private String id;
    private String userId;

    private String topic;
    private String difficulty;
    private String answerType;
    private String audioUrl;
    private Long timeTakenSeconds;
    private String testId;       
    private int questionNumber;   

    private String question;
    private String userAnswer;
    private String modelAnswer;
    private String feedback;

    private Integer textScore;
    private Integer voiceScore;

    private Integer contentScore;
    private Integer grammarScore;
    private Integer fluencyScore;
    private Integer keywordScore;
    private Integer clarityScore;

    private LocalDateTime createdAt;

    // Explicit setters (add these if Lombok @Data is not working)
    public void setTextScore(Integer textScore) {
        this.textScore = textScore;
    }

    public void setVoiceScore(Integer voiceScore) {
        this.voiceScore = voiceScore;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setTestId(String testId) {
        this.testId = testId;
    }

    public void setQuestionNumber(int questionNumber) {
        this.questionNumber = questionNumber;
    }

    // Explicit getters if needed
    public Integer getTextScore() {
        return textScore;
    }

    public Integer getVoiceScore() {
        return voiceScore;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getTestId() {
        return testId;
    }

    public int getQuestionNumber() {
        return questionNumber;
    }

    public String getQuestion() {
        return question;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public String getModelAnswer() {
        return modelAnswer;
    }

    public String getFeedback() {
        return feedback;
    }

    public String getTopic() {
        return topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public String getAnswerType() {
        return answerType;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public Integer getContentScore() {
        return contentScore;
    }

    public Integer getGrammarScore() {
        return grammarScore;
    }

    public Integer getFluencyScore() {
        return fluencyScore;
    }

    public Integer getKeywordScore() {
        return keywordScore;
    }

    public Integer getClarityScore() {
        return clarityScore;
    }
}