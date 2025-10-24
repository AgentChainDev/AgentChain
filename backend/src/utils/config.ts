export interface ServerConfig {
    port: number;
    host: string;
    cors: {
        origin: string;
        credentials: boolean;
    };
}

export interface DatabaseConfig {
    url: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
}

export interface BlockchainConfig {
    chainId: number;
    networkName: string;
    blockTime: number;
    gasLimit: number;
    baseFee: number;
    difficulty: number;
}

export interface ValidatorConfig {
    count: number;
    consensus: {
        required: number;
        timeout: number;
    };
    aiProviders: {
        anthropic: {
            apiKey: string;
            model: string;
        };
        openai: {
            apiKey: string;
            model: string;
        };
        xai: {
            apiKey: string;
            model: string;
        };
    };
}

export interface Config {
    server: ServerConfig;
    database: DatabaseConfig;
    blockchain: BlockchainConfig;
    validators: ValidatorConfig;
    environment: string;
}

const defaultConfig: Config = {
    server: {
        port: 4000,
        host: '0.0.0.0',
        cors: {
            origin: '*',
            credentials: true
        }
    },
    database: {
        url: 'postgresql://agentchain:password@localhost:5432/agentchain',
        host: 'localhost',
        port: 5432,
        database: 'agentchain',
        username: 'agentchain',
        password: 'password',
        ssl: false
    },
    blockchain: {
        chainId: 56,
        networkName: 'AgentChain',
        blockTime: 10000, // 10 seconds
        gasLimit: 100000000,
        baseFee: 1000000000, // 1 gwei
        difficulty: 1000000
    },
    validators: {
        count: 6,
        consensus: {
            required: 4,
            timeout: 30000 // 30 seconds
        },
        aiProviders: {
            anthropic: {
                apiKey: '',
                model: 'claude-3-sonnet-20240229'
            },
            openai: {
                apiKey: '',
                model: 'gpt-4'
            },
            xai: {
                apiKey: '',
                model: 'grok-1'
            }
        }
    },
    environment: 'development'
};

// Override with environment variables
function loadConfig(): Config {
    const config = { ...defaultConfig };

    // Server config
    if (process.env.PORT) {
        config.server.port = parseInt(process.env.PORT);
    }
    if (process.env.HOST) {
        config.server.host = process.env.HOST;
    }

    // Database config
    if (process.env.DATABASE_URL) {
        config.database.url = process.env.DATABASE_URL;
    }

    // Blockchain config
    if (process.env.CHAIN_ID) {
        config.blockchain.chainId = parseInt(process.env.CHAIN_ID);
    }
    if (process.env.BLOCK_TIME) {
        config.blockchain.blockTime = parseInt(process.env.BLOCK_TIME);
    }

    // Validator config
    if (process.env.ANTHROPIC_API_KEY) {
        config.validators.aiProviders.anthropic.apiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (process.env.OPENAI_API_KEY) {
        config.validators.aiProviders.openai.apiKey = process.env.OPENAI_API_KEY;
    }
    if (process.env.XAI_API_KEY) {
        config.validators.aiProviders.xai.apiKey = process.env.XAI_API_KEY;
    }

    // Environment
    if (process.env.NODE_ENV) {
        config.environment = process.env.NODE_ENV;
    }

    return config;
}

export const config = loadConfig();