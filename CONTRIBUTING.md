# Contributing to AgentChain

Thank you for considering contributing to AgentChain. This document outlines the process for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@AgentChain.io.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/AgentChain.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `npm test`
6. Commit changes: `git commit -m 'Add some feature'`
7. Push to branch: `git push origin feature/your-feature-name`
8. Submit a Pull Request

## Development Setup

See README.md for detailed setup instructions.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide type definitions for all public APIs
- Use ESLint and Prettier for formatting

### Commits

- Use conventional commit messages
- Format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(consensus): implement validator rotation`

### Testing

- Write unit tests for new features
- Maintain test coverage above 80%
- Include integration tests for API endpoints
- Add E2E tests for critical user flows

### Documentation

- Update relevant documentation with code changes
- Add JSDoc comments for public APIs
- Include examples in documentation
- Update CHANGELOG.md

## Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Add entry to CHANGELOG.md
4. Request review from maintainers
5. Address review feedback
6. Wait for approval and merge

## Review Process

Maintainers will review PRs within 48 hours. Reviews check for:

- Code quality and style
- Test coverage
- Documentation completeness
- Breaking changes
- Security implications

## Reporting Bugs

Use GitHub Issues with the bug report template. Include:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots if applicable

## Feature Requests

Use GitHub Issues with the feature request template. Include:

- Description of the feature
- Use case and motivation
- Proposed implementation
- Alternatives considered

## Security Vulnerabilities

Do not open public issues for security vulnerabilities. See SECURITY.md for reporting process.

## Questions

For questions:

- Check existing documentation
- Search GitHub Issues
- Ask on Discord
- Email support@AgentChain.io

## License

By contributing, you agree that your contributions will be licensed under the MIT License.