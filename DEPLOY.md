# Deployment Guide

This guide provides step-by-step instructions to deploy a project with a NestJS backend (using Prisma) and a frontend on macOS. The deployment script will:

- Install required tools (`ngrok`, `git`, `Docker`) using Homebrew.
- Expose the backend on a dynamically generated `ngrok` URL.
- Expose the frontend on a custom `ngrok` domain (`dove-picked-internally.ngrok-free.app`).
- Update the frontend’s `.env` file with the backend’s `ngrok` URL.
- Run both the backend and frontend, ensuring they can communicate.

## Prerequisites

Before running the deployment script, ensure you have the following:

1. **macOS System**: This guide is written for macOS. The script may need adjustments for other operating systems.
2. **Node.js and npm**: Required for both the backend and frontend. You can install Node.js via Homebrew if it’s not already installed:
   ```bash
   brew install node
   ```
   Verify the installation:
   ```bash
   node --version
   npm --version
   ```
3. **ngrok Account and Authtoken**: You’ll need an `ngrok` account to expose your local services. Sign up for a free account at [ngrok.com](https://ngrok.com), and get your authtoken from the dashboard.
4. **Custom `ngrok` Domain for Frontend**: You have a custom `ngrok` domain for the frontend (`dove-picked-internally.ngrok-free.app`). Ensure this domain is configured in your `ngrok` dashboard.
5. **Project Structure**: Your project should have the following structure:
   ```
   .
   ├── backend/
   │   ├── scripts/ (optional)
   │   └── package.json
   ├── frontend/
   │   └── package.json
   ├── .gitignore
   └── README.md
   ```
6. **Docker Desktop**: The script installs Docker Desktop, but you’ll need to manually start it the first time and accept the terms of service.

## Deployment Steps

### 1. Make the script executable

Run the following command to make the script executable:

```bash
chmod +x deploy.sh
```

### 2. Configure `ngrok` authtoken

Set up your `ngrok` authtoken to authenticate your tunnels. Replace `<your-authtoken>` with the authtoken from your `ngrok` dashboard:

```bash
ngrok authtoken <your-authtoken>
```

### 3. Configure CORS in the backend

The frontend will make requests from `https://dove-picked-internally.ngrok-free.app` to the backend’s dynamically generated `ngrok` URL. To allow these cross-origin requests, configure CORS in the NestJS backend.

Edit `backend/src/main.ts` to enable CORS:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow CORS for the frontend's ngrok domain
  app.enableCors({
    origin: 'https://dove-picked-internally.ngrok-free.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
}

bootstrap();
```

Alternatively, for development, you can allow all origins (less secure):

```typescript
app.enableCors();
```

### 4. Run the deployment script

Execute the script to deploy your project:

```bash
./deploy.sh
```

The script will:
- Install Homebrew (if not present).
- Install `ngrok`, `git`, and Docker Desktop (if not present).
- Start Docker Desktop (you may need to manually interact with the GUI the first time).
- Install dependencies for the backend and frontend.
- Grant execute permissions to scripts in `backend/scripts/`.
- Build and run the backend on port `3000`.
- Expose the backend via `ngrok` on a dynamically generated URL (e.g., `https://random-string.ngrok-free.app`).
- Update `frontend/.env` with the backend’s `ngrok` URL (`API_URL`).
- Run the frontend on port `3001` and expose it via `ngrok` on `https://dove-picked-internally.ngrok-free.app`.

### 7. Access the frontend

Once the script completes, open the following URL in your browser:

```
https://dove-picked-internally.ngrok-free.app
```

The frontend should now be able to communicate with the backend using the dynamically generated `ngrok` URL.

## Troubleshooting

### Docker Desktop not starting
- If Docker Desktop doesn’t start automatically, manually open it from `/Applications/Docker.app`. Ensure it’s running by checking:
  ```bash
  docker info
  ```
- You may need to accept the terms of service and grant permissions the first time.

### `ngrok` URL not fetched
- If the script fails to fetch the backend’s `ngrok` URL, check `ngrok_backend.log` for errors. Common issues:
  - Missing `ngrok` authtoken (ensure you ran `ngrok authtoken <your-authtoken>`).
  - Port `4040` in use (the `ngrok` API port). You can change the API port by adding `--inspect-port 4041` to the `ngrok` command and updating the `curl` command.

### `ngrok` Free tier limitations
- The free tier of `ngrok` may limit you to one tunnel at a time. This script uses two tunnels (one for the backend, one for the frontend). If you encounter issues, consider:
  - Upgrading to a paid `ngrok` plan.
  - Testing with a single tunnel by accessing the backend locally (e.g., `http://localhost:3000`) if you’re on the same machine.

### Frontend not reaching backend
- Verify that `frontend/.env` contains the correct `API_URL` (the backend’s `ngrok` URL).
- Use your browser’s developer tools (Network tab) to confirm that the frontend is making requests to the backend’s `ngrok` URL.

## Notes

- **Development vs. Production**: This setup is intended for development and testing. For production, consider deploying to a hosting service (e.g., AWS, Vercel) instead of using `ngrok`.
- **Dynamic Backend URL**: The backend’s `ngrok` URL changes each time you run the script. The script automatically updates the frontend’s `.env` file to reflect this.
- **Stopping the Deployment**: To stop the deployment, press `Ctrl+C` in the terminal. The script will clean up all running processes (backend, frontend, and `ngrok` tunnels).
