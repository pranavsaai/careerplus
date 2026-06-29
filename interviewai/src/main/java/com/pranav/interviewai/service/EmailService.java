package com.pranav.interviewai.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendWelcomeEmail(String toEmail, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Welcome to CareerPlus 🚀");
            helper.setFrom("noreply@careerplus.ai");

            // use replace instead of formatted() to avoid % conflicts in CSS
            String html = getTemplate().replace("{{NAME}}", name);
            helper.setText(html, true);
            mailSender.send(message);

            System.out.println("Welcome email sent to: " + toEmail);

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Email send failed: " + e.getClass().getName() + " - " + e.getMessage());
        }
    }

    private String getTemplate() {
        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'/><style>" +
            "body{margin:0;padding:0;background:#05080f;font-family:'Segoe UI',sans-serif;}" +
            ".container{max-width:600px;margin:40px auto;background:#0d1117;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);}" +
            ".header{background:linear-gradient(135deg,#0f172a,#1e293b);padding:40px;text-align:center;border-bottom:1px solid rgba(34,211,238,0.2);}" +
            ".logo{font-size:28px;font-weight:800;color:#22d3ee;letter-spacing:-1px;}" +
            ".tagline{color:#64748b;font-size:13px;margin-top:6px;}" +
            ".body{padding:40px;}" +
            ".greeting{font-size:22px;font-weight:700;color:#e2e8f0;margin-bottom:16px;}" +
            ".text{color:#94a3b8;font-size:15px;line-height:1.7;margin-bottom:24px;}" +
            ".features{background:#0f172a;border-radius:12px;padding:24px;margin:24px 0;border:1px solid rgba(255,255,255,0.06);}" +
            ".feature{display:flex;align-items:center;gap:12px;margin-bottom:14px;color:#cbd5e1;font-size:14px;}" +
            ".feature:last-child{margin-bottom:0;}" +
            ".dot{width:8px;height:8px;border-radius:50%;background:#22d3ee;flex-shrink:0;display:inline-block;margin-right:8px;}" +
            ".btn{display:inline-block;background:linear-gradient(135deg,#22d3ee,#818cf8);color:#05080f;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;}" +
            ".footer{padding:24px 40px;text-align:center;color:#334155;font-size:12px;border-top:1px solid rgba(255,255,255,0.05);}" +
            "</style></head><body>" +
            "<div class='container'>" +
            "<div class='header'><div class='logo'>CareerPlus</div><div class='tagline'>AI-Powered Interview Platform</div></div>" +
            "<div class='body'>" +
            "<div class='greeting'>Welcome, {{NAME}}! 👋</div>" +
            "<p class='text'>You've just joined CareerPlus — your personal AI interview coach. We're excited to help you land your dream job!</p>" +
            "<div class='features'>" +
            "<div class='feature'><span class='dot'></span> Upload your resume and get personalized interview questions</div>" +
            "<div class='feature'><span class='dot'></span> Practice with AI-powered voice and text interviews</div>" +
            "<div class='feature'><span class='dot'></span> Get detailed feedback with scores and model answers</div>" +
            "<div class='feature'><span class='dot'></span> Download PDF reports of your sessions</div>" +
            "<div class='feature'><span class='dot'></span> Compete on the global leaderboard</div>" +
            "</div>" +
            "<p class='text'>Ready to start your interview prep journey?</p>" +
            "<div style='text-align:center;'><a href='https://careerplus-rho.vercel.app' class='btn'>Start Practicing</a></div>" +
            "</div>" +
            "<div class='footer'>2026 CareerPlus - Built for job seekers</div>" +
            "</div></body></html>";
    }
}