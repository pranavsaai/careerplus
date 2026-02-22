package com.pranav.interviewai.controller;

import com.pranav.interviewai.entity.User;
import com.pranav.interviewai.repository.UserRepository;
import com.pranav.interviewai.service.AtsService;
import com.pranav.interviewai.service.ResumeParserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ats")
@RequiredArgsConstructor
public class AtsController {

    private final ResumeParserService parserService;
    private final AtsService atsService;
    private final UserRepository userRepo;

    private User getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepo.findByEmail(email).orElseThrow();
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(
            @RequestParam("resume") MultipartFile resume,
            @RequestParam("jobDescription") String jobDescription
    ) throws Exception {

        User user = getCurrentUser(); 

        String resumeText = parserService.extractText(resume);

        Map<String, Object> result =
                atsService.analyze(resumeText, jobDescription);

        return ResponseEntity.ok(result);
    }
}