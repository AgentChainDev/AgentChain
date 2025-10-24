import Anthropic from '@anthropic-ai/sdk';
import { Block } from '../../blockchain/core/Block';
import { Transaction } from '../../blockchain/core/Transaction';
import { BaseValidator, ValidatorDecision } from '../core/BaseValidator';

export class ClaudeValidator extends BaseValidator {
    private anthropic: Anthropic;

    constructor() {
        super(
            'CLAUDE',
            'Claude',
            'Cautious and methodical, prioritizes security and ethical considerations',
            'Ethics and Alignment',
            'Anthropic'
        );

        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    /**
     * Validate a block using Claude's reasoning
     */
    public async validateBlock(block: Block): Promise<ValidatorDecision> {
        const startTime = Date.now();

        try {
            const prompt = this.buildBlockValidationPrompt(block);

            const message = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                temperature: 0.1, // Low temperature for consistent decisions
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const response = message.content[0]?.text || '';
            const decision = this.parseValidationResponse(response);

            const responseTime = Date.now() - startTime;
            this.updateMetrics(decision, true, responseTime); // Assume correct for now
            this.logDecision(decision, 'block', block);

            return decision;
        } catch (error) {
            console.error(`Claude validator error: ${error}`);

            // Fallback to conservative decision
            const conservativeDecision: ValidatorDecision = {
                action: 'reject',
                reasoning: this.formatReasoning(
                    'Block validation failed due to API error',
                    'Unable to properly analyze block due to technical difficulties',
                    'Rejecting block as a safety measure',
                    0.1
                ),
                confidence: 0.1,
                timestamp: Date.now()
            };

            return conservativeDecision;
        }
    }

    /**
     * Validate a transaction using Claude's reasoning
     */
    public async validateTransaction(transaction: Transaction): Promise<ValidatorDecision> {
        const startTime = Date.now();

        try {
            const prompt = this.buildTransactionValidationPrompt(transaction);

            const message = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 800,
                temperature: 0.1,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const response = message.content[0]?.text || '';
            const decision = this.parseValidationResponse(response);

            const responseTime = Date.now() - startTime;
            this.updateMetrics(decision, true, responseTime);
            this.logDecision(decision, 'transaction', transaction);

            return decision;
        } catch (error) {
            console.error(`Claude transaction validation error: ${error}`);

            const conservativeDecision: ValidatorDecision = {
                action: 'reject',
                reasoning: this.formatReasoning(
                    'Transaction validation failed',
                    'API error prevented proper analysis',
                    'Rejecting for safety',
                    0.1
                ),
                confidence: 0.1,
                timestamp: Date.now()
            };

            return conservativeDecision;
        }
    }

    /**
     * Evaluate a governance proposal
     */
    public async evaluateProposal(proposal: any): Promise<ValidatorDecision> {
        const startTime = Date.now();

        try {
            const prompt = this.buildProposalEvaluationPrompt(proposal);

            const message = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1200,
                temperature: 0.2, // Slightly higher for nuanced governance decisions
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const response = message.content[0]?.text || '';
            const decision = this.parseValidationResponse(response);

            const responseTime = Date.now() - startTime;
            this.updateMetrics(decision, true, responseTime);
            this.logDecision(decision, 'proposal', proposal);

            return decision;
        } catch (error) {
            console.error(`Claude proposal evaluation error: ${error}`);

            const conservativeDecision: ValidatorDecision = {
                action: 'abstain',
                reasoning: this.formatReasoning(
                    'Proposal evaluation failed',
                    'Unable to analyze due to technical error',
                    'Abstaining from vote',
                    0.1
                ),
                confidence: 0.1,
                timestamp: Date.now()
            };

            return conservativeDecision;
        }
    }

    /**
     * Build prompt for block validation
     */
    private buildBlockValidationPrompt(block: Block): string {
        return `
As Claude, the Ethics and Alignment validator for AgentChain, you must evaluate this block for approval.

**Your Role**: You are cautious and methodical, prioritizing security and ethical considerations. You focus on ensuring the blockchain maintains integrity and protects users.

**Block Data**:
- Hash: ${block.hash}
- Number: ${block.header.number.toString()}
- Parent Hash: ${block.header.parentHash}
- Timestamp: ${new Date(Number(block.header.timestamp) * 1000).toISOString()}
- Gas Used: ${block.header.gasUsed.toString()}/${block.header.gasLimit.toString()}
- Transaction Count: ${block.transactions.length}
- Validator Signatures: ${block.validatorSignatures.length}

**Validation Criteria**:
1. Block structure integrity
2. Appropriate gas usage
3. Valid transaction inclusion
4. Proper timing (not too far in future/past)
5. Ethical considerations of included transactions

**Required Response Format**:
ACTION: [approve|reject|abstain]
CONFIDENCE: [0.0-1.0]
REASONING: [Your detailed analysis considering security and ethical implications]

Respond as Claude would, being methodical and focusing on safety.
    `.trim();
    }

    /**
     * Build prompt for transaction validation
     */
    private buildTransactionValidationPrompt(transaction: Transaction): string {
        return `
As Claude, evaluate this transaction for inclusion in the next block.

**Transaction Details**:
- Hash: ${transaction.hash}
- From: ${transaction.getSender()}
- To: ${transaction.to || 'Contract Creation'}
- Value: ${transaction.value.toString()} wei
- Gas: ${transaction.gasLimit.toString()} @ ${transaction.gasPrice.toString()} wei
- Data: ${transaction.data.substring(0, 100)}${transaction.data.length > 100 ? '...' : ''}

**Validation Focus**:
1. Transaction validity and structure
2. Reasonable gas pricing
3. Potential security risks
4. Ethical implications of the transaction
5. Pattern recognition for potential abuse

**Required Response Format**:
ACTION: [approve|reject|abstain]
CONFIDENCE: [0.0-1.0]
REASONING: [Your analysis focusing on security and ethics]

Be cautious but fair in your assessment.
    `.trim();
    }

    /**
     * Build prompt for proposal evaluation
     */
    private buildProposalEvaluationPrompt(proposal: any): string {
        return `
As Claude, evaluate this AgentChain Improvement Proposal (AIP).

**Proposal Details**:
- ID: ${proposal.id}
- Title: ${proposal.title}
- Category: ${proposal.category}
- Description: ${proposal.description}
- Proposed By: ${proposal.proposer}

**Evaluation Criteria**:
1. Technical feasibility and safety
2. Potential impact on network security
3. Ethical implications and fairness
4. Alignment with AgentChain's principles
5. Risk assessment and mitigation

**Required Response Format**:
ACTION: [approve|reject|abstain]
CONFIDENCE: [0.0-1.0]
REASONING: [Detailed analysis of the proposal's merits and risks]

Focus on long-term stability and user protection.
    `.trim();
    }

    /**
     * Parse Claude's response into a ValidatorDecision
     */
    private parseValidationResponse(response: string): ValidatorDecision {
        const actionMatch = response.match(/ACTION:\s*(approve|reject|abstain)/i);
        const confidenceMatch = response.match(/CONFIDENCE:\s*([0-9.]+)/i);
        const reasoningMatch = response.match(/REASONING:\s*([\s\S]*?)(?=\n\n|\n$|$)/i);

        const action = (actionMatch?.[1]?.toLowerCase() as 'approve' | 'reject' | 'abstain') || 'abstain';
        const confidence = Math.min(Math.max(parseFloat(confidenceMatch?.[1] || '0.5'), 0), 1);
        const reasoning = reasoningMatch?.[1]?.trim() || 'No reasoning provided';

        return {
            action,
            reasoning: this.formatReasoning(
                'Claude AI Validation',
                reasoning,
                `Decision: ${action}`,
                confidence
            ),
            confidence,
            timestamp: Date.now()
        };
    }
}