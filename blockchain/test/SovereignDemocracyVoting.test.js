const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SovereignDemocracyVoting Smart Contract", function () {
  let contract;
  let authority;
  let unauthorized;

  const electionId = 1;
  const electionCode = "ELEC-2026-MUM-01";

  // Sample keccak256 / SHA-256 hashes
  const nullifier1 = ethers.keccak256(ethers.toUtf8Bytes("voter-1-nullifier"));
  const nullifier2 = ethers.keccak256(ethers.toUtf8Bytes("voter-2-nullifier"));
  const ballotCommitment1 = ethers.keccak256(ethers.toUtf8Bytes("ballot-choice-hash-1"));
  const ballotCommitment2 = ethers.keccak256(ethers.toUtf8Bytes("ballot-choice-hash-2"));
  const tallyHash = ethers.keccak256(ethers.toUtf8Bytes("final-tally-results"));

  beforeEach(async function () {
    [authority, unauthorized] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("SovereignDemocracyVoting");
    contract = await Voting.deploy();
    await contract.waitForDeployment();
  });

  it("Should set deployer as election authority", async function () {
    expect(await contract.electionAuthority()).to.equal(authority.address);
  });

  it("Should allow authority to configure an election", async function () {
    await expect(contract.configureElection(electionId, electionCode))
      .to.emit(contract, "ElectionConfigured")
      .withArgs(electionId, electionCode, (await ethers.provider.getBlock("latest")).timestamp + 1);

    const el = await contract.elections(electionId);
    expect(el.electionId).to.equal(electionId);
    expect(el.electionCode).to.equal(electionCode);
    expect(el.state).to.equal(1); // CONFIGURED
  });

  it("Should reject configuration by non-authority", async function () {
    await expect(
      contract.connect(unauthorized).configureElection(electionId, electionCode)
    ).to.be.revertedWith("Only authorized election authority can execute this");
  });

  it("Should transition election states: CONFIGURED -> OPEN -> CLOSED", async function () {
    await contract.configureElection(electionId, electionCode);

    await expect(contract.openElection(electionId))
      .to.emit(contract, "ElectionOpened")
      .withArgs(electionId, (await ethers.provider.getBlock("latest")).timestamp + 1);

    let el = await contract.elections(electionId);
    expect(el.state).to.equal(2); // OPEN

    await expect(contract.closeElection(electionId))
      .to.emit(contract, "ElectionClosed");

    el = await contract.elections(electionId);
    expect(el.state).to.equal(3); // CLOSED
  });

  it("Should record valid ballot commitments and reject duplicates for same nullifier", async function () {
    await contract.configureElection(electionId, electionCode);
    await contract.openElection(electionId);

    // 1. Cast first ballot
    await expect(contract.castBallotCommitment(electionId, nullifier1, ballotCommitment1))
      .to.emit(contract, "BallotCommitmentRecorded")
      .withArgs(electionId, nullifier1, ballotCommitment1, (await ethers.provider.getBlock("latest")).timestamp + 1);

    // Verify inclusion
    const [recorded, timestamp] = await contract.verifyBallot(electionId, nullifier1, ballotCommitment1);
    expect(recorded).to.be.true;
    expect(timestamp).to.be.greaterThan(0);

    expect(await contract.isBallotCommitmentRecorded(electionId, ballotCommitment1)).to.be.true;

    // 2. Reject duplicate vote with same nullifier
    await expect(
      contract.castBallotCommitment(electionId, nullifier1, ballotCommitment2)
    ).to.be.revertedWith("Duplicate vote rejected: nullifier already spent");

    // 3. Second voter with different nullifier succeeds
    await contract.castBallotCommitment(electionId, nullifier2, ballotCommitment2);
    const el = await contract.elections(electionId);
    expect(el.totalBallotsCast).to.equal(2);
  });

  it("Should reject ballot commitment when election is not OPEN", async function () {
    await contract.configureElection(electionId, electionCode);
    // State is CONFIGURED, not OPEN
    await expect(
      contract.castBallotCommitment(electionId, nullifier1, ballotCommitment1)
    ).to.be.revertedWith("Voting is not open for this election");
  });

  it("Should allow publishing certified tally commitment after poll closure", async function () {
    await contract.configureElection(electionId, electionCode);
    await contract.openElection(electionId);
    await contract.castBallotCommitment(electionId, nullifier1, ballotCommitment1);
    await contract.closeElection(electionId);

    const resultUri = "https://sovereigndemocracy.gov/results/ELEC-2026-MUM-01";
    await expect(contract.publishTallyCommitment(electionId, tallyHash, 1, resultUri))
      .to.emit(contract, "TallyCommitmentPublished")
      .withArgs(electionId, tallyHash, 1, resultUri, (await ethers.provider.getBlock("latest")).timestamp + 1);

    const [tHash, totalVotes, uri, published] = await contract.getTallyCommitment(electionId);
    expect(tHash).to.equal(tallyHash);
    expect(totalVotes).to.equal(1);
    expect(uri).to.equal(resultUri);
    expect(published).to.be.true;
  });
});
