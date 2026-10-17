package com.studycollab.service.email;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final Resend resend;
    private final String fromEmail;
    private final String clientBaseUrl;

    public EmailService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from-email:onboarding@resend.dev}") String fromEmail,
            @Value("${app.frontend-url:http://localhost:5173}") String clientBaseUrl
    ) {
        this.resend = (apiKey != null && !apiKey.isBlank()) ? new Resend(apiKey) : null;
        this.fromEmail = fromEmail;
        this.clientBaseUrl = clientBaseUrl;
    }

    @Async
    public void sendVerificationEmail(String recipientEmail, String token) {
        if (resend == null) {
            log.warn("Resend API key is not configured. Skipping verification email to {}", recipientEmail);
            return;
        }

        String confirmationUrl = clientBaseUrl + "/verify-email?token=" + token;

        String htmlBody = """
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <h2>Verify your email address</h2>
              <p>Thanks for signing up for StudyCollab! Click the button below to confirm your account:</p>
              <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Verify Email</a>
              <p style="color: #6B7280; font-size: 14px;">This link expires in 24 hours.</p>
            </div>
            """.formatted(confirmationUrl);

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(fromEmail)
                .to(recipientEmail)
                .subject("StudyCollab - Verify your email address")
                .html(htmlBody)
                .build();

        try {
            CreateEmailResponse response = resend.emails().send(params);
            log.info("Email sent successfully with ID: {}", response.getId());
        } catch (Exception e) {
            log.error("Failed to send email via Resend to {}: {}", recipientEmail, e.getMessage(), e);
        }
    }
}