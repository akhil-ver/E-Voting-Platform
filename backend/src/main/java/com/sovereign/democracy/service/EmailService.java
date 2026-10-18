package com.sovereign.democracy.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final String appBaseUrl;
    private final String mailFrom;
    private final String mailUsername;
    private final String mailPassword;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    // In-memory holder for demonstration / testing environments (without exposing to logs)
    private final ConcurrentHashMap<String, String> lastResetLinks = new ConcurrentHashMap<>();

    public EmailService(
            @Value("${app.base-url:http://localhost:3000}") String appBaseUrl,
            @Value("${mail.from:akhilv.verma07@gmail.com}") String mailFrom,
            @Value("${spring.mail.username:akhilv.verma07@gmail.com}") String mailUsername,
            @Value("${spring.mail.password:}") String mailPassword) {
        this.appBaseUrl = appBaseUrl.endsWith("/") ? appBaseUrl.substring(0, appBaseUrl.length() - 1) : appBaseUrl;
        this.mailFrom = mailFrom;
        this.mailUsername = mailUsername;
        this.mailPassword = mailPassword != null ? mailPassword.trim() : "";
    }

    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        String resetLink = appBaseUrl + "/reset-password#token=" + rawToken;
        lastResetLinks.put(toEmail.toLowerCase().trim(), resetLink);

        // Security requirement: Never log raw tokens or passwords in plaintext logs
        logger.info("Password reset requested for recovery address [{}] via URL fragment hash delivery.",
                maskEmail(toEmail));

        // Always print a developer link to terminal for instant testing when SMTP is pending configuration
        System.out.println("\n================================================================================");
        System.out.println("[PASSWORD RESET NOTIFICATION] Recipient: " + maskEmail(toEmail));
        System.out.println("Reset Link (expires in 15 min): " + resetLink);
        System.out.println("================================================================================\n");

        // If JavaMailSender is available and MAIL_PASSWORD is provided, send real email
        if (mailSender != null && !mailPassword.isEmpty()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                String senderAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : mailUsername;
                helper.setFrom(senderAddress, "Sovereign Democracy Support");
                helper.setTo(toEmail.trim());
                helper.setSubject("Reset Your Password - Sovereign Democracy");

                String htmlContent = buildHtmlResetEmail(resetLink);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                logger.info("Successfully dispatched password reset email via SMTP to [{}]", maskEmail(toEmail));
            } catch (Exception ex) {
                logger.error("Failed to send SMTP email to [{}]: {}. Ensure MAIL_PASSWORD has a valid Google App Password.",
                        maskEmail(toEmail), ex.getMessage());
            }
        } else {
            if (mailPassword.isEmpty()) {
                logger.warn("SMTP email not sent because MAIL_PASSWORD / spring.mail.password is empty. " +
                        "To deliver directly to your Gmail inbox, generate a Google App Password and run with: export MAIL_PASSWORD='your-16-char-app-password'");
            } else {
                logger.warn("JavaMailSender bean is not available in current configuration.");
            }
        }
    }

    private String buildHtmlResetEmail(String resetLink) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head><meta charset='UTF-8'><style>"
                + "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }"
                + ".card { max-width: 540px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }"
                + ".header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }"
                + ".title { color: #38bdf8; font-size: 20px; font-weight: 700; margin: 0; }"
                + ".subtitle { color: #94a3b8; font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em; }"
                + ".content { line-height: 1.6; font-size: 14px; color: #cbd5e1; }"
                + ".btn-container { text-align: center; margin: 28px 0; }"
                + ".btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px; }"
                + ".callout { background-color: #0f172a; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 12px; color: #cbd5e1; }"
                + ".footer { margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }"
                + ".link-box { word-break: break-all; font-family: monospace; font-size: 12px; background: #0f172a; padding: 10px; border-radius: 6px; color: #93c5fd; margin-top: 8px; }"
                + "</style></head>"
                + "<body>"
                + "<div class='card'>"
                + "  <div class='header'>"
                + "    <h2 class='title'>Sovereign Democracy</h2>"
                + "    <div class='subtitle'>Official Security & Identity Platform</div>"
                + "  </div>"
                + "  <div class='content'>"
                + "    <p>Hello,</p>"
                + "    <p>We received a request to reset your password for your Sovereign Democracy voter account.</p>"
                + "    <div class='btn-container'>"
                + "      <a href='" + resetLink + "' class='btn' target='_blank'>Reset Password</a>"
                + "    </div>"
                + "    <p>Or copy and paste this link into your browser:</p>"
                + "    <div class='link-box'>" + resetLink + "</div>"
                + "    <div class='callout'>"
                + "      <strong>Important:</strong> This recovery link is single-use only and expires in <strong>15 minutes</strong>. If you did not request this password reset, please ignore this email; your account remains secure."
                + "    </div>"
                + "  </div>"
                + "  <div class='footer'>"
                + "    &copy; 2026 Sovereign Democracy Platform. Cryptographically protected."
                + "  </div>"
                + "</div>"
                + "</body></html>";
    }

    public String getLastResetLink(String email) {
        return lastResetLinks.get(email.toLowerCase().trim());
    }

    public void clearLastResetLink(String email) {
        lastResetLinks.remove(email.toLowerCase().trim());
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "*@" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}
