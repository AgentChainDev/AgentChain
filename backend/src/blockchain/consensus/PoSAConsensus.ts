import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { ValidatorManager } from '../../validators/core/ValidatorManager';
import { Block } from '../core/Block';

export interface ConsensusVote {
    blockHash: string;
    validator: string;
    vote: 'approve' | 'reject';
    reasoning: string;
    timestamp: number;
    signature: string;
}

export interface ConsensusRound {
    blockHash: string;
    proposer: string;
    startTime: number;
    votes: ConsensusVote[];
    status: 'pending' | 'approved' | 'rejected' | 'timeout';
    finalizedAt?: number;
}

export interface PoSAConfig {
    validatorCount: number;
    requiredVotes: number;
    roundTimeout: number;
    blockTime: number;
}

export class PoSAConsensus extends EventEmitter {
    private validatorManager: ValidatorManager;
    private currentRound: ConsensusRound | null = null;
    private consensusHistory: ConsensusRound[] = [];
    private config: PoSAConfig;
    private isActive: boolean = false;

    constructor(validatorManager: ValidatorManager, config: PoSAConfig) {
        super();
        this.validatorManager = validatorManager;
        this.config = config;
    }

    public async initialize(): Promise<void> {
        logger.info('Initializing PoSA consensus mechanism', {
            validatorCount: this.config.validatorCount,
            requiredVotes: this.config.requiredVotes,
            roundTimeout: this.config.roundTimeout
        });

        // Set up validator event listeners
        this.validatorManager.on('vote', (vote: ConsensusVote) => {
            this.handleValidatorVote(vote);
        });

        this.isActive = true;
    }

    public async proposeBlock(block: Block, proposer: string): Promise<boolean> {
        if (!this.isActive) {
            logger.warn('Consensus not active, rejecting block proposal');
            return false;
        }

        if (this.currentRound) {
            logger.warn('Another consensus round in progress', {
                currentBlock: this.currentRound.blockHash,
                newBlock: block.hash
            });
            return false;
        }

        // Start new consensus round
        this.currentRound = {
            blockHash: block.hash,
            proposer,
            startTime: Date.now(),
            votes: [],
            status: 'pending'
        };

        logger.info('Starting consensus round', {
            blockHash: block.hash,
            blockNumber: Number(block.header.number),
            proposer
        });

        // Request votes from all validators
        await this.requestValidatorVotes(block);

        // Set timeout for this round
        setTimeout(() => {
            this.handleRoundTimeout();
        }, this.config.roundTimeout);

        this.emit('roundStarted', this.currentRound);
        return true;
    }

    private async requestValidatorVotes(block: Block): Promise<void> {
        const activeValidators = this.validatorManager.getActiveValidators();

        logger.info('Requesting votes from validators', {
            blockHash: block.hash,
            validatorCount: activeValidators.length
        });

        // Request each validator to vote on the block
        for (const validator of activeValidators) {
            try {
                await this.validatorManager.requestBlockVote(validator.id, block);
            } catch (error) {
                logger.error(`Failed to request vote from validator ${validator.id}:`, error);
            }
        }
    }

    private async handleValidatorVote(vote: ConsensusVote): Promise<void> {
        if (!this.currentRound) {
            logger.warn('Received vote outside of consensus round', { vote });
            return;
        }

        if (vote.blockHash !== this.currentRound.blockHash) {
            logger.warn('Received vote for different block', {
                expected: this.currentRound.blockHash,
                received: vote.blockHash
            });
            return;
        }

        // Check if validator already voted
        const existingVote = this.currentRound.votes.find(v => v.validator === vote.validator);
        if (existingVote) {
            logger.warn('Validator already voted', { validator: vote.validator });
            return;
        }

        // Validate vote signature (simplified)
        if (!this.validateVoteSignature(vote)) {
            logger.warn('Invalid vote signature', { validator: vote.validator });
            return;
        }

        // Add vote to current round
        this.currentRound.votes.push(vote);

        logger.info('Validator vote received', {
            validator: vote.validator,
            vote: vote.vote,
            totalVotes: this.currentRound.votes.length,
            requiredVotes: this.config.requiredVotes
        });

        this.emit('voteReceived', vote);

        // Check if consensus reached
        await this.checkConsensusStatus();
    }

    private async checkConsensusStatus(): Promise<void> {
        if (!this.currentRound) return;

        const approvalVotes = this.currentRound.votes.filter(v => v.vote === 'approve').length;
        const rejectionVotes = this.currentRound.votes.filter(v => v.vote === 'reject').length;
        const totalVotes = this.currentRound.votes.length;

        // Check for approval consensus
        if (approvalVotes >= this.config.requiredVotes) {
            await this.finalizeRound('approved');
            return;
        }

        // Check for rejection consensus
        if (rejectionVotes >= this.config.requiredVotes) {
            await this.finalizeRound('rejected');
            return;
        }

        // Check if all validators have voted
        if (totalVotes >= this.config.validatorCount) {
            if (approvalVotes > rejectionVotes) {
                await this.finalizeRound('approved');
            } else {
                await this.finalizeRound('rejected');
            }
        }
    }

    private async finalizeRound(status: 'approved' | 'rejected'): Promise<void> {
        if (!this.currentRound) return;

        this.currentRound.status = status;
        this.currentRound.finalizedAt = Date.now();

        const roundDuration = this.currentRound.finalizedAt - this.currentRound.startTime;

        logger.info('Consensus round finalized', {
            blockHash: this.currentRound.blockHash,
            status,
            votes: this.currentRound.votes.length,
            duration: `${roundDuration}ms`
        });

        // Add to history
        this.consensusHistory.push({ ...this.currentRound });

        // Keep only last 100 rounds
        if (this.consensusHistory.length > 100) {
            this.consensusHistory.shift();
        }

        // Emit consensus result
        this.emit('consensusReached', {
            round: this.currentRound,
            approved: status === 'approved'
        });

        // Reset current round
        this.currentRound = null;
    }

    private handleRoundTimeout(): void {
        if (!this.currentRound || this.currentRound.status !== 'pending') {
            return;
        }

        logger.warn('Consensus round timed out', {
            blockHash: this.currentRound.blockHash,
            votes: this.currentRound.votes.length,
            timeout: this.config.roundTimeout
        });

        this.finalizeRound('rejected');
    }

    private validateVoteSignature(vote: ConsensusVote): boolean {
        // Simplified signature validation
        // In production, this would verify cryptographic signatures
        return vote.signature.length > 0 && vote.validator.length > 0;
    }

    public getCurrentRound(): ConsensusRound | null {
        return this.currentRound;
    }

    public getConsensusHistory(): ConsensusRound[] {
        return [...this.consensusHistory];
    }

    public getConsensusStats() {
        const recentRounds = this.consensusHistory.slice(-50); // Last 50 rounds

        if (recentRounds.length === 0) {
            return {
                totalRounds: 0,
                approvalRate: 0,
                avgRoundTime: 0,
                timeoutRate: 0
            };
        }

        const approvedRounds = recentRounds.filter(r => r.status === 'approved').length;
        const timeoutRounds = recentRounds.filter(r => r.status === 'timeout').length;

        const totalTime = recentRounds.reduce((sum, round) => {
            const endTime = round.finalizedAt || round.startTime + this.config.roundTimeout;
            return sum + (endTime - round.startTime);
        }, 0);

        return {
            totalRounds: recentRounds.length,
            approvalRate: (approvedRounds / recentRounds.length * 100).toFixed(2),
            avgRoundTime: Math.round(totalTime / recentRounds.length),
            timeoutRate: (timeoutRounds / recentRounds.length * 100).toFixed(2)
        };
    }

    public async stop(): Promise<void> {
        this.isActive = false;

        if (this.currentRound) {
            logger.info('Stopping consensus with active round');
            this.handleRoundTimeout();
        }

        logger.info('PoSA consensus stopped');
    }

    public isRoundActive(): boolean {
        return this.currentRound !== null && this.currentRound.status === 'pending';
    }

    public getValidatorParticipation(): { [validator: string]: number } {
        const participation: { [validator: string]: number } = {};

        for (const round of this.consensusHistory.slice(-50)) {
            for (const vote of round.votes) {
                participation[vote.validator] = (participation[vote.validator] || 0) + 1;
            }
        }

        return participation;
    }
}