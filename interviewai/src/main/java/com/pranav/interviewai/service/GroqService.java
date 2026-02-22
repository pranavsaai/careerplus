package com.pranav.interviewai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;
    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public String generateQuestion(String topic, String difficulty) {

        try {
            String prompt =
            "Generate ONE technical interview question for the topic: "
            + topic +
            ". Difficulty level: " + difficulty +
            ". Do NOT include answers. Only give the question.";

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);

            Map<String, Object> requestMap = new HashMap<>();
            requestMap.put("model", "llama-3.1-8b-instant");
            requestMap.put("messages", new Object[]{message});

            String json = mapper.writeValueAsString(requestMap);

            RequestBody body = RequestBody.create(
                    json,
                    MediaType.get("application/json")
            );

            Request request = new Request.Builder()
                    .url("https://api.groq.com/openai/v1/chat/completions")
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();

            Response response = client.newCall(request).execute();

            if (!response.isSuccessful()) {
                return "Groq API Error: " + response.body().string();
            }

            JsonNode root = mapper.readTree(response.body().string());

            String question =
                    root.path("choices")
                        .get(0)
                        .path("message")
                        .path("content")
                        .asText();

            return question;

        } catch (IOException e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    public String evaluateAnswer(String question, String answer) {
    try {
        String prompt =
        "Evaluate the interview answer.\n"
      + "Question: " + question + "\n"
      + "Answer: " + answer + "\n\n"
      + "Return ONLY valid JSON with no explanation:\n"
      + "{ \"score\": number(1-10), \"feedback\": \"text\" }";

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", "llama-3.1-8b-instant");
        requestMap.put("messages", new Object[]{message});

        String json = mapper.writeValueAsString(requestMap);

        RequestBody body =
                RequestBody.create(json, MediaType.get("application/json"));

        Request request = new Request.Builder()
                .url("https://api.groq.com/openai/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        Response response = client.newCall(request).execute();
        JsonNode root = mapper.readTree(response.body().string());

        return root.path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText();

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
        "IMPORTANT RULES:\n" +
        "- Evaluate relevance to question.\n" +
        "- Evaluate grammar.\n" +
        "- Evaluate fluency.\n" +
        "- Evaluate keyword usage.\n" +
        "- Evaluate clarity.\n" +
        "- If answer is unrelated, contentScore must be 0.\n\n" +
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

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", "llama-3.1-8b-instant");
        requestMap.put("messages", new Object[]{message});

        String json = mapper.writeValueAsString(requestMap);

        RequestBody body = RequestBody.create(json, MediaType.get("application/json"));
        
        Request request = new Request.Builder()
                .url("https://api.groq.com/openai/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        Response response = client.newCall(request).execute();

        JsonNode root = mapper.readTree(response.body().string());

        return root.path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText();

    } catch (Exception e) {
        e.printStackTrace();
        return "Voice Evaluation Error";
    }
}
public String extractSkills(String text) {

    try {

        String prompt =
    "Extract only technical skills from the text below.\n" +
    "Return ONLY valid raw JSON. Do not include explanations.\n" +
    "Format strictly as:\n" +
    "{\"skills\": [\"skill1\", \"skill2\"]}\n\n" +
    text;

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", "llama-3.1-8b-instant");
        requestMap.put("messages", new Object[]{message});

        String json = mapper.writeValueAsString(requestMap);

        RequestBody body =
                RequestBody.create(json, MediaType.get("application/json"));

        Request request = new Request.Builder()
                .url("https://api.groq.com/openai/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        Response response = client.newCall(request).execute();

        JsonNode root = mapper.readTree(response.body().string());

        return root.path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText();

    } catch (Exception e) {
        e.printStackTrace();
        return "{\"skills\":[]}";
    }
}
public String generateModelAnswer(String question) {

    try {

        String prompt =
        "You are a senior technical interviewer.\n\n" +
        "Provide a high-quality, structured, ideal answer for the following interview question.\n\n" +
        "The answer must:\n" +
        "- Be technically accurate\n" +
        "- Be well structured\n" +
        "- Include explanation\n" +
        "- Include example if applicable\n" +
        "- Be concise but complete\n\n" +
        "Question:\n" + question + "\n\n" +
        "Return only the answer. No extra explanation.";

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", "llama-3.1-8b-instant");
        requestMap.put("messages", new Object[]{message});

        String json = mapper.writeValueAsString(requestMap);

        RequestBody body =
                RequestBody.create(json, MediaType.get("application/json"));

        Request request = new Request.Builder()
                .url("https://api.groq.com/openai/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        Response response = client.newCall(request).execute();

        JsonNode root = mapper.readTree(response.body().string());

        return root.path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText();

    } catch (Exception e) {
        e.printStackTrace();
        return "Model Answer Generation Error";
    }
}
}