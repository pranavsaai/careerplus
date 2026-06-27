package com.pranav.interviewai.controller;

import com.pranav.interviewai.entity.ResumeProfile;
import com.pranav.interviewai.entity.User;
import com.pranav.interviewai.repository.UserRepository;
import com.pranav.interviewai.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final UserRepository userRepo;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepo.findByEmail(email).orElseThrow();
    }

    // POST /api/resume/upload — upload PDF resume
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only PDF files allowed"));
            }

            User user = getCurrentUser();

            // extract text from PDF
            String rawText = resumeService.extractTextFromPdf(file);

            if (rawText.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Could not extract text from PDF"));
            }

            // analyze with Groq AI
            ResumeProfile profile = resumeService.analyzeResume(user.getId(), rawText);

            return ResponseEntity.ok(Map.of(
                "message", "Resume analyzed successfully!",
                "skills", profile.getSkills(),
                "technologies", profile.getTechnologies(),
                "experienceLevel", profile.getExperienceLevel(),
                "dominantDomain", profile.getDominantDomain(),
                "suggestedTopics", profile.getSuggestedTopics(),
                "projects", profile.getProjects()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Resume analysis failed: " + e.getMessage()));
        }
    }

    // GET /api/resume/profile — get latest analyzed resume
    @GetMapping("/profile")
    public ResponseEntity<?> getResumeProfile() {
        try {
            User user = getCurrentUser();
            ResumeProfile profile = resumeService.getLatestProfile(user.getId());

            if (profile == null) {
                return ResponseEntity.ok(Map.of("exists", false));
            }

            return ResponseEntity.ok(Map.of(
                "exists", true,
                "skills", profile.getSkills(),
                "technologies", profile.getTechnologies(),
                "experienceLevel", profile.getExperienceLevel(),
                "dominantDomain", profile.getDominantDomain(),
                "suggestedTopics", profile.getSuggestedTopics(),
                "projects", profile.getProjects(),
                "uploadedAt", profile.getUploadedAt()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }
}