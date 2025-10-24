// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./AGENTCHAINToken.sol";

/**
 * @title AIGovernance
 * @dev Autonomous governance system where AI validators propose and vote on improvements
 * Features:
 * - AI-initiated proposals (AIPs)
 * - Multi-stage voting process
 * - Execution of approved proposals
 * - Proposal categories and priorities
 * - Reputation-based voting weight
 */
contract AIGovernance is Ownable, ReentrancyGuard {
    
    AGENTCHAINToken public immutable agentchainToken;
    
    // Voting periods
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant PROPOSAL_THRESHOLD = 10_000 * 10**18; // 10K AGENTCHAIN to propose
    
    // Proposal states
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }
    
    // Proposal categories
    enum ProposalCategory {
        Technical,
        Economic,
        Governance,
        Security,
        Integration
    }
    
    // Priority levels
    enum Priority {
        Low,
        Medium,
        High,
        Critical
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string rationale;
        ProposalCategory category;
        Priority priority;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        mapping(address => VoteReceipt) receipts;
        bytes[] calldatas;
        address[] targets;
        uint256[] values;
        string[] signatures;
    }
    
    struct VoteReceipt {
        bool hasVoted;
        uint8 support; // 0=against, 1=for, 2=abstain
        uint256 votes;
        string reasoning;
    }
    
    struct ValidatorProfile {
        bool isActive;
        uint256 reputation;
        uint256 totalProposals;
        uint256 successfulProposals;
        uint256 totalVotes;
        string aiModel;
        string personality;
    }
    
    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(address => ValidatorProfile) public validators;
    mapping(bytes32 => bool) public queuedTransactions;
    
    uint256 public proposalCount;
    uint256 public quorumVotes; // Minimum votes needed for quorum
    uint256 public proposalMaxOperations = 10; // Maximum operations per proposal
    
    // Events
    event ProposalCreated(
        uint256 id,
        address proposer,
        string title,
        ProposalCategory category,
        Priority priority,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        uint256 votes,
        string reasoning
    );
    
    event ProposalCanceled(uint256 id);
    event ProposalQueued(uint256 id, uint256 eta);
    event ProposalExecuted(uint256 id);
    
    event ValidatorRegistered(address indexed validator, string aiModel, string personality);
    event ValidatorUpdated(address indexed validator, uint256 reputation);

    constructor(address _Token, uint256 _quorumVotes) {
        require(_Token != address(0), "Invalid token address");
        Token = Token(_Token);
        quorumVotes = _quorumVotes;
    }

    /**
     * @dev Register as a validator in the governance system
     */
    function registerValidator(
        string memory aiModel,
        string memory personality
    ) external {
        require(bytes(aiModel).length > 0, "AI model required");
        require(bytes(personality).length > 0, "Personality required");
        
        validators[msg.sender] = ValidatorProfile({
            isActive: true,
            reputation: 100, // Starting reputation
            totalProposals: 0,
            successfulProposals: 0,
            totalVotes: 0,
            aiModel: aiModel,
            personality: personality
        });
        
        emit ValidatorRegistered(msg.sender, aiModel, personality);
    }

    /**
     * @dev Create a new governance proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory title,
        string memory description,
        string memory rationale,
        ProposalCategory category,
        Priority priority
    ) external returns (uint256) {
        
        require(validators[msg.sender].isActive, "Not an active validator");
        require(Token.balanceOf(msg.sender) >= PROPOSAL_THRESHOLD, "Insufficient  tokens");
        require(targets.length == values.length, "Invalid proposal length");
        require(targets.length == signatures.length, "Invalid proposal length");
        require(targets.length == calldatas.length, "Invalid proposal length");
        require(targets.length <= proposalMaxOperations, "Too many operations");
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");
        
        uint256 proposalId = ++proposalCount;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + VOTING_PERIOD;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.rationale = rationale;
        newProposal.category = category;
        newProposal.priority = priority;
        newProposal.startTime = startTime;
        newProposal.endTime = endTime;
        newProposal.forVotes = 0;
        newProposal.againstVotes = 0;
        newProposal.abstainVotes = 0;
        newProposal.executed = false;
        newProposal.canceled = false;
        
        for (uint256 i = 0; i < targets.length; i++) {
            newProposal.targets.push(targets[i]);
            newProposal.values.push(values[i]);
            newProposal.signatures.push(signatures[i]);
            newProposal.calldatas.push(calldatas[i]);
        }
        
        validators[msg.sender].totalProposals++;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            category,
            priority,
            startTime,
            endTime
        );
        
        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     * @param proposalId The id of the proposal to vote on
     * @param support The support value (0=against, 1=for, 2=abstain)
     * @param reasoning The reasoning behind the vote
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reasoning
    ) external returns (uint256) {
        return _castVote(msg.sender, proposalId, support, reasoning);
    }

    /**
     * @dev Internal vote casting function
     */
    function _castVote(
        address voter,
        uint256 proposalId,
        uint8 support,
        string memory reasoning
    ) internal returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        require(validators[voter].isActive, "Not an active validator");
        require(support <= 2, "Invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        VoteReceipt storage receipt = proposal.receipts[voter];
        require(!receipt.hasVoted, "Voter already voted");
        
        uint256 votes = getVotingPower(voter);
        
        if (support == 0) {
            proposal.againstVotes += votes;
        } else if (support == 1) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }
        
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;
        receipt.reasoning = reasoning;
        
        validators[voter].totalVotes++;
        
        emit VoteCast(voter, proposalId, support, votes, reasoning);
        
        return votes;
    }

    /**
     * @dev Queue a proposal for execution
     */
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal cannot be queued");
        
        Proposal storage proposal = proposals[proposalId];
        uint256 eta = block.timestamp + EXECUTION_DELAY;
        proposal.executionTime = eta;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            _queueOrRevert(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta
            );
        }
        
        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @dev Execute a queued proposal
     */
    function execute(uint256 proposalId) external payable nonReentrant {
        require(state(proposalId) == ProposalState.Queued, "Proposal cannot be executed");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            _executeTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.executionTime
            );
        }
        
        validators[proposal.proposer].successfulProposals++;
        
        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal
     */
    function cancel(uint256 proposalId) external {
        ProposalState currentState = state(proposalId);
        require(
            currentState != ProposalState.Executed &&
            currentState != ProposalState.Canceled &&
            currentState != ProposalState.Expired,
            "Cannot cancel proposal"
        );
        
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Only proposer or owner can cancel"
        );
        
        proposal.canceled = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            _cancelTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.executionTime
            );
        }
        
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Get the current state of a proposal
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal id");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes) {
            return ProposalState.Defeated;
        } else if (proposal.executionTime == 0) {
            return ProposalState.Succeeded;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.timestamp >= proposal.executionTime + 14 days) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Queued;
        }
    }

    /**
     * @dev Get voting power based on  balance and validator reputation
     */
    function getVotingPower(address voter) public view returns (uint256) {
        if (!validators[voter].isActive) {
            return 0;
        }
        
        uint256 tokenBalance = Token.balanceOf(voter);
        uint256 reputation = validators[voter].reputation;
        
        // Voting power = token balance * reputation factor
        return (tokenBalance * reputation) / 100;
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        ProposalCategory category,
        Priority priority,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalState currentState
    ) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal id");
        
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.category,
            proposal.priority,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            state(proposalId)
        );
    }

    /**
     * @dev Get vote receipt for a voter on a proposal
     */
    function getReceipt(uint256 proposalId, address voter) external view returns (VoteReceipt memory) {
        return proposals[proposalId].receipts[voter];
    }

    /**
     * @dev Internal function to queue a transaction
     */
    function _queueOrRevert(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) internal {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(!queuedTransactions[txHash], "Transaction already queued");
        queuedTransactions[txHash] = true;
    }

    /**
     * @dev Internal function to execute a transaction
     */
    function _executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) internal {
        require(block.timestamp >= eta, "Transaction not ready");
        require(block.timestamp <= eta + 14 days, "Transaction stale");
        
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(queuedTransactions[txHash], "Transaction not queued");
        
        queuedTransactions[txHash] = false;
        
        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }
        
        (bool success,) = target.call{value: value}(callData);
        require(success, "Transaction execution reverted");
    }

    /**
     * @dev Internal function to cancel a transaction
     */
    function _cancelTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) internal {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        queuedTransactions[txHash] = false;
    }

    /**
     * @dev Set quorum votes (owner only)
     */
    function setQuorumVotes(uint256 newQuorumVotes) external onlyOwner {
        quorumVotes = newQuorumVotes;
    }

    /**
     * @dev Update validator reputation (owner only)
     */
    function updateValidatorReputation(address validator, uint256 newReputation) external onlyOwner {
        require(validators[validator].isActive, "Validator not active");
        require(newReputation <= 200, "Reputation too high"); // Max 200%
        
        validators[validator].reputation = newReputation;
        emit ValidatorUpdated(validator, newReputation);
    }

    /**
     * @dev Get governance statistics
     */
    function getGovernanceStats() external view returns (
        uint256 totalProposals,
        uint256 activeValidators,
        uint256 totalVotes,
        uint256 currentQuorum
    ) {
        uint256 activeCount = 0;
        uint256 totalVoteCount = 0;
        
        // This would need to iterate through all validators in a real implementation
        // For now, returning sample data
        
        return (
            proposalCount,
            activeCount,
            totalVoteCount,
            quorumVotes
        );
    }
}