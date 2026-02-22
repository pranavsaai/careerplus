package com.pranav.interviewai.repository;

import com.pranav.interviewai.entity.InterviewAttempt;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface InterviewAttemptRepository extends MongoRepository<InterviewAttempt, String> {
    List<InterviewAttempt> findByUserId(String userId);
    List<InterviewAttempt> findByUserIdAndTopicIgnoreCase(String userId, String topic);
}
