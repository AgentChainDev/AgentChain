// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

/**
 * @title AGENTCHAIN Token
 * @dev Native token for AgentChain blockchain
 * Features:
 * - ERC20 compliant
 * - Burnable tokens
 * - Pausable transfers
 * - Permit functionality for gasless approvals
 * - Deflationary mechanisms
 */
contract AGENTCHAINToken is ERC20, ERC20Burnable, Pausable, Ownable, ERC20Permit {
    
    // Maximum supply: 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Burn rate: 0.1% of each transaction (in basis points)
    uint256 public burnRate = 10; // 0.1%
    
    // Fee collector address (for validator rewards)
    address public feeCollector;
    
    // Total tokens burned
    uint256 public totalBurned;
    
    // Validator rewards pool
    mapping(address => uint256) public validatorRewards;
    
    // Events
    event BurnRateUpdated(uint256 oldRate, uint256 newRate);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event ValidatorRewarded(address indexed validator, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(
        address _feeCollector
    ) ERC20("AGENTCHAIN", "AGENTCHAIN") ERC20Permit("AGENTCHAIN") {
        require(_feeCollector != address(0), "Invalid fee collector");
        
        feeCollector = _feeCollector;
        
        // Mint initial supply to contract deployer
        _mint(msg.sender, MAX_SUPPLY);
    }

    /**
     * @dev Override transfer to implement burn mechanism
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transferWithBurn(owner, to, amount);
        return true;
    }

    /**
     * @dev Override transferFrom to implement burn mechanism
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transferWithBurn(from, to, amount);
        return true;
    }

    /**
     * @dev Internal transfer function with burn mechanism
     */
    function _transferWithBurn(
        address from,
        address to,
        uint256 amount
    ) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 burnAmount = (amount * burnRate) / 10000;
        uint256 transferAmount = amount - burnAmount;

        // Burn tokens
        if (burnAmount > 0) {
            _burn(from, burnAmount);
            totalBurned += burnAmount;
            emit TokensBurned(from, burnAmount);
        }

        // Transfer remaining amount
        _transfer(from, to, transferAmount);
    }

    /**
     * @dev Mint tokens for validator rewards
     * Only callable by the fee collector (validator system)
     */
    function mintValidatorRewards(address validator, uint256 amount) external {
        require(msg.sender == feeCollector, "Only fee collector can mint rewards");
        require(validator != address(0), "Invalid validator address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        _mint(validator, amount);
        validatorRewards[validator] += amount;
        
        emit ValidatorRewarded(validator, amount);
    }

    /**
     * @dev Batch mint validator rewards
     */
    function batchMintValidatorRewards(
        address[] calldata validators,
        uint256[] calldata amounts
    ) external {
        require(msg.sender == feeCollector, "Only fee collector can mint rewards");
        require(validators.length == amounts.length, "Arrays length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < validators.length; i++) {
            require(validators[i] != address(0), "Invalid validator address");
            
            _mint(validators[i], amounts[i]);
            validatorRewards[validators[i]] += amounts[i];
            
            emit ValidatorRewarded(validators[i], amounts[i]);
        }
    }

    /**
     * @dev Update burn rate (only owner)
     */
    function setBurnRate(uint256 _burnRate) external onlyOwner {
        require(_burnRate <= 1000, "Burn rate too high"); // Max 10%
        uint256 oldRate = burnRate;
        burnRate = _burnRate;
        emit BurnRateUpdated(oldRate, _burnRate);
    }

    /**
     * @dev Update fee collector (only owner)
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid fee collector");
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }

    /**
     * @dev Pause token transfers (emergency only)
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Override _beforeTokenTransfer to include pausable functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal whenNotPaused override {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Get circulating supply (total supply - burned tokens)
     */
    function circulatingSupply() public view returns (uint256) {
        return totalSupply();
    }

    /**
     * @dev Get total validator rewards distributed
     */
    function getTotalValidatorRewards() public view returns (uint256) {
        return MAX_SUPPLY - totalSupply() - totalBurned;
    }

    /**
     * @dev Get validator reward amount for specific validator
     */
    function getValidatorRewards(address validator) public view returns (uint256) {
        return validatorRewards[validator];
    }

    /**
     * @dev Emergency withdraw (owner only) - for governance decisions
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    /**
     * @dev Get token information
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        uint256 maxSupply_,
        uint256 burnRate_,
        uint256 totalBurned_
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            burnRate,
            totalBurned
        );
    }
}