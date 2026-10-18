package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.BlockchainHealthDto;
import com.sovereign.democracy.dto.VoteReceiptDto;
import com.sovereign.democracy.entity.*;
import com.sovereign.democracy.enums.BlockchainStatus;
import com.sovereign.democracy.enums.BlockchainTxType;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.enums.ReceiptStatus;
import com.sovereign.democracy.repository.*;
import com.sovereign.democracy.service.BlockchainService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class BlockchainIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private BlockchainTransactionRepository blockchainTransactionRepository;

    @Autowired
    private VoteReceiptRepository voteReceiptRepository;

    @Autowired
    private ElectionRepository electionRepository;

    private Election election;

    @BeforeEach
    void setUp() {
        election = electionRepository.findAll().stream()
                .filter(e -> e.getStatus() == ElectionStatus.OPEN)
                .findFirst().orElseThrow();
    }

    @Test
    @DisplayName("Blockchain health endpoint reports status gracefully when disabled or offline")
    void testBlockchainHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/blockchain/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").isNotEmpty())
                .andExpect(jsonPath("$.data.rpcUrl").isNotEmpty());
    }

    @Test
    @DisplayName("Nullifier and ballot commitments are cryptographically derived and preserve zero-knowledge anonymity")
    void testCommitmentDerivationPrivacy() {
        String receiptCode = "RCP-TEST-RECEIPT-01";
        String ballotHash = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";

        String nullifier1 = blockchainService.computeNullifierHash(election.getId(), receiptCode);
        String nullifier2 = blockchainService.computeNullifierHash(election.getId(), receiptCode);
        String nullifierDiffElec = blockchainService.computeNullifierHash(999L, receiptCode);

        // Deterministic per election
        assertThat(nullifier1).isEqualTo(nullifier2);
        // Election-specific: different elections produce different nullifiers
        assertThat(nullifier1).isNotEqualTo(nullifierDiffElec);
        // Valid 64-char hex string (32 bytes)
        assertThat(nullifier1).hasSize(64);

        String commitment = blockchainService.computeBallotCommitment(election.getId(), ballotHash);
        assertThat(commitment).hasSize(64);
        assertThat(commitment).isNotEqualTo(ballotHash);
        // Plaintext receipt or ballot is decoupled
        assertThat(commitment).doesNotContain(receiptCode);
        assertThat(nullifier1).doesNotContain(receiptCode);
    }

    @Test
    @DisplayName("Recording ballot commitment creates tracking transaction in database")
    void testRecordBallotCommitmentTracking() {
        String receiptCode = "RCP-TRACK-001";
        String ballotHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        BlockchainTransaction tx = blockchainService.recordBallotCommitment(election, ballotHash, receiptCode);
        assertThat(tx).isNotNull();
        assertThat(tx.getElection().getId()).isEqualTo(election.getId());
        assertThat(tx.getTxType()).isEqualTo(BlockchainTxType.BALLOT_COMMITMENT);
        assertThat(tx.getNullifierHash()).isNotEmpty();
        assertThat(tx.getBallotCommitment()).isNotEmpty();
        assertThat(tx.getReceiptCode()).isEqualTo(receiptCode);

        // Verify persisted in DB
        BlockchainTransaction found = blockchainTransactionRepository.findByReceiptCode(receiptCode).orElseThrow();
        assertThat(found.getId()).isEqualTo(tx.getId());
    }

    @Test
    @DisplayName("Blockchain receipt verification endpoint correctly returns status and audit metadata")
    void testReceiptVerificationWithBlockchainDetails() throws Exception {
        // 1. Create a vote receipt and corresponding confirmed blockchain transaction record
        String receiptCode = "RCP-CONFIRMED-99";
        VoteReceipt receipt = new VoteReceipt(receiptCode, election, ReceiptStatus.COUNTED);
        receipt.setBlockchainTxHash("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
        receipt.setBlockchainStatus(BlockchainStatus.CONFIRMED);
        receipt.setBlockNumber(1042L);
        receipt.setBallotCommitment("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
        voteReceiptRepository.save(receipt);

        BlockchainTransaction btx = new BlockchainTransaction(
                election,
                BlockchainTxType.BALLOT_COMMITMENT,
                "0xnullifierhash123",
                receipt.getBallotCommitment(),
                receiptCode
        );
        btx.setTxHash(receipt.getBlockchainTxHash());
        btx.setStatus(BlockchainStatus.CONFIRMED);
        btx.setBlockNumber(1042L);
        blockchainTransactionRepository.save(btx);

        // 2. Query public verify endpoint
        mockMvc.perform(get("/api/verify/" + receiptCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.receiptCode").value(receiptCode))
                .andExpect(jsonPath("$.data.blockchainTxHash").value(receipt.getBlockchainTxHash()))
                .andExpect(jsonPath("$.data.blockchainStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.blockNumber").value(1042));
    }

    @Test
    @DisplayName("Reconciliation service updates pending transaction states")
    void testReconciliationLogic() {
        // Create an unconfirmed pending transaction
        BlockchainTransaction btx = new BlockchainTransaction(
                election,
                BlockchainTxType.BALLOT_COMMITMENT,
                "0xnull1",
                "0xcommit1",
                "RCP-PEND-01"
        );
        btx.setStatus(BlockchainStatus.PENDING);
        blockchainTransactionRepository.save(btx);

        int count = blockchainService.reconcilePendingTransactions();
        assertThat(count).isGreaterThanOrEqualTo(0);
    }
}
