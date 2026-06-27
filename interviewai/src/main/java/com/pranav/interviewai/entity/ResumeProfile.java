package com.pranav.interviewai.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "resume_profiles")
public class ResumeProfile {

    @Id
    private String id;

    private String userId;

    // raw text extracted from PDF
    private String rawText;

    // AI extracted fields
    private List<String> skills;
    private List<String> technologies;
    private String experienceLevel; // Fresher / Junior / Mid / Senior
    private List<String> projects;
    private String dominantDomain;  // e.g. "Full Stack", "ML", "DevOps"
    private List<String> suggestedTopics; // topics for interview

    private LocalDateTime uploadedAt;
}