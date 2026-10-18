// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SovereignDemocracyVoting
 * @notice On-chain audit vault for Sovereign Democracy area-wise e-voting.
 * @dev Records anonymous ballot commitments and election-specific nullifiers without
 * revealing citizen identity, candidate choice, or voter credentials.
 */
contract SovereignDemocracyVoting {

    enum ElectionState { UNCONFIGURED, CONFIGURED, OPEN, CLOSED, TALLY_PUBLISHED }

    struct ElectionDetails {
        uint256 electionId;
        string electionCode;
        ElectionState state;
        uint256 totalBallotsCast;
        bytes32 tallyCommitmentHash;
        uint256 totalCertifiedVotes;
        string resultUri;
        uint256 configuredAt;
        uint256 closedAt;
        uint256 tallyPublishedAt;
    }

    struct BallotRecord {
        bytes32 ballotCommitment;
        uint256 timestamp;
        bool exists;
    }

    address public electionAuthority;

    // electionId => ElectionDetails
    mapping(uint256 => ElectionDetails) public elections;

    // electionId => (nullifierHash => BallotRecord)
    mapping(uint256 => mapping(bytes32 => BallotRecord)) private ballotVault;

    // electionId => (ballotCommitment => bool)
    mapping(uint256 => mapping(bytes32 => bool)) public ballotCommitments;

    event ElectionConfigured(uint256 indexed electionId, string electionCode, uint256 timestamp);
    event ElectionOpened(uint256 indexed electionId, uint256 timestamp);
    event ElectionClosed(uint256 indexed electionId, uint256 totalBallotsCast, uint256 timestamp);
    event BallotCommitmentRecorded(
        uint256 indexed electionId,
        bytes32 indexed nullifierHash,
        bytes32 ballotCommitment,
        uint256 timestamp
    );
    event TallyCommitmentPublished(
        uint256 indexed electionId,
        bytes32 tallyHash,
        uint256 totalVotes,
        string resultUri,
        uint256 timestamp
    );

    modifier onlyAuthority() {
        require(msg.sender == electionAuthority, "Only authorized election authority can execute this");
        _;
    }

    constructor() {
        electionAuthority = msg.sender;
    }

    /**
     * @notice Transfer election authority to a new address.
     */
    function transferAuthority(address newAuthority) external onlyAuthority {
        require(newAuthority != address(0), "Invalid authority address");
        electionAuthority = newAuthority;
    }

    /**
     * @notice Configure a new election on-chain with unique ID and code.
     */
    function configureElection(uint256 electionId, string calldata electionCode) external onlyAuthority {
        require(electionId > 0, "Election ID must be greater than zero");
        require(elections[electionId].state == ElectionState.UNCONFIGURED, "Election already configured");

        elections[electionId] = ElectionDetails({
            electionId: electionId,
            electionCode: electionCode,
            state: ElectionState.CONFIGURED,
            totalBallotsCast: 0,
            tallyCommitmentHash: bytes32(0),
            totalCertifiedVotes: 0,
            resultUri: "",
            configuredAt: block.timestamp,
            closedAt: 0,
            tallyPublishedAt: 0
        });

        emit ElectionConfigured(electionId, electionCode, block.timestamp);
    }

    /**
     * @notice Open an election for ballot casting.
     */
    function openElection(uint256 electionId) external onlyAuthority {
        ElectionDetails storage el = elections[electionId];
        el.state = ElectionState.OPEN;

        emit ElectionOpened(electionId, block.timestamp);
    }

    /**
     * @notice Close voting for an election.
     */
    function closeElection(uint256 electionId) external onlyAuthority {
        ElectionDetails storage el = elections[electionId];
        require(el.state == ElectionState.OPEN, "Election must be OPEN to close");
        el.state = ElectionState.CLOSED;
        el.closedAt = block.timestamp;

        emit ElectionClosed(electionId, el.totalBallotsCast, block.timestamp);
    }

    /**
     * @notice Cast an anonymized ballot commitment using an election-specific nullifier.
     * @dev Nullifier prevents double voting without revealing voter identity.
     */
    function castBallotCommitment(
        uint256 electionId,
        bytes32 nullifierHash,
        bytes32 ballotCommitment
    ) external onlyAuthority {
        ElectionDetails storage el = elections[electionId];
        if (el.state != ElectionState.OPEN) {
            el.electionId = electionId;
            el.state = ElectionState.OPEN;
            if (el.configuredAt == 0) {
                el.configuredAt = block.timestamp;
                emit ElectionConfigured(electionId, "", block.timestamp);
            }
            emit ElectionOpened(electionId, block.timestamp);
        }
        require(el.state == ElectionState.OPEN, "Voting is not open for this election");
        require(nullifierHash != bytes32(0), "Nullifier hash cannot be empty");
        require(ballotCommitment != bytes32(0), "Ballot commitment cannot be empty");
        require(!ballotVault[electionId][nullifierHash].exists, "Duplicate vote rejected: nullifier already spent");

        ballotVault[electionId][nullifierHash] = BallotRecord({
            ballotCommitment: ballotCommitment,
            timestamp: block.timestamp,
            exists: true
        });

        ballotCommitments[electionId][ballotCommitment] = true;
        el.totalBallotsCast += 1;

        emit BallotCommitmentRecorded(electionId, nullifierHash, ballotCommitment, block.timestamp);
    }

    /**
     * @notice Publish final certified election tally commitment on-chain.
     */
    function publishTallyCommitment(
        uint256 electionId,
        bytes32 tallyHash,
        uint256 totalVotes,
        string calldata resultUri
    ) external onlyAuthority {
        ElectionDetails storage el = elections[electionId];
        if (el.state == ElectionState.UNCONFIGURED || el.state == ElectionState.CONFIGURED || el.state == ElectionState.OPEN) {
            el.state = ElectionState.CLOSED;
            el.closedAt = block.timestamp;
            emit ElectionClosed(electionId, el.totalBallotsCast, block.timestamp);
        }
        require(el.state == ElectionState.CLOSED || el.state == ElectionState.TALLY_PUBLISHED, "Election must be CLOSED before publishing tally");
        require(tallyHash != bytes32(0), "Tally hash cannot be empty");

        el.state = ElectionState.TALLY_PUBLISHED;
        el.tallyCommitmentHash = tallyHash;
        el.totalCertifiedVotes = totalVotes;
        el.resultUri = resultUri;
        el.tallyPublishedAt = block.timestamp;

        emit TallyCommitmentPublished(electionId, tallyHash, totalVotes, resultUri, block.timestamp);
    }

    /**
     * @notice Verify inclusion of a ballot commitment and nullifier.
     */
    function verifyBallot(
        uint256 electionId,
        bytes32 nullifierHash,
        bytes32 ballotCommitment
    ) external view returns (bool recorded, uint256 timestamp) {
        BallotRecord memory rec = ballotVault[electionId][nullifierHash];
        if (rec.exists && rec.ballotCommitment == ballotCommitment) {
            return (true, rec.timestamp);
        }
        return (false, 0);
    }

    /**
     * @notice Check whether a ballot commitment exists in the election.
     */
    function isBallotCommitmentRecorded(uint256 electionId, bytes32 ballotCommitment) external view returns (bool) {
        return ballotCommitments[electionId][ballotCommitment];
    }

    /**
     * @notice Get certified published tally commitment.
     */
    function getTallyCommitment(uint256 electionId) external view returns (
        bytes32 tallyHash,
        uint256 totalVotes,
        string memory resultUri,
        bool published
    ) {
        ElectionDetails memory el = elections[electionId];
        bool isPublished = (el.state == ElectionState.TALLY_PUBLISHED);
        return (el.tallyCommitmentHash, el.totalCertifiedVotes, el.resultUri, isPublished);
    }
}
