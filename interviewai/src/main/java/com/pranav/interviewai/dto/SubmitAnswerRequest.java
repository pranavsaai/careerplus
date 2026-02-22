package com.pranav.interviewai.dto;

import lombok.Data;

@Data
public class SubmitAnswerRequest {

    private String questionId;
    private String answer;
    private String testId;
    private int questionNumber;
}
