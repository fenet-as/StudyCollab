package com.studycollab.service.email;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String smtpUsername;
    private final Resend resend;
    private final String resendFromEmail;
    private final String clientBaseUrl;

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String smtpUsername,
            @Value("${resend.api-key:}") String resendApiKey,
            @Value("${resend.from-email:onboarding@resend.dev}") String resendFromEmail,
            @Value("${app.frontend-url:http://localhost:5173}") String clientBaseUrl
    ) {
        this.mailSender = mailSender;
        this.smtpUsername = smtpUsername;
        this.resend = (resendApiKey != null && !resendApiKey.isBlank()) ? new Resend(resendApiKey) : null;
        this.resendFromEmail = resendFromEmail;
        this.clientBaseUrl = clientBaseUrl;
    }

    @Async
    public void sendVerificationEmail(String recipientEmail, String token) {
        String confirmationUrl = clientBaseUrl + "/verify-email?token=" + token;

        String htmlBody = """
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <h2>Verify your email address</h2>
              <p>Thanks for signing up for StudyCollab! Click the button below to confirm your account:</p>
              <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Verify Email</a>
              <p style="color: #6B7280; font-size: 14px;">This link expires in 24 hours.</p>
            </div>
            """.formatted(confirmationUrl);

        // 1. Try sending via SMTP (e.g. Gmail) if configured
        if (mailSender != null && smtpUsername != null && !smtpUsername.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(smtpUsername, "StudyCollab");
                helper.setTo(recipientEmail);
                helper.setSubject("StudyCollab - Verify your email address");
                helper.setText(htmlBody, true);

                mailSender.send(message);
                log.info("Verification email sent via SMTP to: {}", recipientEmail);
                return;
            } catch (Exception e) {
                log.error("Failed to send verification email via SMTP to {}: {}", recipientEmail, e.getMessage(), e);
            }
        }

        // 2. Fallback to Resend if configured
        if (resend != null) {
            try {
                CreateEmailOptions params = CreateEmailOptions.builder()
                        .from(resendFromEmail)
                        .to(recipientEmail)
                        .subject("StudyCollab - Verify your email address")
                        .html(htmlBody)
                        .build();

                CreateEmailResponse response = resend.emails().send(params);
                log.info("Verification email sent via Resend with ID: {}", response.getId());
                return;
            } catch (Exception e) {
                log.error("Failed to send verification email via Resend to {}: {}", recipientEmail, e.getMessage(), e);
            }
        }

        log.warn("No email provider configured (SPRING_MAIL_USERNAME or RESEND_API_KEY). Skipping email to {}", recipientEmail);
    }
}