# AgentChain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![BSC Compatible](https://img.shields.io/badge/BSC-Compatible-yellow.svg)](https://www.bnbchain.org/)
[![CI](https://github.com/your-org/AgentChain/workflows/CI/badge.svg)](https://github.com/your-org/AgentChain/actions)
[![Security Scan](https://github.com/your-org/AgentChain/workflows/Security%20Scan/badge.svg)](https://github.com/your-org/AgentChain/actions)

A BSC-compatible blockchain with AI-powered validator consensus and autonomous governance.

## Overview

AgentChain is a production-ready blockchain implementation that combines Binance Smart Chain compatibility with autonomous AI validator consensus. Six AI models (Claude, GPT, Grok, Stable, Perplex, Cohere) operate as validators, debating and voting on protocol improvements through the AgentChain Improvement Proposal (AIP) system.

### Key Features

- BSC-compatible architecture with EVM support
- Proof of Staked Authority (PoSA) consensus mechanism
- Six AI validators with distinct personalities and decision-making patterns
- Autonomous governance through AI-debated AIPs
- Full JSON-RPC API compatibility with MetaMask and Web3.js
- Real-time transaction execution with gas mechanics
- WebSocket event streaming
- Production-ready with comprehensive test coverage

### Network Statistics

- Block Time: 10 seconds
- Gas Limit: 100,000,000
- Consensus Requirement: 4 of 6 validators
- Chain ID: 56 (compatible with BSC mainnet tools)
- Native Token: AGENT

## Architecture

AgentChain implements a three-layer architecture:

1. **Consensus Layer**: PoSA with AI validator governance
2. **Execution Layer**: EVM-compatible transaction processing
3. **Network Layer**: P2P communication and state synchronization

For detailed architecture documentation, see [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Docker and Docker Compose (optional)
- AI API keys (Anthropic, OpenAI, xAI, etc.)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/AgentChain.git
cd AgentChain

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# Start infrastructure
docker-compose up -d postgres redis

# Run database migrations
npm run migrate

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
cd frontend && npm run dev
```

### Using Docker

```bash
docker-compose up -d
```

Access the application at http://localhost:3000

## Development

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## API Documentation

### REST API

The REST API provides access to blockchain data and validator information.

Base URL: http://localhost:4000/api

Example endpoints:
- GET /api/blocks - Get recent blocks
- GET /api/validators - Get validator information
- POST /api/transactions - Submit transaction

See [docs/api/REST_API.md](docs/api/REST_API.md) for complete documentation.

### JSON-RPC API

Full Ethereum JSON-RPC compatibility for Web3 integration.

Endpoint: http://localhost:4000

Supported methods:
- eth_blockNumber
- eth_getBalance
- eth_sendRawTransaction
- eth_call
- And 50+ more methods

See [docs/api/JSON_RPC.md](docs/api/JSON_RPC.md) for complete documentation.

### WebSocket API

Real-time event streaming for block production, transactions, and governance.

Endpoint: ws://localhost:4000/ws

See [docs/api/WEBSOCKET.md](docs/api/WEBSOCKET.md) for documentation.

## Governance

AgentChain uses an autonomous AI governance system where validators debate and vote on protocol improvements.

### Creating an AIP

```javascript
const aip = {
  id: "AIP-001",
  title: "Reduce Block Time to 5 Seconds",
  description: "Proposal to decrease block production time...",
  category: "consensus",
  priority: "high"
};

await submitAIP(aip);
```

See [docs/guides/CREATING_AIP.md](docs/guides/CREATING_AIP.md) for details.

## AI Validators

Six AI models serve as validators, each with unique characteristics:

- **CLAUDE**: Ethics and alignment validator (cautious, fairness-focused)
- **GPT**: Architect validator (system-driven, logical)
- **GROK**: Origin validator (chaotic creativity, questions assumptions)
- **STABLE**: Infrastructure validator (reliability, uptime-focused)
- **PERPLEX**: Knowledge oracle (real-time market intelligence)
- **COHERE**: Consensus synthesizer (harmonizes conflicts)

See [docs/architecture/AI_VALIDATORS.md](docs/architecture/AI_VALIDATORS.md) for details.

## MetaMask Integration

Add AgentChain to MetaMask:

1. Open MetaMask
2. Click "Add Network"
3. Enter network details:
   - Network Name: AgentChain
   - RPC URL: http://localhost:4000
   - Chain ID: 56
   - Currency Symbol: AGENT
   - Block Explorer: http://localhost:3000/explorer

See [docs/guides/METAMASK_SETUP.md](docs/guides/METAMASK_SETUP.md) for details.

## Deployment

### Production Deployment

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

See infrastructure documentation for Kubernetes and Terraform configurations.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Community

- Discord: https://discord.gg/AgentChain
- Twitter: @AgentChain
- Forum: https://forum.AgentChain.io

## Acknowledgments

- Binance Smart Chain for the PoSA consensus inspiration
- Ethereum Foundation for EVM specifications
- Anthropic, OpenAI, xAI, Stability AI, Perplexity, and Cohere for AI APIs

## Citation

If you use AgentChain in your research, please cite:

```bibtex
@software{AgentChain2024,
  title = {AgentChain: AI-Governed Blockchain with Autonomous Consensus},
  author = {AgentChain Contributors},
  year = {2024},
  url = {https://github.com/your-org/AgentChain}
}
```