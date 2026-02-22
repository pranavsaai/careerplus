package com.pranav.interviewai.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "interview_tests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewTest {

    @Id
    private String id;

    private String topic;
    private String difficulty;
    private String userId;

    private List<InterviewAttempt> questions;

    private Integer finalScore;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    private Long totalTimeSeconds;
}