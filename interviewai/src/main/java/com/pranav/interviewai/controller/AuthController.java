package com.pranav.interviewai.controller;

import com.pranav.interviewai.entity.User;
import com.pranav.interviewai.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;

import com.pranav.interviewai.config.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (userRepo.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already exists"));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());

        userRepo.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered"));
    }

    @PostMapping("/login")
public ResponseEntity<?> login(
        @RequestBody User request,
        HttpServletResponse response) {

    User user = userRepo.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid credentials"));
    }

    String token = jwtUtil.generateToken(user.getEmail());

    ResponseCookie cookie = ResponseCookie.from("jwt", token)
            .httpOnly(true)
            .secure(false) 
            .path("/")
            .maxAge(-1)
            .sameSite("Lax")
            .build();

    response.addHeader("Set-Cookie", cookie.toString());

    return ResponseEntity.ok(Map.of(
            "message", "Login successful",
            "name", user.getName()
    ));
}
@PostMapping("/logout")
public ResponseEntity<?> logout(HttpServletResponse response) {

    ResponseCookie cookie = ResponseCookie.from("jwt", "")
            .httpOnly(true)
            .secure(false)
            .path("/")
            .maxAge(0)
            .build();

    response.addHeader("Set-Cookie", cookie.toString());

    return ResponseEntity.ok(Map.of("message", "Logged out"));
}
}
