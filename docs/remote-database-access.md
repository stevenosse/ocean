# Remote Database Access Guide

This guide explains how to configure PostgreSQL to accept remote connections and how to set up secure SSH tunnels for database access.

## Overview

By default, PostgreSQL is configured to only accept connections from localhost. This guide provides two methods for enabling remote database access:

1. **Direct Remote Access**: Configure PostgreSQL to accept connections from remote hosts
2. **SSH Tunneling**: Use SSH tunnels to securely forward database connections

## Method 1: Direct Remote Access

### Prerequisites

- PostgreSQL installed and running
- Administrative access to the server (sudo privileges)
- Basic knowledge of PostgreSQL configuration

### Step 1: Configure PostgreSQL

Run the provided script to configure PostgreSQL to accept remote connections:

```bash
sudo ./scripts/configure-postgres-remote.sh
```

This script will:

1. Find your PostgreSQL configuration directory
2. Modify `postgresql.conf` to listen on all interfaces
3. Update `pg_hba.conf` to allow remote connections
4. Configure your firewall to allow connections on port 5432
5. Restart PostgreSQL (if possible)

### Step 2: Update Database Service

Run the script to update the database service to use your public IP address:

```bash
./scripts/update-database-service.sh
```

This script will:

1. Detect your public IP address
2. Update the database service to use this IP instead of localhost

### Security Considerations

- Ensure all database users have strong passwords
- Consider using SSL for encrypted connections
- Limit access to specific IP addresses if possible
- Regularly audit database access logs

## Method 2: SSH Tunneling (Recommended)

SSH tunneling provides a more secure method for remote database access by encrypting all traffic through an SSH connection.

### Prerequisites

- SSH access to the server
- SSH tunneling server configured (see `/docs/ssh-tunneling-setup.md`)
- SSH key pair for authentication

### Step 1: Set Up SSH Tunnel

To create an SSH tunnel for a specific database:

```bash
./scripts/setup-db-tunnel.sh <database_id>
```

This script will:

1. Fetch database connection information
2. Create a secure SSH tunnel to the remote host
3. Output a connection string for remote access

### Step 2: Connect to Database Through Tunnel

Use the connection string provided by the script to connect to your database through the SSH tunnel.

### Step 3: Stop the Tunnel When Done

When you no longer need the tunnel:

```bash
./scripts/stop-db-tunnel.sh <database_id>
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure PostgreSQL is running and listening on all interfaces
2. **Authentication failed**: Verify username and password
3. **Firewall blocking**: Check firewall settings
4. **SSH tunnel not working**: Verify SSH key permissions and server configuration

### Logs

Check PostgreSQL logs for connection issues:

- Linux: `/var/log/postgresql/postgresql-*.log`
- macOS: `/usr/local/var/log/postgres.log` or `/opt/homebrew/var/log/postgres.log`

## Additional Resources

- [PostgreSQL Documentation on Connection Configuration](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [PostgreSQL Client Authentication](https://www.postgresql.org/docs/current/client-authentication.html)
- [SSH Tunneling Guide](https://www.postgresql.org/docs/current/ssh-tunnels.html)