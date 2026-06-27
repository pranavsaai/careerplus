package com.pranav.interviewai.repository;

import com.pranav.interviewai.entity.ResumeProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ResumeProfileRepository extends MongoRepository<ResumeProfile, String> {
    Optional<ResumeProfile> findTopByUserIdOrderByUploadedAtDesc(String userId);
}