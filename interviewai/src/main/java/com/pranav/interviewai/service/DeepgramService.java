package com.pranav.interviewai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class DeepgramService {

    @Value("${deepgram.api.key}")
    private String apiKey;

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public String transcribeAudio(File audioFile) {

        try {

            RequestBody body = RequestBody.create(
                    audioFile,
                    MediaType.parse("audio/wav")
            );

            Request request = new Request.Builder()
                    .url("https://api.deepgram.com/v1/listen")
                    .addHeader("Authorization", "Token " + apiKey)
                    .addHeader("Content-Type", "audio/wav")
                    .post(body)
                    .build();

            Response response = client.newCall(request).execute();

            JsonNode root = mapper.readTree(response.body().string());

            return root
                    .path("results")
                    .path("channels")
                    .get(0)
                    .path("alternatives")
                    .get(0)
                    .path("transcript")
                    .asText();

        } catch (IOException e) {
            e.printStackTrace();
            return "Deepgram Exception";
        }
    }
}