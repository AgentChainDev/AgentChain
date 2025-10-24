import { Transaction } from './Transaction';

export interface AccountState {
    balance: bigint;
    nonce: bigint;
    codeHash?: string;
    storageRoot?: string;
}

export interface StateSnapshot {
    accounts: Map<string, AccountState>;
    contracts: Map<string, any>;
    stateRoot: string;
    timestamp: number;
}

export class StateManager {
    private accounts: Map<string, AccountState> = new Map();
    private contracts: Map<string, any> = new Map();
    private snapshots: StateSnapshot[] = [];
    private currentStateRoot: string = '';

    constructor() {
        this.initializeGenesisState();
    }

    public async initialize(): Promise<void> {
        // Initialize with genesis accounts
        this.initializeGenesisState();
        this.updateStateRoot();
    }

    private initializeGenesisState(): void {
        // Genesis accounts with initial balances
        const genesisAccounts = [
            {
                address: '0x1234567890123456789012345678901234567890',
                balance: BigInt('1000000000000000000000000000'), // 1B AGENTCHAIN
                nonce: 0n
            },
            {
                address: '0x2345678901234567890123456789012345678901',
                balance: BigInt('500000000000000000000000000'), // 500M AGENTCHAIN
                nonce: 0n
            },
            {
                address: '0x3456789012345678901234567890123456789012',
                balance: BigInt('100000000000000000000000000'), // 100M AGENTCHAIN
                nonce: 0n
            }
        ];

        for (const account of genesisAccounts) {
            this.accounts.set(account.address.toLowerCase(), {
                balance: account.balance,
                nonce: account.nonce
            });
        }
    }

    public async getBalance(address: string): Promise<bigint> {
        const account = this.accounts.get(address.toLowerCase());
        return account ? account.balance : 0n;
    }

    public async getNonce(address: string): Promise<bigint> {
        const account = this.accounts.get(address.toLowerCase());
        return account ? account.nonce : 0n;
    }

    public async setBalance(address: string, balance: bigint): Promise<void> {
        const normalizedAddress = address.toLowerCase();
        const account = this.accounts.get(normalizedAddress) || {
            balance: 0n,
            nonce: 0n
        };

        account.balance = balance;
        this.accounts.set(normalizedAddress, account);
        this.updateStateRoot();
    }

    public async incrementNonce(address: string): Promise<void> {
        const normalizedAddress = address.toLowerCase();
        const account = this.accounts.get(normalizedAddress) || {
            balance: 0n,
            nonce: 0n
        };

        account.nonce += 1n;
        this.accounts.set(normalizedAddress, account);
        this.updateStateRoot();
    }

    public async transfer(from: string, to: string, amount: bigint): Promise<boolean> {
        const fromAddress = from.toLowerCase();
        const toAddress = to.toLowerCase();

        const fromAccount = this.accounts.get(fromAddress);
        if (!fromAccount || fromAccount.balance < amount) {
            return false;
        }

        const toAccount = this.accounts.get(toAddress) || {
            balance: 0n,
            nonce: 0n
        };

        // Perform transfer
        fromAccount.balance -= amount;
        toAccount.balance += amount;

        this.accounts.set(fromAddress, fromAccount);
        this.accounts.set(toAddress, toAccount);
        this.updateStateRoot();

        return true;
    }

    public async processTransaction(transaction: Transaction): Promise<boolean> {
        try {
            const from = transaction.from.toLowerCase();
            const to = transaction.to?.toLowerCase();

            // Get sender account
            const fromAccount = this.accounts.get(from);
            if (!fromAccount) {
                return false;
            }

            // Check nonce
            if (fromAccount.nonce !== transaction.nonce) {
                return false;
            }

            // Calculate total cost (value + gas fees)
            const gasPrice = BigInt(transaction.gasPrice);
            const gasLimit = BigInt(transaction.gasLimit);
            const gasCost = gasPrice * gasLimit;
            const totalCost = transaction.value + gasCost;

            // Check balance
            if (fromAccount.balance < totalCost) {
                return false;
            }

            // Process transfer
            if (to && transaction.value > 0n) {
                const success = await this.transfer(from, to, transaction.value);
                if (!success) {
                    return false;
                }
            }

            // Deduct gas fees
            fromAccount.balance -= gasCost;

            // Increment nonce
            fromAccount.nonce += 1n;

            this.accounts.set(from, fromAccount);
            this.updateStateRoot();

            return true;
        } catch (error) {
            return false;
        }
    }

    public async getStateRoot(): Promise<string> {
        return this.currentStateRoot;
    }

    private updateStateRoot(): void {
        // Simple state root calculation based on account data
        const accountData = Array.from(this.accounts.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([address, account]) => `${address}:${account.balance}:${account.nonce}`)
            .join('|');

        // In a real implementation, this would use a Merkle tree
        this.currentStateRoot = '0x' + this.simpleHash(accountData);
    }

    private simpleHash(data: string): string {
        // Simplified hash function (in production, use proper cryptographic hash)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    public createSnapshot(): StateSnapshot {
        const snapshot: StateSnapshot = {
            accounts: new Map(this.accounts),
            contracts: new Map(this.contracts),
            stateRoot: this.currentStateRoot,
            timestamp: Date.now()
        };

        this.snapshots.push(snapshot);

        // Keep only last 100 snapshots
        if (this.snapshots.length > 100) {
            this.snapshots.shift();
        }

        return snapshot;
    }

    public restoreSnapshot(snapshot: StateSnapshot): void {
        this.accounts = new Map(snapshot.accounts);
        this.contracts = new Map(snapshot.contracts);
        this.currentStateRoot = snapshot.stateRoot;
    }

    public getAccount(address: string): AccountState | null {
        return this.accounts.get(address.toLowerCase()) || null;
    }

    public getAllAccounts(): Map<string, AccountState> {
        return new Map(this.accounts);
    }

    public getAccountCount(): number {
        return this.accounts.size;
    }

    public getTotalSupply(): bigint {
        let total = 0n;
        for (const account of this.accounts.values()) {
            total += account.balance;
        }
        return total;
    }
}