# Contributing to Ocean

Thank you for considering contributing to Ocean! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others when contributing.

## How to Contribute

### Reporting Bugs

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are also tracked as GitHub issues. Provide the following information:

- A clear and descriptive title
- A detailed description of the proposed enhancement
- Explanation of why this enhancement would be useful
- Possible implementation details (if you have any)

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Coding Standards

- Follow the existing code style and conventions
- Write clear, readable, and maintainable code
- Include comments where necessary
- Write tests for new features

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker
- PostgreSQL

### Local Development

1. Clone the repository
2. Install dependencies for both backend and frontend
3. Set up environment variables (see README.md)
4. Run the development servers

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Testing

Run tests to ensure your changes don't break existing functionality:

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if applicable)
cd frontend
npm test
```

## Documentation

If you're adding new features or changing existing ones, please update the documentation accordingly. This includes:

- README.md
- Code comments
- API documentation
- Any other relevant documentation

## License

By contributing to Ocean, you agree that your contributions will be licensed under the project's MIT license.