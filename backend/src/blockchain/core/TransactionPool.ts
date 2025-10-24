import { Transaction } from './Transaction';

export interface PoolStats {
    pending: number;
    queued: number;
    totalFees: string;
    avgGasPrice: string;
    maxGasPrice: string;
    minGasPrice: string;
}

export class TransactionPool {
    private pendingTransactions: Map<string, Transaction> = new Map();
    private queuedTransactions: Map<string, Transaction[]> = new Map();
    private readonly MAX_POOL_SIZE = 10000;
    private readonly MAX_PER_ACCOUNT = 100;

    constructor() { }

    public async initialize(): Promise<void> {
        // Initialize transaction pool
    }

    public async addTransaction(transaction: Transaction): Promise<boolean> {
        try {
            // Validate transaction
            if (!transaction.validate()) {
                return false;
            }

            // Check if transaction already exists
            if (this.pendingTransactions.has(transaction.hash)) {
                return false;
            }

            // Check pool size limit
            if (this.pendingTransactions.size >= this.MAX_POOL_SIZE) {
                // Remove lowest fee transactions
                this.evictLowestFeeTransactions();
            }

            // Add to pending pool
            this.pendingTransactions.set(transaction.hash, transaction);

            return true;
        } catch (error) {
            return false;
        }
    }

    public async removeTransaction(hash: string): Promise<boolean> {
        return this.pendingTransactions.delete(hash);
    }

    public getTransaction(hash: string): Transaction | null {
        return this.pendingTransactions.get(hash) || null;
    }

    public async getPendingTransactions(limit: number = 100): Promise<Transaction[]> {
        const transactions = Array.from(this.pendingTransactions.values());

        // Sort by gas price (descending) and nonce (ascending)
        transactions.sort((a, b) => {
            const gasPriceDiff = parseFloat(b.gasPrice) - parseFloat(a.gasPrice);
            if (gasPriceDiff !== 0) return gasPriceDiff;
            return Number(a.nonce) - Number(b.nonce);
        });

        return transactions.slice(0, limit);
    }

    public getSize(): number {
        return this.pendingTransactions.size;
    }

    public getStats(): PoolStats {
        const transactions = Array.from(this.pendingTransactions.values());

        if (transactions.length === 0) {
            return {
                pending: 0,
                queued: 0,
                totalFees: '0',
                avgGasPrice: '0',
                maxGasPrice: '0',
                minGasPrice: '0'
            };
        }

        const gasPrices = transactions.map(tx => parseFloat(tx.gasPrice));
        const totalFees = transactions.reduce((sum, tx) => {
            return sum + (parseFloat(tx.gasPrice) * parseFloat(tx.gasLimit.toString()));
        }, 0);

        return {
            pending: this.pendingTransactions.size,
            queued: 0, // Simplified for now
            totalFees: (totalFees / 1e18).toFixed(6), // Convert to 
            avgGasPrice: (gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length / 1e9).toFixed(2), // Gwei
            maxGasPrice: (Math.max(...gasPrices) / 1e9).toFixed(2), // Gwei
            minGasPrice: (Math.min(...gasPrices) / 1e9).toFixed(2) // Gwei
        };
    }

    private evictLowestFeeTransactions(): void {
        const transactions = Array.from(this.pendingTransactions.entries());

        // Sort by gas price (ascending) to find lowest fee transactions
        transactions.sort(([, a], [, b]) => parseFloat(a.gasPrice) - parseFloat(b.gasPrice));

        // Remove bottom 10%
        const removeCount = Math.floor(transactions.length * 0.1);
        for (let i = 0; i < removeCount; i++) {
            const [hash] = transactions[i];
            this.pendingTransactions.delete(hash);
        }
    }

    public clear(): void {
        this.pendingTransactions.clear();
        this.queuedTransactions.clear();
    }

    public getTransactionsByAddress(address: string): Transaction[] {
        const transactions: Transaction[] = [];

        for (const tx of this.pendingTransactions.values()) {
            if (tx.from.toLowerCase() === address.toLowerCase() ||
                (tx.to && tx.to.toLowerCase() === address.toLowerCase())) {
                transactions.push(tx);
            }
        }

        return transactions;
    }

    public hasTransaction(hash: string): boolean {
        return this.pendingTransactions.has(hash);
    }

    public getPendingNonce(address: string): bigint {
        const transactions = this.getTransactionsByAddress(address);

        if (transactions.length === 0) {
            return 0n;
        }

        // Find highest nonce for this address
        const maxNonce = transactions.reduce((max, tx) => {
            return tx.nonce > max ? tx.nonce : max;
        }, 0n);

        return maxNonce + 1n;
    }
}