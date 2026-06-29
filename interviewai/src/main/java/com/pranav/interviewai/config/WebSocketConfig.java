package com.pranav.interviewai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // enable simple in-memory broker
        registry.enableSimpleBroker("/topic", "/queue");
        // prefix for messages from client to server
        registry.setApplicationDestinationPrefixes("/app");
        // prefix for user-specific messages
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins(frontendUrl, "http://localhost:3000")
            .withSockJS(); // fallback for older browsers
    }
}