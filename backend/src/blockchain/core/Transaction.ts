import { keccak256 } from '@ethereum/util';

export interface TransactionData {
    nonce: bigint;
    gasPrice: bigint;
    gasLimit: bigint;
    to: string | null;
    value: bigint;
    data: string;
    v: bigint;
    r: string;
    s: string;
}

export class Transaction {
    public readonly nonce: bigint;
    public readonly gasPrice: bigint;
    public readonly gasLimit: bigint;
    public readonly to: string | null;
    public readonly value: bigint;
    public readonly data: string;
    public readonly v: bigint;
    public readonly r: string;
    public readonly s: string;
    public readonly hash: string;

    constructor(txData: TransactionData) {
        this.nonce = txData.nonce;
        this.gasPrice = txData.gasPrice;
        this.gasLimit = txData.gasLimit;
        this.to = txData.to;
        this.value = txData.value;
        this.data = txData.data;
        this.v = txData.v;
        this.r = txData.r;
        this.s = txData.s;
        this.hash = this.calculateHash();
    }

    /**
     * Calculate the hash of this transaction
     */
    private calculateHash(): string {
        const txData = {
            nonce: this.nonce.toString(),
            gasPrice: this.gasPrice.toString(),
            gasLimit: this.gasLimit.toString(),
            to: this.to,
            value: this.value.toString(),
            data: this.data,
            v: this.v.toString(),
            r: this.r,
            s: this.s
        };

        const txString = JSON.stringify(txData);
        return keccak256(Buffer.from(txString)).toString('hex');
    }

    /**
     * Validate the transaction
     */
    public validate(): boolean {
        try {
            // Basic validation
            if (this.gasLimit <= 0n || this.gasPrice < 0n || this.value < 0n || this.nonce < 0n) {
                return false;
            }

            // Validate signature components
            if (!this.r || !this.s || this.v < 0n) {
                return false;
            }

            // Validate data format
            if (this.data && !this.data.startsWith('0x')) {
                return false;
            }

            // Validate address format (if not contract creation)
            if (this.to && !this.isValidAddress(this.to)) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if address is valid
     */
    private isValidAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Get the sender address (requires signature verification)
     */
    public getSender(): string {
        // This would normally recover the address from the signature
        // For now, returning a placeholder
        return '0x' + '0'.repeat(40);
    }

    /**
     * Check if this is a contract creation transaction
     */
    public isContractCreation(): boolean {
        return this.to === null || this.to === '';
    }

    /**
     * Get transaction cost (gas * gasPrice + value)
     */
    public getCost(): bigint {
        return this.gasLimit * this.gasPrice + this.value;
    }

    /**
     * Serialize transaction to JSON
     */
    public toJSON(): any {
        return {
            hash: this.hash,
            nonce: this.nonce.toString(),
            gasPrice: this.gasPrice.toString(),
            gasLimit: this.gasLimit.toString(),
            to: this.to,
            value: this.value.toString(),
            data: this.data,
            v: this.v.toString(),
            r: this.r,
            s: this.s
        };
    }

    /**
     * Create transaction from JSON data
     */
    public static fromJSON(data: any): Transaction {
        const txData: TransactionData = {
            nonce: BigInt(data.nonce),
            gasPrice: BigInt(data.gasPrice),
            gasLimit: BigInt(data.gasLimit),
            to: data.to,
            value: BigInt(data.value),
            data: data.data,
            v: BigInt(data.v),
            r: data.r,
            s: data.s
        };

        return new Transaction(txData);
    }

    /**
     * Create a simple transfer transaction
     */
    public static createTransfer(
        from: string,
        to: string,
        value: bigint,
        nonce: bigint,
        gasPrice: bigint = 5000000000n, // 5 Gwei
        gasLimit: bigint = 21000n
    ): Transaction {
        const txData: TransactionData = {
            nonce,
            gasPrice,
            gasLimit,
            to,
            value,
            data: '0x',
            v: 27n, // Placeholder signature
            r: '0x' + '0'.repeat(64),
            s: '0x' + '0'.repeat(64)
        };

        return new Transaction(txData);
    }

    /**
     * Create a contract deployment transaction
     */
    public static createContractDeployment(
        from: string,
        bytecode: string,
        value: bigint,
        nonce: bigint,
        gasPrice: bigint = 5000000000n, // 5 Gwei
        gasLimit: bigint = 2000000n
    ): Transaction {
        const txData: TransactionData = {
            nonce,
            gasPrice,
            gasLimit,
            to: null,
            value,
            data: bytecode,
            v: 27n, // Placeholder signature
            r: '0x' + '0'.repeat(64),
            s: '0x' + '0'.repeat(64)
        };

        return new Transaction(txData);
    }
}