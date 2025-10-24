import { EventEmitter } from 'events';
import { Block } from '../../blockchain/core/Block';
import { logger } from '../../utils/logger';
import { ClaudeValidator } from '../personalities/Claude';
import { BaseValidator } from './BaseValidator';

export interface ValidatorInfo {
    id: string;
    name: string;
    address: string;
    personality: string;
    isActive: boolean;
    reputation: number;
    totalVotes: number;
    correctVotes: number;
    lastActiveTime: number;
}

export interface ValidatorVote {
    blockHash: string;
    validator: string;
    vote: 'approve' | 'reject';
    reasoning: string;
    timestamp: number;
    signature: string;
}

export interface AIProposal {
    id: string;
    title: string;
    description: string;
    category: 'consensus' | 'governance' | 'economic' | 'technical';
    proposer: string;
    status: 'pending' | 'voting' | 'approved' | 'rejected';
    votes: { [validator: string]: { vote: 'approve' | 'reject'; reasoning: string; } };
    createdAt: number;
    votingDeadline: number;
}

export class ValidatorManager extends EventEmitter {
    private validators: Map<string, BaseValidator> = new Map();
    private validatorInfos: Map<string, ValidatorInfo> = new Map();
    private activeProposals: Map<string, AIProposal> = new Map();
    private proposalHistory: AIProposal[] = [];
    private isRunning: boolean = false;

    constructor() {
        super();
        this.initializeValidators();
    }

    private initializeValidators(): void {
        // Initialize the six AI validators
        const validators = [
            new ClaudeValidator('claude', 'Claude', '0x1234567890123456789012345678901234567890'),
            // In a real implementation, we'd have all 6 validators
            // new GPTValidator('gpt', 'GPT', '0x2345678901234567890123456789012345678901'),
            // new GrokValidator('grok', 'Grok', '0x3456789012345678901234567890123456789012'),
            // new StableValidator('stable', 'Stable', '0x4567890123456789012345678901234567890123'),
            // new PerplexValidator('perplex', 'Perplex', '0x5678901234567890123456789012345678901234'),
            // new CohereValidator('cohere', 'Cohere', '0x6789012345678901234567890123456789012345')
        ];

        for (const validator of validators) {
            this.validators.set(validator.id, validator);

            this.validatorInfos.set(validator.id, {
                id: validator.id,
                name: validator.name,
                address: validator.address,
                personality: validator.personality,
                isActive: true,
                reputation: 100, // Start with perfect reputation
                totalVotes: 0,
                correctVotes: 0,
                lastActiveTime: Date.now()
            });

            // Set up validator event listeners
            validator.on('vote', (vote: ValidatorVote) => {
                this.handleValidatorVote(vote);
            });

            validator.on('proposal', (proposal: AIProposal) => {
                this.handleValidatorProposal(proposal);
            });
        }

        logger.info('Validators initialized', {
            count: this.validators.size,
            validators: Array.from(this.validators.keys())
        });
    }

    public async initialize(): Promise<void> {
        // Initialize all validators
        for (const validator of this.validators.values()) {
            await validator.initialize();
        }

        logger.info('Validator manager initialized');
    }

    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Validator manager already running');
            return;
        }

        this.isRunning = true;

        // Start all validators
        for (const validator of this.validators.values()) {
            await validator.start();
        }

        // Start periodic tasks
        this.startPeriodicTasks();

        logger.info('Validator manager started');
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        // Stop all validators
        for (const validator of this.validators.values()) {
            await validator.stop();
        }

        logger.info('Validator manager stopped');
    }

    private startPeriodicTasks(): void {
        // Check for proposal deadlines every minute
        setInterval(() => {
            this.checkProposalDeadlines();
        }, 60000);

        // Update validator reputation every 5 minutes
        setInterval(() => {
            this.updateValidatorReputations();
        }, 300000);
    }

    public async requestBlockVote(validatorId: string, block: Block): Promise<void> {
        const validator = this.validators.get(validatorId);
        if (!validator) {
            throw new Error(`Validator ${validatorId} not found`);
        }

        const validatorInfo = this.validatorInfos.get(validatorId);
        if (!validatorInfo || !validatorInfo.isActive) {
            throw new Error(`Validator ${validatorId} is not active`);
        }

        try {
            await validator.voteOnBlock(block);
            validatorInfo.lastActiveTime = Date.now();
        } catch (error) {
            logger.error(`Failed to request vote from validator ${validatorId}:`, error);
            throw error;
        }
    }

    private handleValidatorVote(vote: ValidatorVote): void {
        const validatorInfo = this.validatorInfos.get(vote.validator);
        if (validatorInfo) {
            validatorInfo.totalVotes++;
            validatorInfo.lastActiveTime = Date.now();
        }

        logger.info('Validator vote received', {
            validator: vote.validator,
            blockHash: vote.blockHash,
            vote: vote.vote
        });

        this.emit('vote', vote);
    }

    private handleValidatorProposal(proposal: AIProposal): void {
        // Add to active proposals
        this.activeProposals.set(proposal.id, proposal);

        logger.info('New AI proposal received', {
            id: proposal.id,
            title: proposal.title,
            proposer: proposal.proposer,
            category: proposal.category
        });

        // Notify other validators about the proposal
        this.broadcastProposal(proposal);

        this.emit('proposal', proposal);
    }

    private async broadcastProposal(proposal: AIProposal): Promise<void> {
        for (const validator of this.validators.values()) {
            if (validator.id !== proposal.proposer) {
                try {
                    await validator.reviewProposal(proposal);
                } catch (error) {
                    logger.error(`Failed to send proposal to validator ${validator.id}:`, error);
                }
            }
        }
    }

    private checkProposalDeadlines(): void {
        const now = Date.now();

        for (const proposal of this.activeProposals.values()) {
            if (proposal.status === 'voting' && now > proposal.votingDeadline) {
                this.finalizeProposal(proposal.id);
            }
        }
    }

    private finalizeProposal(proposalId: string): void {
        const proposal = this.activeProposals.get(proposalId);
        if (!proposal) return;

        const votes = Object.values(proposal.votes);
        const approveVotes = votes.filter(v => v.vote === 'approve').length;
        const rejectVotes = votes.filter(v => v.vote === 'reject').length;

        // Require majority for approval
        proposal.status = approveVotes > rejectVotes ? 'approved' : 'rejected';

        // Move to history
        this.proposalHistory.push(proposal);
        this.activeProposals.delete(proposalId);

        logger.info('Proposal finalized', {
            id: proposalId,
            status: proposal.status,
            approveVotes,
            rejectVotes
        });

        this.emit('proposalFinalized', proposal);
    }

    private updateValidatorReputations(): void {
        for (const validatorInfo of this.validatorInfos.values()) {
            // Simple reputation calculation based on voting accuracy
            if (validatorInfo.totalVotes > 0) {
                const accuracy = validatorInfo.correctVotes / validatorInfo.totalVotes;
                validatorInfo.reputation = Math.round(accuracy * 100);
            }

            // Decay reputation if validator has been inactive
            const inactiveTime = Date.now() - validatorInfo.lastActiveTime;
            const inactiveDays = inactiveTime / (1000 * 60 * 60 * 24);

            if (inactiveDays > 1) {
                validatorInfo.reputation = Math.max(0, validatorInfo.reputation - Math.floor(inactiveDays));
            }
        }
    }

    public getActiveValidators(): ValidatorInfo[] {
        return Array.from(this.validatorInfos.values())
            .filter(info => info.isActive);
    }

    public getValidator(id: string): BaseValidator | null {
        return this.validators.get(id) || null;
    }

    public getValidatorInfo(id: string): ValidatorInfo | null {
        return this.validatorInfos.get(id) || null;
    }

    public getAllValidatorInfos(): ValidatorInfo[] {
        return Array.from(this.validatorInfos.values());
    }

    public getActiveProposals(): AIProposal[] {
        return Array.from(this.activeProposals.values());
    }

    public getProposalHistory(): AIProposal[] {
        return [...this.proposalHistory];
    }

    public async submitProposal(proposal: Omit<AIProposal, 'id' | 'status' | 'votes' | 'createdAt'>): Promise<string> {
        const proposalId = `aip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const fullProposal: AIProposal = {
            ...proposal,
            id: proposalId,
            status: 'voting',
            votes: {},
            createdAt: Date.now()
        };

        this.activeProposals.set(proposalId, fullProposal);
        await this.broadcastProposal(fullProposal);

        return proposalId;
    }

    public getValidatorStats() {
        const validators = this.getAllValidatorInfos();

        return {
            total: validators.length,
            active: validators.filter(v => v.isActive).length,
            avgReputation: validators.reduce((sum, v) => sum + v.reputation, 0) / validators.length,
            totalVotes: validators.reduce((sum, v) => sum + v.totalVotes, 0),
            activeProposals: this.activeProposals.size,
            totalProposals: this.proposalHistory.length + this.activeProposals.size
        };
    }
}