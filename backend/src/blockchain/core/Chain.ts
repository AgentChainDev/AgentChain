import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { Block } from './Block';
import { StateManager } from './StateManager';
import { Transaction } from './Transaction';
import { TransactionPool } from './TransactionPool';

export interface ChainStats {
    height: number;
    totalDifficulty: bigint;
    hashRate: number;
    avgBlockTime: number;
    totalTransactions: number;
    totalSupply: string;
    circulatingSupply: string;
    lastBlockTime: number;
    pendingTransactions: number;
    networkHashRate: string;
}

export interface NetworkInfo {
    chainId: number;
    networkName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls: string[];
}

export class Chain extends EventEmitter {
    private blocks: Map<string, Block> = new Map();
    private blocksByNumber: Map<number, Block> = new Map();
    private currentHeight: number = 0;
    private genesisBlock: Block;
    private stateManager: StateManager;
    private transactionPool: TransactionPool;
    private isProducingBlocks: boolean = false;
    private blockProductionInterval: NodeJS.Timeout | null = null;
    private readonly BLOCK_TIME = 10000; // 10 seconds
    private readonly MAX_BLOCK_SIZE = 2 * 1024 * 1024; // 2MB
    private readonly CHAIN_ID = 56; // BSC compatible

    // Performance tracking
    private blockTimes: number[] = [];
    private hashRateHistory: number[] = [];

    constructor() {
        super();
        this.stateManager = new StateManager();
        this.transactionPool = new TransactionPool();
        this.initializeGenesis();
    }

    private initializeGenesis(): void {
        this.genesisBlock = Block.createGenesis();
        this.blocks.set(this.genesisBlock.hash, this.genesisBlock);
        this.blocksByNumber.set(0, this.genesisBlock);
        this.currentHeight = 0;

        logger.info('Genesis block created', {
            hash: this.genesisBlock.hash,
            timestamp: this.genesisBlock.header.timestamp.toString()
        });
    }

    public async initialize(): Promise<void> {
        try {
            await this.stateManager.initialize();
            await this.transactionPool.initialize();

            // Load existing blocks from database if any
            await this.loadExistingBlocks();

            logger.info('Blockchain initialized', {
                height: this.currentHeight,
                chainId: this.CHAIN_ID
            });
        } catch (error) {
            logger.error('Failed to initialize blockchain:', error);
            throw error;
        }
    }

    private async loadExistingBlocks(): Promise<void> {
        // In a real implementation, this would load from database
        // For now, we'll start fresh each time
        logger.info('Starting with fresh blockchain state');
    }

    public async startBlockProduction(): Promise<void> {
        if (this.isProducingBlocks) {
            logger.warn('Block production already started');
            return;
        }

        this.isProducingBlocks = true;
        this.blockProductionInterval = setInterval(
            () => this.produceBlock(),
            this.BLOCK_TIME
        );

        logger.info('Block production started', {
            blockTime: this.BLOCK_TIME,
            targetHeight: this.currentHeight + 1
        });
    }

    public async stopBlockProduction(): Promise<void> {
        if (!this.isProducingBlocks) {
            return;
        }

        this.isProducingBlocks = false;
        if (this.blockProductionInterval) {
            clearInterval(this.blockProductionInterval);
            this.blockProductionInterval = null;
        }

        logger.info('Block production stopped');
    }

    private async produceBlock(): Promise<void> {
        try {
            const startTime = Date.now();

            // Get pending transactions
            const pendingTxs = await this.transactionPool.getPendingTransactions(100);

            // Select validator (in real implementation, this would use PoSA consensus)
            const validator = this.selectValidator();

            // Create new block
            const previousBlock = this.getLatestBlock();
            const blockNumber = this.currentHeight + 1;

            const blockData = {
                header: {
                    parentHash: previousBlock.hash,
                    ommersHash: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
                    beneficiary: validator,
                    stateRoot: await this.stateManager.getStateRoot(),
                    transactionsRoot: this.calculateTransactionsRoot(pendingTxs),
                    receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
                    logsBloom: '0x' + '0'.repeat(512),
                    difficulty: this.calculateDifficulty(),
                    number: BigInt(blockNumber),
                    gasLimit: 100000000n,
                    gasUsed: this.calculateGasUsed(pendingTxs),
                    timestamp: BigInt(Date.now()),
                    extraData: this.generateExtraData(blockNumber),
                    mixHash: '0x' + '0'.repeat(64),
                    nonce: this.generateNonce()
                },
                transactions: pendingTxs,
                ommers: []
            };

            const newBlock = new Block(blockData);

            // Validate and add block
            if (await this.addBlock(newBlock)) {
                const blockTime = Date.now() - startTime;
                this.trackPerformance(blockTime);

                logger.info('New block produced', {
                    height: blockNumber,
                    hash: newBlock.hash,
                    transactions: pendingTxs.length,
                    validator,
                    blockTime: `${blockTime}ms`
                });

                this.emit('blockProduced', newBlock);
            }
        } catch (error) {
            logger.error('Failed to produce block:', error);
        }
    }

    private selectValidator(): string {
        // Simple round-robin for now, in real implementation this would use PoSA
        const validators = [
            '0x1234567890123456789012345678901234567890', // Claude
            '0x2345678901234567890123456789012345678901', // GPT
            '0x3456789012345678901234567890123456789012', // Grok
            '0x4567890123456789012345678901234567890123', // Stable
            '0x5678901234567890123456789012345678901234', // Perplex
            '0x6789012345678901234567890123456789012345'  // Cohere
        ];

        return validators[this.currentHeight % validators.length];
    }

    private calculateTransactionsRoot(transactions: Transaction[]): string {
        if (transactions.length === 0) {
            return '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421';
        }

        // Simplified merkle root calculation
        const txHashes = transactions.map(tx => tx.hash);
        return this.buildMerkleTree(txHashes);
    }

    private buildMerkleTree(hashes: string[]): string {
        if (hashes.length === 1) {
            return hashes[0];
        }

        const newLevel: string[] = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || left;
            // In real implementation, use proper hash function
            newLevel.push('0x' + Buffer.from(left + right).toString('hex').slice(0, 64));
        }

        return this.buildMerkleTree(newLevel);
    }

    private calculateGasUsed(transactions: Transaction[]): bigint {
        return transactions.reduce((total, tx) => total + tx.gasUsed, 0n);
    }

    private calculateDifficulty(): bigint {
        // Simplified difficulty adjustment
        const baseDifficulty = 1000000n;
        const adjustment = BigInt(Math.floor(Math.sin(this.currentHeight / 100) * 100000));
        return baseDifficulty + adjustment;
    }

    private generateExtraData(blockNumber: number): string {
        const messages = [
            'AgentChain Genesis',
            'AI Validators Active',
            'Autonomous Governance',
            'BSC Compatible Chain',
            'Multi-Agent Consensus',
            'Decentralized AI'
        ];

        const message = messages[blockNumber % messages.length];
        return '0x' + Buffer.from(message).toString('hex');
    }

    private generateNonce(): string {
        return '0x' + Math.random().toString(16).slice(2).padStart(16, '0');
    }

    private trackPerformance(blockTime: number): void {
        this.blockTimes.push(blockTime);
        if (this.blockTimes.length > 100) {
            this.blockTimes.shift();
        }

        // Calculate hash rate (simplified)
        const hashRate = 1000000 / blockTime; // Hashes per second
        this.hashRateHistory.push(hashRate);
        if (this.hashRateHistory.length > 100) {
            this.hashRateHistory.shift();
        }
    }

    public async addBlock(block: Block): Promise<boolean> {
        try {
            // Validate block
            if (!block.validate()) {
                logger.warn('Invalid block rejected', { hash: block.hash });
                return false;
            }

            // Check if block already exists
            if (this.blocks.has(block.hash)) {
                logger.warn('Duplicate block rejected', { hash: block.hash });
                return false;
            }

            // Verify parent block exists
            const parentBlock = this.blocks.get(block.header.parentHash);
            if (!parentBlock && block.header.number > 0n) {
                logger.warn('Orphan block rejected', {
                    hash: block.hash,
                    parentHash: block.header.parentHash
                });
                return false;
            }

            // Verify block number is sequential
            const expectedNumber = this.currentHeight + 1;
            if (Number(block.header.number) !== expectedNumber) {
                logger.warn('Block number mismatch', {
                    expected: expectedNumber,
                    received: Number(block.header.number)
                });
                return false;
            }

            // Process transactions and update state
            for (const tx of block.transactions) {
                await this.stateManager.processTransaction(tx);
                await this.transactionPool.removeTransaction(tx.hash);
            }

            // Add block to chain
            this.blocks.set(block.hash, block);
            this.blocksByNumber.set(Number(block.header.number), block);
            this.currentHeight = Number(block.header.number);

            // Emit events
            this.emit('blockAdded', block);

            return true;
        } catch (error) {
            logger.error('Failed to add block:', error);
            return false;
        }
    }

    public getBlock(hash: string): Block | null {
        return this.blocks.get(hash) || null;
    }

    public getBlockByNumber(number: number): Block | null {
        return this.blocksByNumber.get(number) || null;
    }

    public getLatestBlock(): Block {
        return this.blocksByNumber.get(this.currentHeight) || this.genesisBlock;
    }

    public getHeight(): number {
        return this.currentHeight;
    }

    public getChainId(): number {
        return this.CHAIN_ID;
    }

    public async addTransaction(transaction: Transaction): Promise<boolean> {
        return await this.transactionPool.addTransaction(transaction);
    }

    public getTransaction(hash: string): Transaction | null {
        // Search in all blocks
        for (const block of this.blocks.values()) {
            const tx = block.transactions.find(t => t.hash === hash);
            if (tx) return tx;
        }

        // Search in pending transactions
        return this.transactionPool.getTransaction(hash);
    }

    public getTransactionsByAddress(address: string, limit: number = 50): Transaction[] {
        const transactions: Transaction[] = [];

        // Search in blocks (most recent first)
        for (let i = this.currentHeight; i >= 0 && transactions.length < limit; i--) {
            const block = this.blocksByNumber.get(i);
            if (block) {
                for (const tx of block.transactions) {
                    if (tx.from.toLowerCase() === address.toLowerCase() ||
                        tx.to.toLowerCase() === address.toLowerCase()) {
                        transactions.push(tx);
                        if (transactions.length >= limit) break;
                    }
                }
            }
        }

        return transactions;
    }

    public getBalance(address: string): Promise<bigint> {
        return this.stateManager.getBalance(address);
    }

    public getNonce(address: string): Promise<bigint> {
        return this.stateManager.getNonce(address);
    }

    public getStats(): ChainStats {
        const avgBlockTime = this.blockTimes.length > 0
            ? this.blockTimes.reduce((a, b) => a + b, 0) / this.blockTimes.length
            : this.BLOCK_TIME;

        const avgHashRate = this.hashRateHistory.length > 0
            ? this.hashRateHistory.reduce((a, b) => a + b, 0) / this.hashRateHistory.length
            : 0;

        const totalTx = Array.from(this.blocks.values())
            .reduce((total, block) => total + block.transactions.length, 0);

        return {
            height: this.currentHeight,
            totalDifficulty: this.calculateTotalDifficulty(),
            hashRate: Math.round(avgHashRate),
            avgBlockTime: Math.round(avgBlockTime),
            totalTransactions: totalTx,
            totalSupply: this.calculateTotalSupply(),
            circulatingSupply: this.calculateCirculatingSupply(),
            lastBlockTime: this.getLatestBlock().header.timestamp ? Number(this.getLatestBlock().header.timestamp) : Date.now(),
            pendingTransactions: this.transactionPool.getSize(),
            networkHashRate: this.formatHashRate(avgHashRate)
        };
    }

    private calculateTotalDifficulty(): bigint {
        let totalDifficulty = 0n;
        for (const block of this.blocks.values()) {
            totalDifficulty += block.header.difficulty;
        }
        return totalDifficulty;
    }

    private calculateTotalSupply(): string {
        // Initial supply + block rewards
        const initialSupply = 1000000000; // 1B AGENTCHAIN
        const blockRewards = this.currentHeight * 2.5; // 2.5 AGENTCHAIN per block
        return (initialSupply + blockRewards).toFixed(18);
    }

    private calculateCirculatingSupply(): string {
        const totalSupply = parseFloat(this.calculateTotalSupply());
        return (totalSupply * 0.85).toFixed(18); // 85% circulating, 15% locked
    }

    private formatHashRate(hashRate: number): string {
        if (hashRate > 1e12) return `${(hashRate / 1e12).toFixed(2)} TH/s`;
        if (hashRate > 1e9) return `${(hashRate / 1e9).toFixed(2)} GH/s`;
        if (hashRate > 1e6) return `${(hashRate / 1e6).toFixed(2)} MH/s`;
        if (hashRate > 1e3) return `${(hashRate / 1e3).toFixed(2)} KH/s`;
        return `${hashRate.toFixed(2)} H/s`;
    }

    public getNetworkInfo(): NetworkInfo {
        return {
            chainId: this.CHAIN_ID,
            networkName: 'AgentChain',
            nativeCurrency: {
                name: 'AGENTCHAIN',
                symbol: 'AGENTCHAIN',
                decimals: 18
            },
            rpcUrls: [
                'http://localhost:4000',
                'https://rpc.agentchain.io'
            ],
            blockExplorerUrls: [
                'https://explorer.agentchain.io'
            ]
        };
    }

    public async getBlockRange(fromBlock: number, toBlock: number): Promise<Block[]> {
        const blocks: Block[] = [];
        const start = Math.max(0, fromBlock);
        const end = Math.min(this.currentHeight, toBlock);

        for (let i = start; i <= end; i++) {
            const block = this.blocksByNumber.get(i);
            if (block) {
                blocks.push(block);
            }
        }

        return blocks;
    }

    public async reorg(targetHash: string): Promise<boolean> {
        // Implement blockchain reorganization logic
        logger.warn('Blockchain reorganization requested', { targetHash });
        // This is a complex operation that would handle chain forks
        return false;
    }
}