package com.pranav.interviewai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pranav.interviewai.entity.ResumeProfile;
import com.pranav.interviewai.repository.ResumeProfileRepository;
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
import java.util.Map;

@Service
public class ResumeService {

    private final ResumeProfileRepository resumeRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final MediaType JSON_TYPE = MediaType.get("application/json; charset=utf-8");

    public ResumeService(ResumeProfileRepository resumeRepo) {
        this.resumeRepo = resumeRepo;
    }

    public String extractTextFromPdf(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    public ResumeProfile analyzeResume(String userId, String rawText) throws Exception {

        // trim to 3000 chars to avoid token limit
        String trimmed = rawText.length() > 3000
            ? rawText.substring(0, 3000) : rawText;

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
            - dominantDomain: one of Full Stack / ML / DevOps / Backend / Frontend / Data
            - suggestedTopics: 5-8 interview topics based on their background
            """.formatted(trimmed);

        String reqBody = objectMapper.writeValueAsString(Map.of(
            "model", "llama3-8b-8192",
            "messages", List.of(Map.of(
                "role", "user",
                "content", prompt
            )),
            "temperature", 0.3,
            "max_tokens", 800
        ));

        OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
            .build();

        Request req = new Request.Builder()
            .url(GROQ_URL)
            .addHeader("Authorization", "Bearer " + groqApiKey)
            .addHeader("Content-Type", "application/json")
            .post(RequestBody.create(reqBody, JSON_TYPE))
            .build();

        try (Response res = client.newCall(req).execute()) {
            if (!res.isSuccessful()) {
                String errBody = res.body() != null ? res.body().string() : "no body";
                throw new Exception("Groq API error: " + res.code() + " body: " + errBody);
            }

            String body = res.body().string();
            JsonNode root = objectMapper.readTree(body);

            // safe null check on choices
            JsonNode choices = root.path("choices");
            if (choices.isNull() || !choices.isArray() || choices.size() == 0) {
                throw new Exception("Groq returned empty choices. Response: " + body);
            }

            String content = choices.get(0)
                .path("message")
                .path("content")
                .asText("");

            if (content.isBlank()) {
                throw new Exception("Groq returned empty content");
            }

            // clean markdown fences if any
            content = content.replaceAll("(?s)```json|```", "").trim();

            // extract JSON object if extra text around it
            int start = content.indexOf("{");
            int end = content.lastIndexOf("}");
            if (start != -1 && end != -1) {
                content = content.substring(start, end + 1);
            }

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

    private List<String> toList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(n -> list.add(n.asText()));
        }
        return list;
    }

    public ResumeProfile getLatestProfile(String userId) {
        return resumeRepo.findTopByUserIdOrderByUploadedAtDesc(userId)
            .orElse(null);
    }
}