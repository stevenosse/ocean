# Deployment Guide

This guide provides step-by-step instructions to deploy a project with a NestJS backend (using Prisma) and a frontend on macOS. The deployment script will:

- Install required tools (`git`, `Docker`) using Homebrew.
- Set up SSH tunneling to expose your local services.
- Configure the backend and frontend with appropriate tunnel URLs.
- Run both the backend and frontend, ensuring they can communicate.

## Prerequisites

Before running the deployment script, ensure you have the following:

1. **macOS System**: This guide is written for macOS. The script may need adjustments for other operating systems.
2. **Node.js and npm**: Required for both the backend and frontend. You can install Node.js via Homebrew if it's not already installed:
   ```bash
   brew install node
   ```
   Verify the installation:
   ```bash
   node --version
   npm --version
   ```
3. **SSH Access**: You'll need SSH access to our tunneling server. Contact your system administrator for credentials and the server domain (e.g., `tunnel.example.com`).
4. **Project Structure**: Your project should have the following structure:
   ```
   .
   ├── backend/
   │   ├── scripts/
   │   └── package.json
   ├── frontend/
   │   └── package.json
   ├── .gitignore
   └── README.md
   ```
5. **Docker Desktop**: The script installs Docker Desktop, but you'll need to manually start it the first time and accept the terms of service.

## Deployment Steps

### 1. Make the script executable

Run the following command to make the script executable:

```bash
chmod +x deploy.sh
```

### 2. Configure SSH tunnel

The SSH tunnel setup is handled by scripts in the `backend/scripts/` directory. Before running the deployment, ensure your SSH key is added to the tunnel server:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096

# Copy your SSH key to the tunnel server
ssh-copy-id tunneluser@tunnel.example.com
```

### 3. Run the deployment script

Execute the script to deploy your project:

```bash
./deploy.sh
```

The script will:
- Install Homebrew (if not present).
- Install `git` and Docker Desktop (if not present).
- Start Docker Desktop (you may need to manually interact with the GUI the first time).
- Install dependencies for the backend and frontend.
- Grant execute permissions to scripts in `backend/scripts/`.
- Build and run the backend on port `3000`.
- Set up SSH tunnel for the backend using a unique subdomain.
- Update `frontend/.env` with the backend's tunnel URL (`API_URL`).
- Run the frontend on port `3001` and expose it via SSH tunnel.

### 4. Access the frontend

Once the script completes, it will display the URLs for both the frontend and backend services. Open the frontend URL in your browser to access the application.

## Troubleshooting

### Docker Desktop not starting
- If Docker Desktop doesn't start automatically, manually open it from `/Applications/Docker.app`. Ensure it's running by checking:
  ```bash
  docker info
  ```
- You may need to accept the terms of service and grant permissions the first time.

### SSH tunnel issues
- If the tunnel fails to establish, check the following:
  - Verify your SSH key is properly added to the tunnel server
  - Check the tunnel server status with your administrator
  - Review logs in `ssh_tunnel.log` for specific error messages
  - Ensure the required ports are not already in use locally

### Frontend not reaching backend
- Verify that `frontend/.env` contains the correct `API_URL` (the backend's tunnel URL).
- Use your browser's developer tools (Network tab) to confirm that the frontend is making requests to the correct backend URL.
- Check that both tunnels are active by running `ps aux | grep ssh`.

### Stopping the tunnels

To stop the SSH tunnels and cleanup:

```bash
./backend/scripts/stop-ssh-tunnel.sh [project_name]
```

## Notes

- **Development vs. Production**: This setup is intended for development and testing. For production, consider deploying to a hosting service (e.g., AWS, Vercel) instead of using SSH tunnels.
- **Tunnel URLs**: The tunnel URLs are based on your project name and remain consistent between deployments, making it easier to share and bookmark URLs.
- **Security**: The SSH tunneling service is maintained by our team and provides a secure way to expose local services. All traffic is encrypted through SSH.
- **Resource Usage**: SSH tunnels are lightweight and consume minimal system resources compared to other tunneling solutions.
