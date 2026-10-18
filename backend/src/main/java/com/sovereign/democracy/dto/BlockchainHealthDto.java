package com.sovereign.democracy.dto;

public class BlockchainHealthDto {
    private String status;
    private String clientVersion;
    private Long chainId;
    private Long latestBlock;
    private String contractAddress;
    private String signerAddress;
    private String rpcUrl;
    private boolean connected;
    private String message;

    public BlockchainHealthDto() {}

    public BlockchainHealthDto(String status, String clientVersion, Long chainId, Long latestBlock,
                               String contractAddress, String signerAddress, String rpcUrl,
                               boolean connected, String message) {
        this.status = status;
        this.clientVersion = clientVersion;
        this.chainId = chainId;
        this.latestBlock = latestBlock;
        this.contractAddress = contractAddress;
        this.signerAddress = signerAddress;
        this.rpcUrl = rpcUrl;
        this.connected = connected;
        this.message = message;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getClientVersion() { return clientVersion; }
    public void setClientVersion(String clientVersion) { this.clientVersion = clientVersion; }

    public Long getChainId() { return chainId; }
    public void setChainId(Long chainId) { this.chainId = chainId; }

    public Long getLatestBlock() { return latestBlock; }
    public void setLatestBlock(Long latestBlock) { this.latestBlock = latestBlock; }

    public String getContractAddress() { return contractAddress; }
    public void setContractAddress(String contractAddress) { this.contractAddress = contractAddress; }

    public String getSignerAddress() { return signerAddress; }
    public void setSignerAddress(String signerAddress) { this.signerAddress = signerAddress; }

    public String getRpcUrl() { return rpcUrl; }
    public void setRpcUrl(String rpcUrl) { this.rpcUrl = rpcUrl; }

    public boolean isConnected() { return connected; }
    public void setConnected(boolean connected) { this.connected = connected; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
