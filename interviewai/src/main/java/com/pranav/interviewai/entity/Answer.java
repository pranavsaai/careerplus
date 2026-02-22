package com.pranav.interviewai.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "answers")
public class Answer {

    @Id
    private String id;
    
    private String questionId;
    private String userAnswer;
    private int score;
    private String feedback;
}