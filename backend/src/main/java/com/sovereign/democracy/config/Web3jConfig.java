package com.sovereign.democracy.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

import java.util.Optional;

@Configuration
public class Web3jConfig {

    private static final Logger log = LoggerFactory.getLogger(Web3jConfig.class);

    @Value("${blockchain.rpc-url:http://127.0.0.1:8545}")
    private String rpcUrl;

    @Value("${blockchain.signer-private-key:}")
    private String privateKey;

    @Value("${blockchain.enabled:true}")
    private boolean enabled;

    @Bean
    public Web3j web3j() {
        if (!enabled) {
            log.info("Blockchain integration is explicitly disabled via configuration");
            return null;
        }
        try {
            log.info("Initializing Web3j connecting to RPC endpoint: {}", rpcUrl);
            return Web3j.build(new HttpService(rpcUrl));
        } catch (Exception e) {
            log.warn("Could not connect Web3j to RPC endpoint: {}. Reason: {}", rpcUrl, e.getMessage());
            return null;
        }
    }

    @Bean
    public Credentials credentials() {
        if (privateKey == null || privateKey.trim().isEmpty()) {
            log.warn("No BLOCKCHAIN_SIGNER_PRIVATE_KEY configured. Read-only blockchain interaction enabled.");
            return null;
        }
        try {
            String cleanKey = privateKey.trim();
            if (cleanKey.startsWith("0x") || cleanKey.startsWith("0X")) {
                cleanKey = cleanKey.substring(2);
            }
            Credentials creds = Credentials.create(cleanKey);
            log.info("Loaded blockchain signer account: {}", creds.getAddress());
            return creds;
        } catch (Exception e) {
            log.error("Failed to load blockchain signer private key: {}", e.getMessage());
            return null;
        }
    }
}
