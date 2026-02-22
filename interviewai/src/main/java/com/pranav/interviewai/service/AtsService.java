package com.pranav.interviewai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AtsService {

    private final GroqService groqService;

    public AtsService(GroqService groqService) {
        this.groqService = groqService;
    }

    public Map<String, Object> analyze(String resumeText, String jdText) throws Exception {

    List<String> resumeSkills = extractSkills(resumeText);
    List<String> jdSkills = extractSkills(jdText);

    Set<String> matched = new HashSet<>(resumeSkills);
    matched.retainAll(jdSkills);

    Set<String> missing = new HashSet<>(jdSkills);
    missing.removeAll(resumeSkills);

    int atsScore = 0;
    if (!jdSkills.isEmpty()) {
        atsScore = (matched.size() * 100) / jdSkills.size();
    }

    List<String> matchedList = new ArrayList<>(matched);
    List<String> missingList = new ArrayList<>(missing);

    Map<String, Object> result = new HashMap<>();
    result.put("atsScore", atsScore);
    result.put("matchedSkills", matchedList);
    result.put("missingSkills", missingList);

    return result;
}

    private List<String> extractSkills(String text) throws Exception {

        String response = groqService.extractSkills(text);

        ObjectMapper mapper = new ObjectMapper();
        String cleaned = response
        .replace("```json", "")
        .replace("```", "")
        .trim();

        JsonNode node = mapper.readTree(cleaned);

        List<String> skills = new ArrayList<>();
        for (JsonNode skill : node.get("skills")) {
            skills.add(skill.asText().toLowerCase());
        }

        return skills;
    }
}
