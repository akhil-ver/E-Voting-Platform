const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SovereignDemocracyVoting with account:", deployer.address);

  const Voting = await hre.ethers.getContractFactory("SovereignDemocracyVoting");
  const contract = await Voting.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("SovereignDemocracyVoting deployed successfully to:", address);

  const deploymentInfo = {
    contractAddress: address,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 1337,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, `${hre.network.name}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment information saved to deployments/" + hre.network.name + "-deployment.json");
  return address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
