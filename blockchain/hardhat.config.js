require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
      chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || "1337", 10),
      accounts: process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY]
        : ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
    },
    besu: {
      url: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
      chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || "1337", 10),
      accounts: process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY]
        : ["0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63"],
    },
  },
};
