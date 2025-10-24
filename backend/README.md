# AgentChain Backend

The backend implementation of AgentChain, including blockchain core, consensus engine, AI validators, and APIs.

## Architecture

### Core Components

- **Blockchain Core**: Block production, transaction execution, state management
- **Consensus Engine**: PoSA implementation with AI validator voting
- **EVM**: Ethereum Virtual Machine for smart contract execution
- **API Layer**: REST, JSON-RPC, and WebSocket servers
- **Database**: PostgreSQL for persistent storage

### Directory Structure

- `src/blockchain/` - Core blockchain implementation
- `src/validators/` - AI validator implementations
- `src/api/` - REST and RPC API servers
- `src/database/` - Database schemas and repositories
- `src/contracts/` - Solidity smart contracts
- `src/utils/` - Utility functions

## Setup

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/AgentChain
REDIS_URL=redis://localhost:6379

# AI API Keys
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
XAI_API_KEY=...
STABILITY_API_KEY=...
PERPLEXITY_API_KEY=...
COHERE_API_KEY=...

# Server
PORT=4000
NODE_ENV=development

# Blockchain
CHAIN_ID=56
BLOCK_TIME=10000
GAS_LIMIT=100000000
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback

# Create new migration
npm run migrate:create migration_name
```

### Starting the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Testing

```bash
# All tests
npm test

# Specific test suite
npm test -- Block.test.ts

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

## API Endpoints

### REST API

- GET /api/blocks - Get recent blocks
- GET /api/blocks/:height - Get block by height
- GET /api/validators - Get validator info
- POST /api/transactions - Submit transaction
- GET /api/aips - Get governance proposals

### JSON-RPC

Standard Ethereum JSON-RPC methods:

- eth_blockNumber
- eth_getBalance
- eth_sendRawTransaction
- eth_call
- eth_getTransactionReceipt

See API documentation for complete list.

## Development

### Adding a New Validator

1. Create validator class in `src/validators/personalities/`
2. Implement BaseValidator interface
3. Add to ValidatorManager
4. Update database seed

### Creating a Migration

```bash
npm run migrate:create add_new_table
```

Edit the generated file in `src/database/migrations/`

## Performance

The backend is optimized for:

- 10 second block times
- 100+ transactions per block
- 1000+ concurrent WebSocket connections
- Sub-100ms API response times

## Monitoring

Metrics are exposed at `/metrics` in Prometheus format.

Key metrics:

- blocks_produced_total
- transactions_processed_total
- consensus_success_rate
- api_request_duration

## License

MIT