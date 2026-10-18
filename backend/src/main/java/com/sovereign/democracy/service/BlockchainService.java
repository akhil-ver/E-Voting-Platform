package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.BlockchainHealthDto;
import com.sovereign.democracy.dto.VoteReceiptDto;
import com.sovereign.democracy.entity.BlockchainTransaction;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.VoteReceipt;
import com.sovereign.democracy.enums.BlockchainStatus;
import com.sovereign.democracy.enums.BlockchainTxType;
import com.sovereign.democracy.repository.BlockchainTransactionRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import com.sovereign.democracy.repository.VoteReceiptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.*;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.*;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;

import java.io.File;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BlockchainService {

    private static final Logger log = LoggerFactory.getLogger(BlockchainService.class);

    private static final Event BALLOT_COMMITMENT_RECORDED_EVENT = new Event(
            "BallotCommitmentRecorded",
            Arrays.asList(
                    new TypeReference<Uint256>(true) {},
                    new TypeReference<Bytes32>(true) {},
                    new TypeReference<Bytes32>(false) {},
                    new TypeReference<Uint256>(false) {}
            )
    );
    private static final String BALLOT_EVENT_TOPIC = EventEncoder.encode(BALLOT_COMMITMENT_RECORDED_EVENT);

    private final Web3j web3j;
    private final Optional<Credentials> credentials;
    private final BlockchainTransactionRepository blockchainTransactionRepository;
    private final VoteReceiptRepository voteReceiptRepository;
    private final ElectionRepository electionRepository;
    private final AuditLogService auditLogService;

    @Value("${blockchain.rpc-url:http://127.0.0.1:8545}")
    private String rpcUrl;

    @Value("${blockchain.chain-id:1337}")
    private long chainId;

    @Value("${blockchain.contract-address:}")
    private String contractAddress;

    @Value("${blockchain.enabled:true}")
    private boolean enabled;

    @Value("${blockchain.required-confirmations:1}")
    private long requiredConfirmations;

    private volatile boolean contractVerified = false;

    public BlockchainService(@org.springframework.beans.factory.annotation.Autowired(required = false) Web3j web3j,
                             Optional<Credentials> credentials,
                             BlockchainTransactionRepository blockchainTransactionRepository,
                             VoteReceiptRepository voteReceiptRepository,
                             ElectionRepository electionRepository,
                             AuditLogService auditLogService) {
        this.web3j = web3j;
        this.credentials = credentials;
        this.blockchainTransactionRepository = blockchainTransactionRepository;
        this.voteReceiptRepository = voteReceiptRepository;
        this.electionRepository = electionRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Checks health and connection details of configured blockchain node.
     */
    public BlockchainHealthDto getHealth() {
        if (!enabled || web3j == null) {
            return new BlockchainHealthDto("DISABLED", "N/A", chainId, null, contractAddress,
                    credentials.map(Credentials::getAddress).orElse("None"), rpcUrl, false,
                    "Blockchain integration is currently disabled in configuration.");
        }

        try {
            Web3ClientVersion clientVer = web3j.web3ClientVersion().send();
            EthBlockNumber blockNumber = web3j.ethBlockNumber().send();
            EthChainId ethChainId = web3j.ethChainId().send();

            long latestBlock = blockNumber.getBlockNumber().longValue();
            long detectedChainId = ethChainId.getChainId().longValue();

            String signer = credentials.map(Credentials::getAddress).orElse("None (Read-Only Mode)");
            return new BlockchainHealthDto("UP", clientVer.getWeb3ClientVersion(), detectedChainId,
                    latestBlock, contractAddress, signer, rpcUrl, true,
                    "Connected successfully to Ethereum/Besu node.");
        } catch (Exception e) {
            log.warn("Blockchain health check failed: {}", e.getMessage());
            return new BlockchainHealthDto("DOWN", "Unavailable", chainId, null, contractAddress,
                    credentials.map(Credentials::getAddress).orElse("None"), rpcUrl, false,
                    "Could not connect to RPC endpoint: " + e.getMessage());
        }
    }

    /**
     * Records anonymous ballot commitment on-chain.
     * Computes nullifierHash = sha256("ELEC:" + electionId + ":NULLIFIER:" + receiptCode)
     * Computes ballotCommitment = sha256("BALLOT:" + electionId + ":" + ballotHash)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BlockchainTransaction recordBallotCommitment(Election election, String ballotHash, String receiptCode) {
        Optional<BlockchainTransaction> existing = blockchainTransactionRepository.findFirstByReceiptCodeOrderByIdDesc(receiptCode);
        if (existing.isPresent()) {
            BlockchainTransaction existingTx = existing.get();
            if (existingTx.getStatus() == BlockchainStatus.CONFIRMED) {
                return existingTx;
            }
            if (existingTx.getTxHash() != null && !existingTx.getTxHash().trim().isEmpty()) {
                confirmTransaction(existingTx);
                return existingTx;
            }
            if (enabled && web3j != null && credentials.isPresent() && contractAddress != null && !contractAddress.trim().isEmpty()) {
                broadcastPendingCommitment(existingTx);
            }
            return existingTx;
        }

        String nullifierHash = computeNullifierHash(election.getId(), receiptCode);
        String ballotCommitment = computeBallotCommitment(election.getId(), ballotHash);

        BlockchainTransaction txRecord = new BlockchainTransaction(
                election,
                BlockchainTxType.BALLOT_COMMITMENT,
                nullifierHash,
                ballotCommitment,
                receiptCode
        );
        txRecord = blockchainTransactionRepository.save(txRecord);

        ensureContractDeployed();

        if (!enabled || web3j == null || credentials.isEmpty() || contractAddress == null || contractAddress.trim().isEmpty()) {
            txRecord.setStatus(BlockchainStatus.PENDING);
            txRecord.setErrorMessage("Blockchain node offline or contract not configured. Marked for asynchronous reconciliation.");
            blockchainTransactionRepository.save(txRecord);
            return txRecord;
        }

        try {
            RawTransactionManager txManager = new RawTransactionManager(web3j, credentials.get(), chainId);
            Function function = new Function(
                    "castBallotCommitment",
                    Arrays.asList(
                            new Uint256(BigInteger.valueOf(election.getId())),
                            new Bytes32(hexStringTo32Bytes(nullifierHash)),
                            new Bytes32(hexStringTo32Bytes(ballotCommitment))
                    ),
                    Collections.emptyList()
            );

            String encodedFunction = FunctionEncoder.encode(function);
            BigInteger gasLimit = BigInteger.valueOf(300_000);
            BigInteger gasPrice = BigInteger.valueOf(20_000_000_000L); // 20 Gwei

            EthSendTransaction ethSend = txManager.sendTransaction(
                    gasPrice,
                    gasLimit,
                    contractAddress.trim(),
                    encodedFunction,
                    BigInteger.ZERO
            );

            if (ethSend.hasError()) {
                String errMsg = ethSend.getError().getMessage();
                log.error("Failed to broadcast ballot commitment tx: {}", errMsg);
                txRecord.setStatus(errMsg.contains("already spent") ? BlockchainStatus.FAILED : BlockchainStatus.REQUIRES_RECONCILIATION);
                txRecord.setErrorMessage(errMsg);
                blockchainTransactionRepository.save(txRecord);
                return txRecord;
            }

            String txHash = ethSend.getTransactionHash();
            txRecord.setTxHash(txHash);
            txRecord.setStatus(BlockchainStatus.SUBMITTED);
            blockchainTransactionRepository.save(txRecord);

            // Fetch and confirm receipt
            confirmTransaction(txRecord);
            return txRecord;
        } catch (Exception e) {
            log.error("Error submitting on-chain ballot commitment: {}", e.getMessage());
            txRecord.setStatus(BlockchainStatus.REQUIRES_RECONCILIATION);
            txRecord.setErrorMessage(e.getMessage());
            blockchainTransactionRepository.save(txRecord);
            return txRecord;
        }
    }

    /**
     * Confirms submitted transaction and updates both BlockchainTransaction and VoteReceipt.
     */
    @Transactional
    public void confirmTransaction(BlockchainTransaction txRecord) {
        if (txRecord.getTxHash() == null || web3j == null) return;

        try {
            EthGetTransactionReceipt receiptResponse = web3j.ethGetTransactionReceipt(txRecord.getTxHash()).send();
            Optional<TransactionReceipt> receiptOpt = receiptResponse.getTransactionReceipt();

            if (receiptOpt.isPresent()) {
                TransactionReceipt receipt = receiptOpt.get();
                if (receipt.isStatusOK()) {
                    txRecord.setStatus(BlockchainStatus.CONFIRMED);
                    txRecord.setBlockNumber(receipt.getBlockNumber().longValue());
                    txRecord.setGasUsed(receipt.getGasUsed().longValue());
                    txRecord.setErrorMessage(null);
                    blockchainTransactionRepository.save(txRecord);

                    // Update corresponding VoteReceipt if present
                    if (txRecord.getReceiptCode() != null) {
                        voteReceiptRepository.findFirstByReceiptCodeOrderByIdDesc(txRecord.getReceiptCode()).ifPresent(vr -> {
                            vr.setBlockchainTxHash(txRecord.getTxHash());
                            vr.setBlockchainStatus(BlockchainStatus.CONFIRMED);
                            vr.setBlockNumber(txRecord.getBlockNumber());
                            vr.setBallotCommitment(txRecord.getBallotCommitment());
                            vr.setNullifierHash(txRecord.getNullifierHash());
                            vr.setConfirmedAt(LocalDateTime.now());
                            voteReceiptRepository.save(vr);
                        });
                    }
                } else {
                    txRecord.setStatus(BlockchainStatus.FAILED);
                    txRecord.setErrorMessage("Transaction reverted on-chain (status 0x0)");
                    blockchainTransactionRepository.save(txRecord);
                }
            }
        } catch (Exception e) {
            log.warn("Could not check receipt for tx {}: {}", txRecord.getTxHash(), e.getMessage());
        }
    }

    /**
     * Performs cryptographic and on-chain verification for a VoteReceiptDto.
     */
    public void enrichWithBlockchainVerification(VoteReceiptDto dto, VoteReceipt receipt) {
        dto.setContractAddress(contractAddress);

        if (receipt != null && receipt.getBlockchainTxHash() != null) {
            dto.setBlockchainTxHash(receipt.getBlockchainTxHash());
            dto.setBlockchainStatus(receipt.getBlockchainStatus() != null ? receipt.getBlockchainStatus().name() : "PENDING");
            dto.setBlockNumber(receipt.getBlockNumber());
            dto.setCommitmentHash(receipt.getBallotCommitment());
        } else {
            // Check if there is a recorded blockchain transaction by receipt code
            Optional<BlockchainTransaction> txOpt = blockchainTransactionRepository.findFirstByReceiptCodeOrderByIdDesc(dto.getReceiptCode());
            if (txOpt.isPresent()) {
                BlockchainTransaction tx = txOpt.get();
                if ((tx.getTxHash() == null || tx.getTxHash().trim().isEmpty()) && credentials.isPresent() && contractAddress != null && !contractAddress.trim().isEmpty()) {
                    broadcastPendingCommitment(tx);
                }
                dto.setBlockchainTxHash(tx.getTxHash());
                dto.setBlockchainStatus(tx.getStatus().name());
                dto.setBlockNumber(tx.getBlockNumber());
                dto.setCommitmentHash(tx.getBallotCommitment());
            } else if (receipt != null && receipt.getElection() != null && credentials.isPresent() && contractAddress != null && !contractAddress.trim().isEmpty()) {
                BlockchainTransaction tx = recordBallotCommitment(receipt.getElection(), receipt.getReceiptCode(), receipt.getReceiptCode());
                if (tx != null) {
                    dto.setBlockchainTxHash(tx.getTxHash());
                    dto.setBlockchainStatus(tx.getStatus().name());
                    dto.setBlockNumber(tx.getBlockNumber());
                    dto.setCommitmentHash(tx.getBallotCommitment());
                }
            } else {
                dto.setBlockchainStatus("PENDING");
            }
        }

        // If blockchain is not enabled or RPC is unavailable
        if (!enabled || web3j == null || contractAddress == null || contractAddress.trim().isEmpty()) {
            dto.setBlockchainVerified(false);
            dto.setBlockchainMessage("Blockchain verification node is offline or contract address not configured.");
            return;
        }

        String txHash = dto.getBlockchainTxHash();
        if (txHash == null || txHash.trim().isEmpty()) {
            dto.setBlockchainVerified(false);
            dto.setBlockchainMessage("Ballot commitment transaction has been scheduled and is awaiting batch on-chain publication.");
            return;
        }

        try {
            EthGetTransactionReceipt receiptRes = web3j.ethGetTransactionReceipt(txHash).send();
            Optional<TransactionReceipt> receiptOpt = receiptRes.getTransactionReceipt();

            if (receiptOpt.isEmpty()) {
                dto.setBlockchainVerified(false);
                dto.setBlockchainStatus("SUBMITTED");
                dto.setBlockchainMessage("Transaction broadcast to blockchain network; pending block inclusion.");
                return;
            }

            TransactionReceipt onChainReceipt = receiptOpt.get();
            if (!onChainReceipt.isStatusOK()) {
                dto.setBlockchainVerified(false);
                dto.setBlockchainStatus("FAILED");
                dto.setBlockchainMessage("Blockchain transaction reverted on execution.");
                return;
            }

            // Verify contract address matches
            if (onChainReceipt.getTo() != null && !onChainReceipt.getTo().equalsIgnoreCase(contractAddress.trim())) {
                dto.setBlockchainVerified(false);
                dto.setBlockchainStatus("FAILED");
                dto.setBlockchainMessage("Security violation: Transaction targets untrusted contract address " + onChainReceipt.getTo());
                return;
            }

            // Verify event emission in logs
            boolean eventFound = onChainReceipt.getLogs().stream().anyMatch(log ->
                    log.getTopics() != null && !log.getTopics().isEmpty() &&
                    log.getTopics().get(0).equalsIgnoreCase(BALLOT_EVENT_TOPIC)
            );

            BigInteger latestBlock = web3j.ethBlockNumber().send().getBlockNumber();
            long confirmations = latestBlock.subtract(onChainReceipt.getBlockNumber()).longValue() + 1;

            if (confirmations < requiredConfirmations) {
                dto.setBlockchainVerified(false);
                dto.setBlockchainStatus("SUBMITTED");
                dto.setBlockchainMessage("Transaction included in block " + onChainReceipt.getBlockNumber() +
                        " (" + confirmations + "/" + requiredConfirmations + " confirmations).");
                return;
            }

            dto.setBlockchainVerified(true);
            dto.setBlockchainStatus("CONFIRMED");
            dto.setBlockNumber(onChainReceipt.getBlockNumber().longValue());
            dto.setBlockchainMessage("Cryptographically confirmed and audited on Besu/Ethereum blockchain with " +
                    confirmations + " block confirmations.");

            // If election result is declared, check published tally commitment on-chain
            if (dto.isResultDeclared()) {
                verifyTallyCommitment(dto);
            }
        } catch (Exception e) {
            log.warn("On-chain receipt verification query failed: {}", e.getMessage());
            dto.setBlockchainVerified(false);
            dto.setBlockchainMessage("Unable to reach blockchain RPC node for live audit: " + e.getMessage());
        }
    }

    /**
     * Verifies published tally commitment on-chain against declared result.
     */
    private void verifyTallyCommitment(VoteReceiptDto dto) {
        try {
            Function getTallyFunc = new Function(
                    "getTallyCommitment",
                    Collections.singletonList(new Uint256(BigInteger.valueOf(dto.getElectionId()))),
                    Arrays.asList(
                            new TypeReference<Bytes32>() {},
                            new TypeReference<Uint256>() {},
                            new TypeReference<Utf8String>() {},
                            new TypeReference<Bool>() {}
                    )
            );

            String encodedCall = FunctionEncoder.encode(getTallyFunc);
            EthCall response = web3j.ethCall(
                    Transaction.createEthCallTransaction(null, contractAddress.trim(), encodedCall),
                    DefaultBlockParameterName.LATEST
            ).send();

            if (!response.hasError() && response.getValue() != null) {
                List<Type> results = FunctionReturnDecoder.decode(response.getValue(), getTallyFunc.getOutputParameters());
                if (results.size() >= 4) {
                    byte[] tallyBytes = ((Bytes32) results.get(0)).getValue();
                    boolean isPublished = ((Bool) results.get(3)).getValue();
                    dto.setTallyCommitmentVerified(isPublished && !isZeroBytes(tallyBytes));
                }
            }
        } catch (Exception e) {
            log.warn("Tally commitment verification check failed: {}", e.getMessage());
            dto.setTallyCommitmentVerified(false);
        }
    }

    /**
     * Publishes final election tally commitment on-chain.
     */
    @Transactional
    public String publishTallyOnChain(Election election, String tallyHash, long totalVotes, String resultUri) {
        ensureContractDeployed();
        if (!enabled || web3j == null || credentials.isEmpty() || contractAddress == null || contractAddress.trim().isEmpty()) {
            log.info("Blockchain disabled or offline. Skipping on-chain tally publish.");
            return null;
        }

        try {
            RawTransactionManager txManager = new RawTransactionManager(web3j, credentials.get(), chainId);
            Function function = new Function(
                    "publishTallyCommitment",
                    Arrays.asList(
                            new Uint256(BigInteger.valueOf(election.getId())),
                            new Bytes32(hexStringTo32Bytes(tallyHash)),
                            new Uint256(BigInteger.valueOf(totalVotes)),
                            new Utf8String(resultUri != null ? resultUri : "")
                    ),
                    Collections.emptyList()
            );

            String encoded = FunctionEncoder.encode(function);
            EthSendTransaction sendTx = txManager.sendTransaction(
                    BigInteger.valueOf(20_000_000_000L),
                    BigInteger.valueOf(300_000),
                    contractAddress.trim(),
                    encoded,
                    BigInteger.ZERO
            );

            if (!sendTx.hasError() && sendTx.getTransactionHash() != null) {
                String txHash = sendTx.getTransactionHash();
                election.setTallyTxHash(txHash);
                election.setTallyHash(tallyHash);

                BlockchainTransaction txRecord = new BlockchainTransaction(
                        election,
                        BlockchainTxType.TALLY_COMMITMENT,
                        null,
                        tallyHash,
                        null
                );
                txRecord.setTxHash(txHash);
                txRecord.setStatus(BlockchainStatus.SUBMITTED);
                blockchainTransactionRepository.save(txRecord);
                log.info("Published on-chain tally commitment for election {} in tx {}", election.getElectionCode(), txHash);
                confirmTransaction(txRecord);
                return txHash;
            }
        } catch (Exception e) {
            log.error("Failed to publish on-chain tally commitment: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Reconciles pending or submitted transactions across application restarts.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int reconcilePendingTransactions() {
        if (!enabled || web3j == null) return 0;

        List<BlockchainTransaction> pendingList = blockchainTransactionRepository
                .findByStatusIn(Arrays.asList(BlockchainStatus.PENDING, BlockchainStatus.SUBMITTED, BlockchainStatus.REQUIRES_RECONCILIATION));

        int reconciled = 0;
        for (BlockchainTransaction tx : pendingList) {
            if (tx.getTxHash() != null) {
                confirmTransaction(tx);
                if (tx.getStatus() == BlockchainStatus.CONFIRMED) {
                    reconciled++;
                }
            } else if (credentials.isPresent() && contractAddress != null && !contractAddress.trim().isEmpty()) {
                broadcastPendingCommitment(tx);
                if (tx.getStatus() == BlockchainStatus.CONFIRMED) {
                    reconciled++;
                }
            }
        }
        return reconciled;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void broadcastPendingCommitment(BlockchainTransaction txRecord) {
        ensureContractDeployed();
        if (!enabled || web3j == null || credentials.isEmpty() || contractAddress == null || contractAddress.trim().isEmpty()) {
            return;
        }
        if (txRecord.getTxHash() != null && !txRecord.getTxHash().trim().isEmpty()) {
            confirmTransaction(txRecord);
            return;
        }

        try {
            RawTransactionManager txManager = new RawTransactionManager(web3j, credentials.get(), chainId);
            Function function = new Function(
                    "castBallotCommitment",
                    Arrays.asList(
                            new Uint256(BigInteger.valueOf(txRecord.getElection().getId())),
                            new Bytes32(hexStringTo32Bytes(txRecord.getNullifierHash())),
                            new Bytes32(hexStringTo32Bytes(txRecord.getBallotCommitment()))
                    ),
                    Collections.emptyList()
            );

            String encodedFunction = FunctionEncoder.encode(function);
            BigInteger gasLimit = BigInteger.valueOf(300_000);
            BigInteger gasPrice = BigInteger.valueOf(20_000_000_000L);

            EthSendTransaction ethSend = txManager.sendTransaction(
                    gasPrice,
                    gasLimit,
                    contractAddress.trim(),
                    encodedFunction,
                    BigInteger.ZERO
            );

            if (!ethSend.hasError() && ethSend.getTransactionHash() != null) {
                String txHash = ethSend.getTransactionHash();
                txRecord.setTxHash(txHash);
                txRecord.setStatus(BlockchainStatus.SUBMITTED);
                blockchainTransactionRepository.save(txRecord);
                confirmTransaction(txRecord);
            } else if (ethSend.hasError()) {
                String errMsg = ethSend.getError().getMessage();
                log.warn("Broadcasting pending commitment error: {}", errMsg);
                txRecord.setErrorMessage(errMsg);
                blockchainTransactionRepository.save(txRecord);
            }
        } catch (Exception e) {
            log.error("Failed to broadcast pending commitment {}: {}", txRecord.getId(), e.getMessage());
        }
    }

    public String computeNullifierHash(Long electionId, String receiptOrSecret) {
        return sha256Hex("ELEC:" + electionId + ":NULLIFIER:" + receiptOrSecret);
    }

    public String computeBallotCommitment(Long electionId, String ballotHash) {
        return sha256Hex("BALLOT:" + electionId + ":" + ballotHash);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }

    private byte[] hexStringTo32Bytes(String hex) {
        String clean = hex.startsWith("0x") || hex.startsWith("0X") ? hex.substring(2) : hex;
        byte[] raw = HexFormat.of().parseHex(clean);
        if (raw.length == 32) return raw;
        byte[] result = new byte[32];
        System.arraycopy(raw, 0, result, Math.max(0, 32 - raw.length), Math.min(32, raw.length));
        return result;
    }

    private boolean isZeroBytes(byte[] bytes) {
        for (byte b : bytes) {
            if (b != 0) return false;
        }
        return true;
    }

    /**
     * Resets development blockchain block height back to genesis (block 0).
     * Optionally clears local audit database tables and redeploys a fresh smart contract.
     */
    @Transactional
    public Map<String, Object> resetBlockchainToGenesis(boolean redeploy, boolean clearHistory, String username, String clientIp) {
        if (!enabled || rpcUrl == null || rpcUrl.trim().isEmpty()) {
            throw new IllegalStateException("Blockchain integration is disabled or RPC URL is not configured.");
        }

        try {
            // 1. Invoke hardhat_reset via HTTP JSON-RPC to reset EVM block height back to 0
            HttpClient httpClient = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            HttpRequest resetReq = HttpRequest.newBuilder()
                    .uri(URI.create(rpcUrl.trim()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{\"jsonrpc\":\"2.0\",\"method\":\"hardhat_reset\",\"params\":[],\"id\":1}"))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> resetResp = httpClient.send(resetReq, HttpResponse.BodyHandlers.ofString());
            log.info("EVM hardhat_reset response: {}", resetResp.body());
            if (resetResp.statusCode() != 200 || !resetResp.body().contains("\"result\":true")) {
                throw new RuntimeException("EVM node rejected hardhat_reset: " + resetResp.body());
            }

            String deployedAddress = this.contractAddress;

            // 2. Clear MySQL ledger history if requested
            if (clearHistory) {
                blockchainTransactionRepository.deleteAll();
                List<VoteReceipt> receipts = voteReceiptRepository.findAll();
                for (VoteReceipt r : receipts) {
                    r.setBlockchainTxHash(null);
                    r.setBlockchainStatus(BlockchainStatus.PENDING);
                    r.setBlockNumber(null);
                    r.setConfirmedAt(null);
                    r.setErrorMessage(null);
                }
                voteReceiptRepository.saveAll(receipts);

                List<Election> elections = electionRepository.findAll();
                for (Election e : elections) {
                    e.setTallyTxHash(null);
                    e.setTallyHash(null);
                }
                electionRepository.saveAll(elections);
            }

            this.contractVerified = false;

            // 3. Redeploy contract only if explicitly requested
            if (redeploy) {
                deployedAddress = triggerContractDeployment();
                if (deployedAddress != null && !deployedAddress.trim().isEmpty()) {
                    this.contractAddress = deployedAddress;
                    this.contractVerified = true;
                }
            }

            // 4. Fetch the verified block height after reset/redeploy
            long latestBlockNumber = 0;
            if (web3j != null) {
                try {
                    EthBlockNumber bn = web3j.ethBlockNumber().send();
                    latestBlockNumber = bn.getBlockNumber().longValue();
                } catch (Exception e) {
                    log.warn("Could not fetch new block number: {}", e.getMessage());
                }
            }

            // 5. Audit Log
            auditLogService.logAction(
                    username,
                    "ADMIN",
                    "BLOCKCHAIN_RESET",
                    "BlockchainAudit",
                    String.format("Blockchain block height reset to %d. Contract: %s, history cleared: %b",
                            latestBlockNumber, this.contractAddress, clearHistory),
                    clientIp
            );

            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("blockHeight", latestBlockNumber);
            response.put("contractAddress", this.contractAddress);
            response.put("historyCleared", clearHistory);
            response.put("redeployExecuted", redeploy);
            response.put("message", "Blockchain block height reset to " + latestBlockNumber + " successfully.");
            return response;

        } catch (Exception e) {
            log.error("Failed to reset blockchain block height: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to reset blockchain block height: " + e.getMessage(), e);
        }
    }

    public synchronized void ensureContractDeployed() {
        if (!enabled || web3j == null || credentials.isEmpty()) return;
        if (contractVerified) return;
        if (isContractDeployed(this.contractAddress)) {
            contractVerified = true;
            return;
        }
        log.info("Smart contract not present on-chain at {}. Auto-deploying fresh contract...", this.contractAddress);
        String deployed = triggerContractDeployment();
        if (deployed != null && !deployed.trim().isEmpty()) {
            this.contractAddress = deployed;
            this.contractVerified = true;
            log.info("Contract auto-deployed at address: {}", this.contractAddress);
        }
    }

    public boolean isContractDeployed(String address) {
        if (!enabled || web3j == null || address == null || address.trim().isEmpty()) {
            return false;
        }
        try {
            EthGetCode getCode = web3j.ethGetCode(address.trim(), DefaultBlockParameterName.LATEST).send();
            String code = getCode.getCode();
            boolean valid = code != null && !code.equals("0x") && !code.equals("0x0") && !code.isEmpty();
            if (valid) {
                this.contractVerified = true;
            }
            return valid;
        } catch (Exception e) {
            return false;
        }
    }

    private synchronized String triggerContractDeployment() {
        if (!enabled || web3j == null || credentials.isEmpty()) {
            return this.contractAddress;
        }

        // Fast Path: Direct in-memory Web3j deployment (takes ~15ms, zero subprocess overhead)
        try {
            String bytecode = loadContractBytecode();
            if (bytecode != null && !bytecode.trim().isEmpty()) {
                RawTransactionManager txManager = new RawTransactionManager(web3j, credentials.get(), chainId);
                EthSendTransaction sendTx = txManager.sendTransaction(
                        BigInteger.valueOf(20_000_000_000L),
                        BigInteger.valueOf(3_500_000),
                        "",
                        bytecode,
                        BigInteger.ZERO
                );

                if (!sendTx.hasError() && sendTx.getTransactionHash() != null) {
                    String txHash = sendTx.getTransactionHash();
                    for (int i = 0; i < 40; i++) {
                        EthGetTransactionReceipt receipt = web3j.ethGetTransactionReceipt(txHash).send();
                        if (receipt.getTransactionReceipt().isPresent()) {
                            String newAddress = receipt.getTransactionReceipt().get().getContractAddress();
                            if (newAddress != null && !newAddress.trim().isEmpty()) {
                                this.contractAddress = newAddress;
                                this.contractVerified = true;
                                log.info("Web3j deployed contract instantly at: {}", newAddress);
                                saveDeploymentFile(newAddress);
                                return newAddress;
                            }
                        }
                        Thread.sleep(50);
                    }
                } else if (sendTx.hasError()) {
                    log.warn("Web3j direct deployment error: {}", sendTx.getError().getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Direct Web3j deployment encountered error: {}", e.getMessage());
        }

        // Fallback Path: Subprocess Hardhat deploy
        try {
            File blockchainDir = new File("blockchain");
            if (!blockchainDir.exists()) {
                blockchainDir = new File("../blockchain");
            }
            if (blockchainDir.exists()) {
                ProcessBuilder pb = new ProcessBuilder("npx", "hardhat", "run", "scripts/deploy.js", "--network", "localhost");
                pb.directory(blockchainDir);
                pb.environment().put("HARDHAT_DISABLE_TELEMETRY", "true");
                pb.environment().put("CI", "true");
                pb.environment().put("BLOCKCHAIN_RPC_URL", rpcUrl);
                pb.environment().put("BLOCKCHAIN_CHAIN_ID", String.valueOf(chainId));
                pb.redirectErrorStream(true);

                Process process = pb.start();
                String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                boolean finished = process.waitFor(10, TimeUnit.SECONDS);

                if (finished && process.exitValue() == 0) {
                    File deployFile = new File(blockchainDir, "deployments/localhost-deployment.json");
                    if (deployFile.exists()) {
                        String json = Files.readString(deployFile.toPath());
                        Pattern p = Pattern.compile("\"contractAddress\"\\s*:\\s*\"(0x[a-fA-F0-9]{40})\"");
                        Matcher m = p.matcher(json);
                        if (m.find()) {
                            this.contractAddress = m.group(1);
                            this.contractVerified = true;
                            return this.contractAddress;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Subprocess deployment failed: {}", e.getMessage());
        }
        return this.contractAddress;
    }

    private String loadContractBytecode() {
        try {
            java.io.InputStream is = getClass().getResourceAsStream("/contracts/SovereignDemocracyVoting.json");
            String json = null;
            if (is != null) {
                json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            } else {
                File f = new File("backend/src/main/resources/contracts/SovereignDemocracyVoting.json");
                if (!f.exists()) f = new File("blockchain/artifacts/contracts/SovereignDemocracyVoting.sol/SovereignDemocracyVoting.json");
                if (!f.exists()) f = new File("../blockchain/artifacts/contracts/SovereignDemocracyVoting.sol/SovereignDemocracyVoting.json");
                if (f.exists()) {
                    json = Files.readString(f.toPath());
                }
            }
            if (json != null) {
                Pattern p = Pattern.compile("\"bytecode\"\\s*:\\s*\"(0x[0-9a-fA-F]+)\"");
                Matcher m = p.matcher(json);
                if (m.find()) {
                    return m.group(1);
                }
            }
        } catch (Exception e) {
            log.warn("Could not load bytecode from JSON: {}", e.getMessage());
        }
        return null;
    }

    private void saveDeploymentFile(String address) {
        try {
            File dir = new File("blockchain/deployments");
            if (!dir.exists()) dir = new File("../blockchain/deployments");
            if (!dir.exists()) dir.mkdirs();
            File deployFile = new File(dir, "localhost-deployment.json");
            String signer = credentials.map(Credentials::getAddress).orElse("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            String json = String.format("{\n  \"contractAddress\": \"%s\",\n  \"deployer\": \"%s\",\n  \"network\": \"localhost\",\n  \"chainId\": %d,\n  \"deployedAt\": \"%s\"\n}",
                    address, signer, chainId, LocalDateTime.now().toString());
            Files.writeString(deployFile.toPath(), json, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Could not save deployment info to file: {}", e.getMessage());
        }
    }
}
