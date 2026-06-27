package com.pranav.interviewai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pranav.interviewai.entity.ResumeProfile;
import com.pranav.interviewai.repository.ResumeProfileRepository;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeProfileRepository resumeRepo;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final MediaType JSON_TYPE = MediaType.get("application/json; charset=utf-8");

    // step 1 — extract text from PDF using PDFBox
    public String extractTextFromPdf(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    // step 2 — send to Groq, get structured JSON back
    public ResumeProfile analyzeResume(String userId, String rawText) throws Exception {

        String prompt = """
            You are a resume parser. Analyze the resume text below and return ONLY a valid JSON object.
            No explanation, no markdown, no backticks. Just raw JSON.

            Resume Text:
            %s

            Return this exact JSON structure:
            {
              "skills": ["skill1", "skill2"],
              "technologies": ["tech1", "tech2"],
              "experienceLevel": "Fresher",
              "projects": ["project1", "project2"],
              "dominantDomain": "Full Stack",
              "suggestedTopics": ["Java", "Spring Boot", "System Design"]
            }

            Rules:
            - skills: programming languages, frameworks, tools
            - technologies: databases, cloud, DevOps tools
            - experienceLevel: one of Fresher / Junior / Mid / Senior
            - projects: project names only
            - dominantDomain: overall area (Full Stack / ML / DevOps / Backend / Frontend / Data)
            - suggestedTopics: 5-8 interview topics based on their background
            """.formatted(rawText.substring(0, Math.min(rawText.length(), 3000)));

        String reqBody = objectMapper.writeValueAsString(java.util.Map.of(
            "model", "llama3-8b-8192",
            "messages", List.of(java.util.Map.of(
                "role", "user",
                "content", prompt
            )),
            "temperature", 0.3,
            "max_tokens", 800
        ));

        OkHttpClient client = new OkHttpClient();
        Request req = new Request.Builder()
            .url(GROQ_URL)
            .addHeader("Authorization", "Bearer " + groqApiKey)
            .addHeader("Content-Type", "application/json")
            .post(RequestBody.create(reqBody, JSON_TYPE))
            .build();

        try (Response res = client.newCall(req).execute()) {
            String body = res.body().string();
            JsonNode root = objectMapper.readTree(body);
            String content = root.path("choices").get(0)
                .path("message").path("content").asText();

            // clean any accidental markdown fences
            content = content.replaceAll("```json|```", "").trim();

            JsonNode parsed = objectMapper.readTree(content);

            ResumeProfile profile = new ResumeProfile();
            profile.setUserId(userId);
            profile.setRawText(rawText);
            profile.setUploadedAt(LocalDateTime.now());

            profile.setSkills(toList(parsed.path("skills")));
            profile.setTechnologies(toList(parsed.path("technologies")));
            profile.setExperienceLevel(parsed.path("experienceLevel").asText("Fresher"));
            profile.setProjects(toList(parsed.path("projects")));
            profile.setDominantDomain(parsed.path("dominantDomain").asText("Full Stack"));
            profile.setSuggestedTopics(toList(parsed.path("suggestedTopics")));

            return resumeRepo.save(profile);
        }
    }

    // helper — JsonNode array to List<String>
    private List<String> toList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> list.add(n.asText()));
        }
        return list;
    }

    // get latest resume profile for user
    public ResumeProfile getLatestProfile(String userId) {
        return resumeRepo.findTopByUserIdOrderByUploadedAtDesc(userId)
            .orElse(null);
    }
}