package com.pranav.interviewai.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "questions")
public class Question {

    @Id
    private String id;
    private String topic;
    private String difficulty;
    private String sessionId;
    private String questionText;
    private String modelAnswer;
}