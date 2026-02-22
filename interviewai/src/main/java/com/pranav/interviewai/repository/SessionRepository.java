package com.pranav.interviewai.repository;

import com.pranav.interviewai.entity.Session;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SessionRepository
        extends MongoRepository<Session, String> {
}