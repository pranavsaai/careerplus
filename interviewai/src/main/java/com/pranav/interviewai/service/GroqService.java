package com.pranav.interviewai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;
    private final OkHttpClient client = new OkHttpClient.Builder()
        .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
        .build();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";

    // helper — single Groq call
    private String callGroq(String prompt) throws IOException {
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", MODEL);
        requestMap.put("messages", new Object[]{message});

        String json = mapper.writeValueAsString(requestMap);
        RequestBody body = RequestBody.create(json, MediaType.get("application/json"));

        Request request = new Request.Builder()
                .url(GROQ_URL)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        Response response = client.newCall(request).execute();
        if (!response.isSuccessful()) {
            return "Groq API Error: " + response.body().string();
        }

        JsonNode root = mapper.readTree(response.body().string());
        return root.path("choices").get(0)
                .path("message").path("content").asText();
    }

    // NEW — streaming Groq call via SSE
    public void streamEvaluationFeedback(
            String question,
            String answer,
            SseEmitter emitter) {

        new Thread(() -> {
            try {
                String prompt =
                    "You are a senior technical interviewer. Evaluate this interview answer.\n\n" +
                    "Question: " + question + "\n" +
                    "Answer: " + answer + "\n\n" +
                    "Give detailed feedback in this format:\n" +
                    "Score: X/10\n\n" +
                    "Strengths:\n- point1\n- point2\n\n" +
                    "Areas to Improve:\n- point1\n- point2\n\n" +
                    "Model Answer:\n[ideal answer here]";

                Map<String, Object> message = new HashMap<>();
                message.put("role", "user");
                message.put("content", prompt);

                Map<String, Object> requestMap = new HashMap<>();
                requestMap.put("model", MODEL);
                requestMap.put("messages", new Object[]{message});
                requestMap.put("stream", true); // enable streaming!

                String json = mapper.writeValueAsString(requestMap);
                RequestBody body = RequestBody.create(json, MediaType.get("application/json"));

                Request request = new Request.Builder()
                        .url(GROQ_URL)
                        .addHeader("Authorization", "Bearer " + apiKey)
                        .addHeader("Content-Type", "application/json")
                        .post(body)
                        .build();

                Response response = client.newCall(request).execute();

                if (!response.isSuccessful()) {
                    emitter.send(SseEmitter.event()
                        .name("error")
                        .data("Groq error: " + response.code()));
                    emitter.complete();
                    return;
                }

                // read stream line by line
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.body().byteStream())
                );

                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("data: ")) {
                        String data = line.substring(6).trim();

                        if (data.equals("[DONE]")) {
                            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                            emitter.complete();
                            break;
                        }

                        try {
                            JsonNode chunk = mapper.readTree(data);
                            String token = chunk.path("choices").get(0)
                                .path("delta").path("content").asText("");

                            if (!token.isEmpty()) {
                                emitter.send(SseEmitter.event().name("token").data(token));
                            }
                        } catch (Exception ignored) {
                            // skip malformed chunks
                        }
                    }
                }

            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                    emitter.completeWithError(e);
                } catch (Exception ignored) {}
            }
        }).start();
    }

    public String generateQuestion(String topic, String difficulty) {
        try {
            String prompt = "Generate ONE technical interview question for the topic: "
                    + topic + ". Difficulty level: " + difficulty
                    + ". Do NOT include answers. Only give the question.";
            return callGroq(prompt);
        } catch (IOException e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    public String generatePersonalizedQuestion(
            String topic,
            String difficulty,
            List<String> skills,
            List<String> technologies,
            String experienceLevel,
            String dominantDomain) {
        try {
            String skillsStr = skills != null ? String.join(", ", skills) : "general";
            String techStr = technologies != null ? String.join(", ", technologies) : "general";

            String prompt = """
                You are a senior technical interviewer conducting a personalized interview.

                Candidate Profile:
                - Experience Level: %s
                - Dominant Domain: %s
                - Skills: %s
                - Technologies: %s

                Generate ONE highly specific technical interview question for the topic: %s
                Difficulty: %s

                Rules:
                - Reference their actual skills/technologies where relevant
                - Make it specific to their experience level
                - Do NOT include the answer
                - Only return the question, nothing else
                """.formatted(experienceLevel, dominantDomain, skillsStr, techStr, topic, difficulty);

            return callGroq(prompt);
        } catch (IOException e) {
            e.printStackTrace();
            return generateQuestion(topic, difficulty);
        }
    }

    public String evaluateAnswer(String question, String answer) {
        try {
            String prompt = "Evaluate the interview answer.\n"
                    + "Question: " + question + "\n"
                    + "Answer: " + answer + "\n\n"
                    + "Return ONLY valid JSON with no explanation:\n"
                    + "{ \"score\": number(1-10), \"feedback\": \"text\" }";
            return callGroq(prompt);
        } catch (Exception e) {
            e.printStackTrace();
            return "Evaluation Error";
        }
    }

    public String evaluateVoiceAnswer(String question, String transcript) {
        try {
            String prompt =
                "You are an AI technical interview evaluator.\n\n" +
                "Question:\n" + question + "\n\n" +
                "Spoken Answer Transcript:\n" + transcript + "\n\n" +
                "Return ONLY valid JSON. No explanation. No markdown.\n" +
                "{\n" +
                "  \"contentScore\": number,\n" +
                "  \"grammarScore\": number,\n" +
                "  \"fluencyScore\": number,\n" +
                "  \"keywordScore\": number,\n" +
                "  \"clarityScore\": number,\n" +
                "  \"overallScore\": number,\n" +
                "  \"feedback\": \"text\"\n" +
                "}";
            return callGroq(prompt);
        } catch (Exception e) {
            e.printStackTrace();
            return "Voice Evaluation Error";
        }
    }

    public String extractSkills(String text) {
        try {
            String prompt =
                "Extract only technical skills from the text below.\n" +
                "Return ONLY valid raw JSON.\n" +
                "Format: {\"skills\": [\"skill1\", \"skill2\"]}\n\n" + text;
            return callGroq(prompt);
        } catch (Exception e) {
            e.printStackTrace();
            return "{\"skills\":[]}";
        }
    }

    public String generateModelAnswer(String question) {
        try {
            String prompt =
                "You are a senior technical interviewer.\n\n" +
                "Provide a high-quality structured ideal answer for:\n\n" +
                "Question:\n" + question + "\n\n" +
                "Return only the answer. No extra explanation.";
            return callGroq(prompt);
        } catch (Exception e) {
            e.printStackTrace();
            return "Model Answer Generation Error";
        }
    }
}