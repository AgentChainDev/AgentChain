// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./AGENTCHAINToken.sol";

/**
 * @title ValidatorStaking
 * @dev Staking contract for AgentChain validators
 * Features:
 * - Validator registration and management
 * - Staking and unstaking with lock periods
 * - Slashing for misbehavior
 * - Reward distribution
 * - Delegation support
 */
contract ValidatorStaking is ReentrancyGuard, Ownable, Pausable {
    
    AGENTCHAINToken public immutable agentchainToken;
    
    // Minimum stake required to become a validator
    uint256 public constant MIN_VALIDATOR_STAKE = 100_000 * 10**18; // 100K AGENTCHAIN
    
    // Minimum delegation amount
    uint256 public constant MIN_DELEGATION = 1_000 * 10**18; // 1K AGENTCHAIN
    
    // Unstaking lock period (7 days)
    uint256 public constant UNSTAKING_PERIOD = 7 days;
    
    // Commission rate limits (in basis points)
    uint256 public constant MAX_COMMISSION_RATE = 2000; // 20%
    
    struct ValidatorInfo {
        address validator;
        string name;
        string aiModel;
        bool isActive;
        uint256 totalStake;
        uint256 selfStake;
        uint256 delegatedStake;
        uint256 commissionRate; // in basis points (100 = 1%)
        uint256 rewardDebt;
        uint256 lastActiveTime;
        uint256 slashCount;
        bool isJailed;
        uint256 jailEndTime;
    }
    
    struct DelegationInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }
    
    struct UnstakeRequest {
        uint256 amount;
        uint256 unlockTime;
        bool processed;
    }
    
    // Validator storage
    mapping(address => ValidatorInfo) public validators;
    mapping(address => bool) public isValidator;
    address[] public validatorList;
    
    // Delegation storage
    mapping(address => mapping(address => DelegationInfo)) public delegations; // delegator => validator => info
    mapping(address => address[]) public delegatorValidators; // delegator => list of validators
    
    // Unstaking storage
    mapping(address => UnstakeRequest[]) public unstakeRequests;
    
    // Reward tracking
    uint256 public totalRewardsDistributed;
    uint256 public accRewardPerShare;
    uint256 public lastRewardBlock;
    
    // AI model mapping
    mapping(string => address) public aiModelToValidator;
    string[] public aiModels = ["Claude", "GPT", "Grok", "Stable", "Perplex", "Cohere"];
    
    // Events
    event ValidatorRegistered(address indexed validator, string name, string aiModel);
    event ValidatorUpdated(address indexed validator, uint256 commissionRate);
    event ValidatorJailed(address indexed validator, uint256 jailEndTime);
    event ValidatorUnjailed(address indexed validator);
    event Staked(address indexed user, address indexed validator, uint256 amount);
    event Delegated(address indexed delegator, address indexed validator, uint256 amount);
    event UnstakeRequested(address indexed user, address indexed validator, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 totalAmount);
    event RewardsClaimed(address indexed user, address indexed validator, uint256 amount);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);

    constructor(address _Token) {
        require(_Token != address(0), "Invalid token address");
        Token = Token(_Token);
    }

    /**
     * @dev Register as a validator
     */
    function registerValidator(
        string memory name,
        string memory aiModel,
        uint256 commissionRate
    ) external payable nonReentrant {
        require(!isValidator[msg.sender], "Already a validator");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(commissionRate <= MAX_COMMISSION_RATE, "Commission rate too high");
        require(aiModelToValidator[aiModel] == address(0), "AI model already taken");
        require(isValidAIModel(aiModel), "Invalid AI model");
        
        // Transfer minimum stake
        Token.transferFrom(msg.sender, address(this), MIN_VALIDATOR_STAKE);
        
        validators[msg.sender] = ValidatorInfo({
            validator: msg.sender,
            name: name,
            aiModel: aiModel,
            isActive: true,
            totalStake: MIN_VALIDATOR_STAKE,
            selfStake: MIN_VALIDATOR_STAKE,
            delegatedStake: 0,
            commissionRate: commissionRate,
            rewardDebt: 0,
            lastActiveTime: block.timestamp,
            slashCount: 0,
            isJailed: false,
            jailEndTime: 0
        });
        
        isValidator[msg.sender] = true;
        validatorList.push(msg.sender);
        aiModelToValidator[aiModel] = msg.sender;
        
        emit ValidatorRegistered(msg.sender, name, aiModel);
    }

    /**
     * @dev Delegate tokens to a validator
     */
    function delegate(address validator, uint256 amount) external nonReentrant whenNotPaused {
        require(isValidator[validator], "Not a validator");
        require(validators[validator].isActive, "Validator not active");
        require(!validators[validator].isJailed, "Validator is jailed");
        require(amount >= MIN_DELEGATION, "Amount below minimum");
        
        Token.transferFrom(msg.sender, address(this), amount);
        
        DelegationInfo storage delegation = delegations[msg.sender][validator];
        ValidatorInfo storage validatorInfo = validators[validator];
        
        // Update pending rewards before changing stake
        if (delegation.amount > 0) {
            uint256 pending = (delegation.amount * accRewardPerShare) / 1e12 - delegation.rewardDebt;
            delegation.pendingRewards += pending;
        }
        
        delegation.amount += amount;
        delegation.rewardDebt = (delegation.amount * accRewardPerShare) / 1e12;
        
        validatorInfo.delegatedStake += amount;
        validatorInfo.totalStake += amount;
        
        // Add to delegator's validator list if new delegation
        if (delegation.amount == amount) {
            delegatorValidators[msg.sender].push(validator);
        }
        
        emit Delegated(msg.sender, validator, amount);
    }

    /**
     * @dev Request unstaking (with lock period)
     */
    function requestUnstake(address validator, uint256 amount) external nonReentrant {
        DelegationInfo storage delegation = delegations[msg.sender][validator];
        require(delegation.amount >= amount, "Insufficient delegation");
        
        // Update pending rewards
        uint256 pending = (delegation.amount * accRewardPerShare) / 1e12 - delegation.rewardDebt;
        delegation.pendingRewards += pending;
        
        delegation.amount -= amount;
        delegation.rewardDebt = (delegation.amount * accRewardPerShare) / 1e12;
        
        validators[validator].delegatedStake -= amount;
        validators[validator].totalStake -= amount;
        
        unstakeRequests[msg.sender].push(UnstakeRequest({
            amount: amount,
            unlockTime: block.timestamp + UNSTAKING_PERIOD,
            processed: false
        }));
        
        emit UnstakeRequested(msg.sender, validator, amount);
    }

    /**
     * @dev Process unstake requests after lock period
     */
    function processUnstake() external nonReentrant {
        UnstakeRequest[] storage requests = unstakeRequests[msg.sender];
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < requests.length; i++) {
            if (!requests[i].processed && block.timestamp >= requests[i].unlockTime) {
                totalAmount += requests[i].amount;
                requests[i].processed = true;
            }
        }
        
        require(totalAmount > 0, "No tokens to unstake");
        
        Token.transfer(msg.sender, totalAmount);
        emit Unstaked(msg.sender, totalAmount);
    }

    /**
     * @dev Claim rewards for a specific validator
     */
    function claimRewards(address validator) external nonReentrant {
        DelegationInfo storage delegation = delegations[msg.sender][validator];
        require(delegation.amount > 0, "No delegation found");
        
        uint256 pending = (delegation.amount * accRewardPerShare) / 1e12 - delegation.rewardDebt;
        uint256 totalReward = pending + delegation.pendingRewards;
        
        require(totalReward > 0, "No rewards available");
        
        delegation.pendingRewards = 0;
        delegation.rewardDebt = (delegation.amount * accRewardPerShare) / 1e12;
        
        // Apply validator commission
        uint256 commission = (totalReward * validators[validator].commissionRate) / 10000;
        uint256 delegatorReward = totalReward - commission;
        
        if (commission > 0) {
            Token.transfer(validator, commission);
        }
        
        Token.transfer(msg.sender, delegatorReward);
        emit RewardsClaimed(msg.sender, validator, delegatorReward);
    }

    /**
     * @dev Distribute rewards to all validators (called by the system)
     */
    function distributeRewards(uint256 totalRewards) external onlyOwner {
        require(totalRewards > 0, "No rewards to distribute");
        require(getTotalStake() > 0, "No stake to distribute rewards");
        
        Token.transferFrom(msg.sender, address(this), totalRewards);
        
        accRewardPerShare += (totalRewards * 1e12) / getTotalStake();
        totalRewardsDistributed += totalRewards;
        lastRewardBlock = block.number;
        
        emit RewardsDistributed(totalRewards);
    }

    /**
     * @dev Slash a validator for misbehavior
     */
    function slashValidator(
        address validator,
        uint256 slashAmount,
        string memory reason
    ) external onlyOwner {
        require(isValidator[validator], "Not a validator");
        
        ValidatorInfo storage validatorInfo = validators[validator];
        require(validatorInfo.totalStake >= slashAmount, "Insufficient stake to slash");
        
        // Apply slashing
        if (slashAmount <= validatorInfo.selfStake) {
            validatorInfo.selfStake -= slashAmount;
        } else {
            uint256 remainingSlash = slashAmount - validatorInfo.selfStake;
            validatorInfo.selfStake = 0;
            validatorInfo.delegatedStake -= remainingSlash;
        }
        
        validatorInfo.totalStake -= slashAmount;
        validatorInfo.slashCount++;
        
        // Jail validator if slashed multiple times
        if (validatorInfo.slashCount >= 3) {
            validatorInfo.isJailed = true;
            validatorInfo.jailEndTime = block.timestamp + 30 days;
            emit ValidatorJailed(validator, validatorInfo.jailEndTime);
        }
        
        // Burn slashed tokens
        Token.transfer(address(0), slashAmount);
        
        emit ValidatorSlashed(validator, slashAmount, reason);
    }

    /**
     * @dev Unjail a validator after jail period
     */
    function unjailValidator() external {
        ValidatorInfo storage validatorInfo = validators[msg.sender];
        require(validatorInfo.isJailed, "Validator not jailed");
        require(block.timestamp >= validatorInfo.jailEndTime, "Jail period not ended");
        require(validatorInfo.totalStake >= MIN_VALIDATOR_STAKE, "Insufficient stake");
        
        validatorInfo.isJailed = false;
        validatorInfo.jailEndTime = 0;
        
        emit ValidatorUnjailed(msg.sender);
    }

    /**
     * @dev Update validator commission rate
     */
    function updateCommissionRate(uint256 newRate) external {
        require(isValidator[msg.sender], "Not a validator");
        require(newRate <= MAX_COMMISSION_RATE, "Commission rate too high");
        
        validators[msg.sender].commissionRate = newRate;
        emit ValidatorUpdated(msg.sender, newRate);
    }

    /**
     * @dev Get active validators
     */
    function getActiveValidators() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active validators
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive && !validators[validatorList[i]].isJailed) {
                activeCount++;
            }
        }
        
        address[] memory activeValidators = new address[](activeCount);
        uint256 index = 0;
        
        // Fill active validators array
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive && !validators[validatorList[i]].isJailed) {
                activeValidators[index] = validatorList[i];
                index++;
            }
        }
        
        return activeValidators;
    }

    /**
     * @dev Get total stake across all validators
     */
    function getTotalStake() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            total += validators[validatorList[i]].totalStake;
        }
        return total;
    }

    /**
     * @dev Check if AI model is valid
     */
    function isValidAIModel(string memory model) internal view returns (bool) {
        for (uint256 i = 0; i < aiModels.length; i++) {
            if (keccak256(abi.encodePacked(aiModels[i])) == keccak256(abi.encodePacked(model))) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get delegation info for a delegator and validator
     */
    function getDelegationInfo(address delegator, address validator) 
        external 
        view 
        returns (uint256 amount, uint256 pendingRewards) 
    {
        DelegationInfo storage delegation = delegations[delegator][validator];
        uint256 pending = (delegation.amount * accRewardPerShare) / 1e12 - delegation.rewardDebt;
        
        return (delegation.amount, pending + delegation.pendingRewards);
    }

    /**
     * @dev Get unstake requests for a user
     */
    function getUnstakeRequests(address user) 
        external 
        view 
        returns (uint256[] memory amounts, uint256[] memory unlockTimes, bool[] memory processed) 
    {
        UnstakeRequest[] storage requests = unstakeRequests[user];
        
        amounts = new uint256[](requests.length);
        unlockTimes = new uint256[](requests.length);
        processed = new bool[](requests.length);
        
        for (uint256 i = 0; i < requests.length; i++) {
            amounts[i] = requests[i].amount;
            unlockTimes[i] = requests[i].unlockTime;
            processed[i] = requests[i].processed;
        }
    }

    /**
     * @dev Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}