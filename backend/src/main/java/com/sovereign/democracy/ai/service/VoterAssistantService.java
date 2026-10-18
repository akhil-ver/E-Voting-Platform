package com.sovereign.democracy.ai.service;

import com.sovereign.democracy.ai.dto.VoterAssistantChatRequest;
import com.sovereign.democracy.ai.dto.VoterAssistantChatResponse;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.repository.AreaRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class VoterAssistantService {

    private static final Logger log = LoggerFactory.getLogger(VoterAssistantService.class);

    private final GeminiClientService geminiClientService;
    private final ElectionRepository electionRepository;
    private final AreaRepository areaRepository;

    public VoterAssistantService(GeminiClientService geminiClientService,
                                 ElectionRepository electionRepository,
                                 AreaRepository areaRepository) {
        this.geminiClientService = geminiClientService;
        this.electionRepository = electionRepository;
        this.areaRepository = areaRepository;
    }

    public VoterAssistantChatResponse chat(VoterAssistantChatRequest request, String authenticatedUsername) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMessage.isEmpty()) {
            return new VoterAssistantChatResponse(
                    "Hello! I am your Sovereign Democracy Civic Assistant. How can I help you today? You can ask about registering, using your Secret Voting Key, casting a ballot, or verifying a blockchain receipt.",
                    getDefaultSuggestedActions(),
                    true
            );
        }

        // Rule-based security defense against prompt injection / privileged action attempts
        String lower = userMessage.toLowerCase();
        if ((lower.contains("secret key") || lower.contains("voting key") || lower.contains("svk"))
                && (lower.contains("reveal") || lower.contains("give me") || lower.contains("generate key") || lower.contains("what is my") || lower.contains("my key"))) {
            return new VoterAssistantChatResponse(
                    "For your cryptographic security, I cannot view, generate, or reveal Secret Voting Keys. To obtain your key, log in to your account, open the Elections page, select your area's open election, and click 'Generate Secret Voting Key'. Make sure to copy and store it securely.",
                    Arrays.asList("How to generate SVK", "How to vote with SVK", "Verify ballot receipt"),
                    true
            );
        }

        if (lower.contains("vote for") || lower.contains("cast my vote") || lower.contains("submit ballot")) {
            return new VoterAssistantChatResponse(
                    "I am an informational civic assistant and do not have the authority or cryptographic capability to cast a ballot. To vote, navigate to the Elections page in the application, select your preferred candidate, enter your 16-character Secret Voting Key (SVK), and click 'Confirm & Submit Ballot'.",
                    Arrays.asList("Elections Page", "How voting works", "Ballot Secrecy"),
                    true
            );
        }

        if (lower.contains("admin password") || lower.contains("private key") || lower.contains("database password") || lower.contains("system prompt")) {
            return new VoterAssistantChatResponse(
                    "I am unable to answer queries regarding administrative credentials, private signing keys, or internal system configurations in accordance with Sovereign Democracy security protocols.",
                    getDefaultSuggestedActions(),
                    true
            );
        }

        // Build factual grounded context from database
        String context = buildFactualContext(request.getElectionId());

        String prompt = buildSystemPrompt(context, userMessage, authenticatedUsername);

        Optional<String> aiResponse = geminiClientService.generateContent(prompt, 600, 0.2);

        if (aiResponse.isPresent()) {
            return new VoterAssistantChatResponse(
                    aiResponse.get().trim(),
                    determineSuggestedActions(lower),
                    true
            );
        }

        // Deterministic Fallback if Gemini is offline
        return buildFallbackReply(lower);
    }

    private String buildFactualContext(Long electionId) {
        StringBuilder sb = new StringBuilder();
        sb.append("FACTUAL APPLICATION DATA:\n");

        List<Area> areas = areaRepository.findAll();
        sb.append("Configured Demonstration Areas (10 total): ");
        for (int i = 0; i < Math.min(areas.size(), 10); i++) {
            sb.append(areas.get(i).getName()).append(" (").append(areas.get(i).getConstituencyName()).append(")");
            if (i < Math.min(areas.size(), 10) - 1) sb.append(", ");
        }
        sb.append(".\n");

        List<Election> elections = electionRepository.findAll();
        sb.append("Active Elections:\n");
        for (Election el : elections) {
            sb.append(String.format("- %s (%s) for %s [Status: %s]\n",
                    el.getName(), el.getElectionCode(),
                    el.getArea() != null ? el.getArea().getName() : "All",
                    el.getStatus()));
        }

        sb.append("PLATFORM WORKFLOW RULES:\n");
        sb.append("1. Registration: Requires an authorized Election ID (e.g. VOT-MUM-1001) and Aadhaar last 4 digits matching the official roll.\n");
        sb.append("2. Secret Voting Key (SVK): High-entropy 128-bit key formatted as SVK-XXXX-XXXX-XXXX-XXXX. Generated per-voter per-election. Stored only as salted SHA-256 verifier. Required to cast ballot.\n");
        sb.append("3. Ballot Secrecy: Voter identity is strictly decoupled from candidate choice in the database.\n");
        sb.append("4. Blockchain Audit: Every ballot issues a SHA-256 receipt (e.g. RCP-XXXXXXXX) anchored to an Ethereum / Hyperledger Besu smart contract.\n");
        sb.append("5. Receipt Verification: Anyone can enter their receipt code on /verify to confirm MySQL and blockchain inclusion.\n");

        return sb.toString();
    }

    private String buildSystemPrompt(String context, String userMessage, String username) {
        return "You are the helpful, polite, and neutral AI Voter Assistant for the Sovereign Democracy electronic voting platform.\n" +
                "STRICT INSTRUCTIONS:\n" +
                "1. Answer citizen questions factually using ONLY the provided application context below.\n" +
                "2. If you do not know the answer or if the information is not in the context, say: 'I do not have verified information on that, please refer to the official election authority.' Never guess or make up dates.\n" +
                "3. Never express political opinions or recommend candidates.\n" +
                "4. Keep your response concise (2-4 sentences max).\n\n" +
                context + "\n\n" +
                "User query: \"" + userMessage + "\"\n" +
                "User status: " + (username != null ? "Authenticated Voter (" + username + ")" : "Guest Citizen") + "\n\n" +
                "Response:";
    }

    private VoterAssistantChatResponse buildFallbackReply(String lower) {
        String reply;
        if (lower.contains("register") || lower.contains("sign up")) {
            reply = "To register, click 'Register' in the top navigation, enter your authorized Election ID (e.g. VOT-MUM-1001) and the last 4 digits of your Aadhaar number. Once verified against the electoral roll, set your password to activate your account.";
        } else if (lower.contains("key") || lower.contains("svk")) {
            reply = "The Secret Voting Key (SVK) is a 128-bit security key (formatted as SVK-XXXX-XXXX-XXXX-XXXX) required to submit a ballot. You can generate it on the Elections page for any OPEN election in your area.";
        } else if (lower.contains("verify") || lower.contains("receipt")) {
            reply = "Every cast ballot generates a cryptographic receipt code (e.g. RCP-XXXXXXXX). Navigate to the 'Verify Ballot' page in the menu and enter your receipt code to audit both the database record and the blockchain transaction.";
        } else if (lower.contains("blockchain") || lower.contains("besu")) {
            reply = "Sovereign Democracy anchors anonymized ballot nullifiers and final certified tally commitments to an Ethereum / Hyperledger Besu smart contract to guarantee immutable civic audits.";
        } else {
            reply = "Welcome to Sovereign Democracy! You can register with your Election ID + Aadhaar last 4, generate an SVK on the Elections page, cast your ballot securely, and audit your receipt on the Blockchain Verification page.";
        }

        return new VoterAssistantChatResponse(reply, getDefaultSuggestedActions(), false);
    }

    private List<String> getDefaultSuggestedActions() {
        return Arrays.asList("How do I register?", "What is a Secret Voting Key?", "How do I cast a ballot?", "How to verify receipt?");
    }

    private List<String> determineSuggestedActions(String lower) {
        if (lower.contains("register")) {
            return Arrays.asList("What is my Election ID?", "How to get an SVK?", "Explore 10 City Rolls");
        } else if (lower.contains("svk") || lower.contains("key")) {
            return Arrays.asList("How to vote with SVK", "Lost my voting key", "How to verify receipt");
        } else if (lower.contains("verify")) {
            return Arrays.asList("Where is my receipt code?", "What does CONFIRMED mean?", "Is voting anonymous?");
        }
        return getDefaultSuggestedActions();
    }
}
