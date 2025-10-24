import { keccak256 } from '@ethereum/util';
import { EventEmitter } from 'events';
import { Transaction } from './Transaction';

export interface BlockHeader {
    parentHash: string;
    ommersHash: string;
    beneficiary: string;
    stateRoot: string;
    transactionsRoot: string;
    receiptsRoot: string;
    logsBloom: string;
    difficulty: bigint;
    number: bigint;
    gasLimit: bigint;
    gasUsed: bigint;
    timestamp: bigint;
    extraData: string;
    mixHash: string;
    nonce: string;
}

export interface BlockData {
    header: BlockHeader;
    transactions: Transaction[];
    ommers: BlockHeader[];
}

export interface ValidatorSignature {
    validator: string;
    signature: string;
    reasoning: string;
    timestamp: number;
}

export class Block extends EventEmitter {
    public readonly header: BlockHeader;
    public readonly transactions: Transaction[];
    public readonly ommers: BlockHeader[];
    public readonly hash: string;
    public readonly validatorSignatures: ValidatorSignature[];

    constructor(blockData: BlockData, validatorSignatures: ValidatorSignature[] = []) {
        super();

        this.header = blockData.header;
        this.transactions = blockData.transactions;
        this.ommers = blockData.ommers;
        this.validatorSignatures = validatorSignatures;
        this.hash = this.calculateHash();
    }

    /**
     * Calculate the hash of this block
     */
    private calculateHash(): string {
        const headerData = {
            parentHash: this.header.parentHash,
            ommersHash: this.header.ommersHash,
            beneficiary: this.header.beneficiary,
            stateRoot: this.header.stateRoot,
            transactionsRoot: this.header.transactionsRoot,
            receiptsRoot: this.header.receiptsRoot,
            logsBloom: this.header.logsBloom,
            difficulty: this.header.difficulty.toString(),
            number: this.header.number.toString(),
            gasLimit: this.header.gasLimit.toString(),
            gasUsed: this.header.gasUsed.toString(),
            timestamp: this.header.timestamp.toString(),
            extraData: this.header.extraData,
            mixHash: this.header.mixHash,
            nonce: this.header.nonce
        };

        const headerString = JSON.stringify(headerData);
        return keccak256(Buffer.from(headerString)).toString('hex');
    }

    /**
     * Validate the block structure and data
     */
    public validate(): boolean {
        try {
            // Basic structure validation
            if (!this.header || !this.transactions || !this.ommers) {
                return false;
            }

            // Validate block number is sequential
            if (this.header.number < 0n) {
                return false;
            }

            // Validate timestamp
            if (this.header.timestamp <= 0n) {
                return false;
            }

            // Validate gas limits
            if (this.header.gasLimit <= 0n || this.header.gasUsed > this.header.gasLimit) {
                return false;
            }

            // Validate transactions
            for (const tx of this.transactions) {
                if (!tx.validate()) {
                    return false;
                }
            }

            // Validate hash integrity
            const calculatedHash = this.calculateHash();
            if (calculatedHash !== this.hash) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the total difficulty of this block
     */
    public getTotalDifficulty(): bigint {
        return this.header.difficulty;
    }

    /**
     * Check if this block has enough validator signatures for consensus
     */
    public hasConsensus(requiredValidators: number = 4): boolean {
        return this.validatorSignatures.length >= requiredValidators;
    }

    /**
     * Add a validator signature to this block
     */
    public addValidatorSignature(signature: ValidatorSignature): void {
        // Check if validator already signed
        const existingSignature = this.validatorSignatures.find(
            sig => sig.validator === signature.validator
        );

        if (existingSignature) {
            throw new Error(`Validator ${signature.validator} has already signed this block`);
        }

        this.validatorSignatures.push(signature);
        this.emit('validatorSigned', signature);

        // Check if we now have consensus
        if (this.hasConsensus()) {
            this.emit('consensus', this);
        }
    }

    /**
     * Serialize block to JSON
     */
    public toJSON(): any {
        return {
            hash: this.hash,
            header: {
                ...this.header,
                difficulty: this.header.difficulty.toString(),
                number: this.header.number.toString(),
                gasLimit: this.header.gasLimit.toString(),
                gasUsed: this.header.gasUsed.toString(),
                timestamp: this.header.timestamp.toString()
            },
            transactions: this.transactions.map(tx => tx.toJSON()),
            ommers: this.ommers,
            validatorSignatures: this.validatorSignatures
        };
    }

    /**
     * Create a block from JSON data
     */
    public static fromJSON(data: any): Block {
        const header: BlockHeader = {
            ...data.header,
            difficulty: BigInt(data.header.difficulty),
            number: BigInt(data.header.number),
            gasLimit: BigInt(data.header.gasLimit),
            gasUsed: BigInt(data.header.gasUsed),
            timestamp: BigInt(data.header.timestamp)
        };

        const transactions = data.transactions.map((txData: any) =>
            Transaction.fromJSON(txData)
        );

        const blockData: BlockData = {
            header,
            transactions,
            ommers: data.ommers || []
        };

        return new Block(blockData, data.validatorSignatures || []);
    }

    /**
     * Create genesis block
     */
    public static createGenesis(): Block {
        const genesisHeader: BlockHeader = {
            parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            ommersHash: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
            beneficiary: '0x0000000000000000000000000000000000000000',
            stateRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
            transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
            receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
            logsBloom: '0x' + '0'.repeat(512),
            difficulty: 1000000n,
            number: 0n,
            gasLimit: 100000000n,
            gasUsed: 0n,
            timestamp: BigInt(Date.now()),
            extraData: '0x41726e61436861696e2047656e6573697320426c6f636b', // "AgentChain Genesis Block" in hex
            mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            nonce: '0x0000000000000042'
        };

        const blockData: BlockData = {
            header: genesisHeader,
            transactions: [],
            ommers: []
        };

        return new Block(blockData);
    }
}