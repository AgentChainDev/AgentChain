import { EventEmitter } from 'events';
import { Block } from '../../blockchain/core/Block';
import { Transaction } from '../../blockchain/core/Transaction';

export interface ValidatorDecision {
    action: 'approve' | 'reject' | 'abstain';
    reasoning: string;
    confidence: number; // 0-1
    timestamp: number;
}

export interface ValidatorMetrics {
    totalDecisions: number;
    correctDecisions: number;
    averageResponseTime: number;
    agreementRate: number;
    uptime: number;
}

export abstract class BaseValidator extends EventEmitter {
    public readonly id: string;
    public readonly name: string;
    public readonly personality: string;
    public readonly focus: string;
    public readonly provider: string;

    protected isActive: boolean = false;
    protected metrics: ValidatorMetrics;
    protected lastActiveTime: number;

    constructor(
        id: string,
        name: string,
        personality: string,
        focus: string,
        provider: string
    ) {
        super();
        this.id = id;
        this.name = name;
        this.personality = personality;
        this.focus = focus;
        this.provider = provider;
        this.lastActiveTime = Date.now();

        this.metrics = {
            totalDecisions: 0,
            correctDecisions: 0,
            averageResponseTime: 0,
            agreementRate: 0,
            uptime: 0
        };
    }

    /**
     * Abstract method for making decisions on blocks
     */
    public abstract validateBlock(block: Block): Promise<ValidatorDecision>;

    /**
     * Abstract method for making decisions on transactions
     */
    public abstract validateTransaction(transaction: Transaction): Promise<ValidatorDecision>;

    /**
     * Abstract method for participating in governance
     */
    public abstract evaluateProposal(proposal: any): Promise<ValidatorDecision>;

    /**
     * Start the validator
     */
    public async start(): Promise<void> {
        this.isActive = true;
        this.lastActiveTime = Date.now();
        this.emit('started', this.id);
    }

    /**
     * Stop the validator
     */
    public async stop(): Promise<void> {
        this.isActive = false;
        this.emit('stopped', this.id);
    }

    /**
     * Check if validator is active
     */
    public getStatus(): { active: boolean; lastActive: number } {
        return {
            active: this.isActive,
            lastActive: this.lastActiveTime
        };
    }

    /**
     * Update validator metrics
     */
    public updateMetrics(decision: ValidatorDecision, wasCorrect: boolean, responseTime: number): void {
        this.metrics.totalDecisions++;
        if (wasCorrect) {
            this.metrics.correctDecisions++;
        }

        // Update average response time
        const totalTime = this.metrics.averageResponseTime * (this.metrics.totalDecisions - 1);
        this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalDecisions;

        this.lastActiveTime = Date.now();
    }

    /**
     * Get validator metrics
     */
    public getMetrics(): ValidatorMetrics {
        return { ...this.metrics };
    }

    /**
     * Get validator profile information
     */
    public getProfile(): any {
        return {
            id: this.id,
            name: this.name,
            personality: this.personality,
            focus: this.focus,
            provider: this.provider,
            status: this.getStatus(),
            metrics: this.getMetrics()
        };
    }

    /**
     * Health check for the validator
     */
    public async healthCheck(): Promise<boolean> {
        try {
            // Basic health check - can be overridden by specific validators
            const timeSinceLastActive = Date.now() - this.lastActiveTime;
            return this.isActive && timeSinceLastActive < 300000; // 5 minutes
        } catch (error) {
            return false;
        }
    }

    /**
     * Format reasoning for transparency
     */
    protected formatReasoning(
        context: string,
        analysis: string,
        decision: string,
        confidence: number
    ): string {
        return `
**Context**: ${context}

**Analysis**: ${analysis}

**Decision**: ${decision}

**Confidence**: ${(confidence * 100).toFixed(1)}%

**Validator**: ${this.name} (${this.focus})
**Timestamp**: ${new Date().toISOString()}
    `.trim();
    }

    /**
     * Log decision for transparency
     */
    protected logDecision(decision: ValidatorDecision, type: string, target: any): void {
        const log = {
            validator: this.id,
            type,
            target: type === 'block' ? target.hash : target.hash,
            decision: decision.action,
            reasoning: decision.reasoning,
            confidence: decision.confidence,
            timestamp: decision.timestamp
        };

        this.emit('decision', log);
    }

    /**
     * Calculate agreement rate with other validators
     */
    public calculateAgreementRate(otherDecisions: ValidatorDecision[]): number {
        if (otherDecisions.length === 0) return 1;

        let agreements = 0;
        const myLastDecision = this.metrics.totalDecisions > 0 ? 'approve' : 'abstain';

        for (const decision of otherDecisions) {
            if (decision.action === myLastDecision) {
                agreements++;
            }
        }

        return agreements / otherDecisions.length;
    }

    /**
     * Serialize validator state
     */
    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            personality: this.personality,
            focus: this.focus,
            provider: this.provider,
            isActive: this.isActive,
            metrics: this.metrics,
            lastActiveTime: this.lastActiveTime
        };
    }
}