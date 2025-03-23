# SSH Tunneling Setup Guide

## Overview

This document explains how to set up the SSH tunneling server for Ocean's deployment system. The SSH tunneling service replaces ngrok with a simpler, more controlled solution tailored to our needs.

## Server Requirements

1. A publicly accessible server with a static IP address
2. SSH server installed and configured
3. A domain name pointing to the server (e.g., `tunnel.example.com`)
4. Proper firewall configuration to allow SSH connections

## Setup Instructions

### 1. Create a dedicated user for tunneling

```bash
sudo useradd -m -s /bin/bash tunneluser
sudo passwd tunneluser  # Set a strong password
```

### 2. Configure SSH server

Edit `/etc/ssh/sshd_config` to allow remote port forwarding:

```
GatewayPorts yes
AllowTcpForwarding yes
```

Restart SSH service:

```bash
sudo systemctl restart sshd
```

### 3. Set up SSH keys

On your Ocean backend server:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copy the public key to the tunnel server
ssh-copy-id -i ~/.ssh/id_rsa.pub tunneluser@tunnel.example.com
```

### 4. Configure DNS

Set up wildcard DNS records to point to your tunnel server:

```
*.tunnel.example.com.  IN  A  <your-server-ip>
```

### 5. Configure Nginx as a reverse proxy (optional but recommended)

Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

Create a wildcard configuration in `/etc/nginx/sites-available/tunnel`:

```nginx
server {
    listen 80;
    server_name *.tunnel.example.com;

    location / {
        proxy_pass http://localhost:$remote_port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/tunnel /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### 6. Set up SSL with Let's Encrypt (recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d "*.tunnel.example.com"
```

## Environment Configuration

In your Ocean backend `.env` file, set the following variables:

```
SSH_TUNNEL_HOST=tunnel.example.com
SSH_TUNNEL_BASE_PORT=10000
```

## Testing

To test if the tunneling service is working correctly:

1. Start a simple web server on your local machine: `python -m http.server 8000`
2. Run the SSH tunnel script: `./scripts/setup-ssh-tunnel.sh 123 8000 10123 tunnel.example.com "my-project"`
3. Access the site at `https://my-project.tunnel.example.com`

## Troubleshooting

- Check SSH server logs: `sudo journalctl -u sshd`
- Verify firewall settings: `sudo ufw status`
- Test SSH connection: `ssh -v tunneluser@tunnel.example.com`
- Check if the tunnel is active: `ps aux | grep ssh`