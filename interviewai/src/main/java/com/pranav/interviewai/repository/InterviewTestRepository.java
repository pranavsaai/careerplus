package com.pranav.interviewai.repository;

import com.pranav.interviewai.entity.InterviewTest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface InterviewTestRepository 
        extends MongoRepository<InterviewTest, String> {

    List<InterviewTest> findByTopicIgnoreCase(String topic);
    List<InterviewTest> findByUserId(String userId);
    List<InterviewTest> findByUserIdAndTopicIgnoreCase(String userId, String topic);
}
