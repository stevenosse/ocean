# Ocean - Deployment Automation Tool

Ocean is a deployment automation tool that monitors GitHub repositories and automatically deploys changes to Docker containers. It provides a user-friendly interface for configuring repositories, monitoring deployments, and managing the deployment process.

## Features

- GitHub webhook integration for automatic deployments
- Support for multiple projects and repositories
- Real-time deployment status monitoring
- Configurable deployment settings per project
- Docker container management
- Deployment history and logs
- Environment variables management with automatic redeployment

## Tech Stack

- **Frontend**: Nuxt.js with Tailwind CSS
- **Backend**: NestJS
- **Deployment**: Docker
- **Scripts**: Bash

## Project Structure

```
├── frontend/           # Nuxt.js frontend application
├── backend/            # NestJS backend application
├── scripts/            # Bash scripts for deployment
└── docker/             # Docker configuration files
```

## Getting Started

1. Clone the repository
2. Set up the backend
3. Set up the frontend
4. Configure your projects
5. Start the application

## License

MIT

## Environment Variables

Ocean allows you to manage environment variables for your projects:

1. Navigate to the project details page
2. Click on "Environment Variables"
3. Add, edit, or delete environment variables as needed

Changes to environment variables will automatically trigger a redeployment of your project.

## Docker Deployment

Ocean deploys projects in Docker containers by default. The deployment process:

1. Creates a Dockerfile if one doesn't exist (assumes Node.js projects by default)
2. Builds the Docker image using the project's build commands
3. Runs the container with the appropriate environment variables
4. Exposes the default port (3000 for Node.js projects)

You can customize the deployment by providing:
- `installCommand`: Command to install dependencies (default: `npm install`)
- `buildCommand`: Command to build the project (if needed)
- `startCommand`: Command to start the application (default: `npm start`)

## Running the Application

```bash
# Start the backend
cd backend
npm install
npm run start:dev

# Start the frontend in another terminal
cd frontend
npm install
npm run dev
```

## Database

Ocean uses PostgreSQL for data storage. Make sure to set up your database connection in the backend `.env` file.

- script to launch the app (backend and frontend) and expose via ngrok (domain: dove-picked-internally.ngrok-free.app)
- use ngrok to make deployments accessible
- manage database (only postgres will be supported)