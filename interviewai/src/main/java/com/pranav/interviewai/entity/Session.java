package com.pranav.interviewai.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "sessions")
public class Session {

    @Id
    private String id;
    private String userId;

    private String topic;
    private String difficulty;
    private LocalDateTime startTime;
    private String testId;
}
