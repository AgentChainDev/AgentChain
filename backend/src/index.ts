import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Load environment variables
dotenv.config();

// Import core components
import { RestServer } from './api/rest/server';
import { JsonRpcServer } from './api/rpc/JsonRpcServer';
import { WSServer } from './api/websocket/WSServer';
import { Chain } from './blockchain/core/Chain';
import { Database } from './database/connection';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { ValidatorManager } from './validators/core/ValidatorManager';

class AgentChainNode {
    private app: express.Application;
    private server: any;
    private chain: Chain;
    private validatorManager: ValidatorManager;
    private database: Database;
    private restServer: RestServer;
    private rpcServer: JsonRpcServer;
    private wsServer: WSServer;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.initializeComponents();
    }

    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    private async initializeComponents(): Promise<void> {
        try {
            // Initialize database connection
            this.database = new Database();
            await this.database.connect();
            logger.info('Database connected successfully');

            // Initialize blockchain
            this.chain = new Chain();
            await this.chain.initialize();
            logger.info('Blockchain initialized');

            // Initialize validator manager
            this.validatorManager = new ValidatorManager();
            await this.validatorManager.initialize();
            logger.info('Validator manager initialized');

            // Initialize API servers
            this.restServer = new RestServer(this.chain, this.validatorManager);
            this.rpcServer = new JsonRpcServer(this.chain);

            // Setup REST API routes
            this.app.use('/api', this.restServer.getRouter());

            // Setup JSON-RPC endpoint
            this.app.use('/', this.rpcServer.getMiddleware());

            // Health check endpoint
            this.app.get('/health', (req, res) => {
                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: process.env.npm_package_version || '1.0.0',
                    chainHeight: this.chain.getHeight(),
                    activeValidators: this.validatorManager.getActiveValidators().length
                });
            });

            logger.info('All components initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize components:', error);
            throw error;
        }
    }

    public async start(): Promise<void> {
        try {
            const port = config.server.port;

            // Create HTTP server
            this.server = createServer(this.app);

            // Setup WebSocket server
            const wss = new WebSocketServer({ server: this.server });
            this.wsServer = new WSServer(wss, this.chain, this.validatorManager);

            // Start the server
            this.server.listen(port, () => {
                logger.info(`AgentChain node started on port ${port}`);
                logger.info(`REST API: http://localhost:${port}/api`);
                logger.info(`JSON-RPC: http://localhost:${port}`);
                logger.info(`WebSocket: ws://localhost:${port}/ws`);
            });

            // Start validator manager
            await this.validatorManager.start();
            logger.info('Validators started');

            // Start block production
            await this.chain.startBlockProduction();
            logger.info('Block production started');

            // Setup graceful shutdown
            this.setupGracefulShutdown();

        } catch (error) {
            logger.error('Failed to start AgentChain node:', error);
            throw error;
        }
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);

            try {
                // Stop block production
                await this.chain.stopBlockProduction();

                // Stop validators
                await this.validatorManager.stop();

                // Close WebSocket server
                if (this.wsServer) {
                    await this.wsServer.close();
                }

                // Close HTTP server
                if (this.server) {
                    this.server.close();
                }

                // Close database connection
                if (this.database) {
                    await this.database.disconnect();
                }

                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
    }

    public getChain(): Chain {
        return this.chain;
    }

    public getValidatorManager(): ValidatorManager {
        return this.validatorManager;
    }
}

// Error handling for unhandled promises and exceptions
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the application if this file is run directly
if (require.main === module) {
    const node = new AgentChainNode();

    node.start().catch((error) => {
        logger.error('Failed to start AgentChain:', error);
        process.exit(1);
    });
}

export { AgentChainNode };
