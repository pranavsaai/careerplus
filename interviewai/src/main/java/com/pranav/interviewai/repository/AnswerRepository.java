package com.pranav.interviewai.repository;

import com.pranav.interviewai.entity.Answer;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AnswerRepository extends MongoRepository<Answer, String> {
}
