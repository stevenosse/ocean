# Managed Databases

Ocean provides a built-in PostgreSQL database management system that allows you to create, manage, backup, and restore databases for your projects.

## Features

- Create PostgreSQL databases with auto-generated secure credentials
- View connection strings for easy application integration
- Create and manage database backups
- Restore databases from backups
- Automatic database cleanup when projects are deleted

## Requirements

To use the managed database feature, you need to have PostgreSQL installed on your system. The following PostgreSQL commands must be available in your PATH:

- `createdb`: For creating new databases
- `dropdb`: For deleting databases
- `psql`: For executing SQL commands
- `pg_dump`: For creating database backups

## Creating a Database

1. Navigate to your project's page
2. Click on the "Databases" tab
3. Click "Create Database"
4. Enter a name for your database (lowercase letters, numbers, and underscores only)
5. Click "Create"

Once created, you'll see your database listed with its connection details.

## Using the Database in Your Application

To connect your application to the managed database:

1. Navigate to your database's details page
2. Click "View Connection String" to get the full PostgreSQL connection URL
3. Add this connection string to your application's environment variables

Example connection string format:
```
postgresql://username:password@localhost:5432/database_name
```

## Managing Backups

### Creating a Backup

1. Navigate to your database's details page
2. Click "Create Backup"
3. Wait for the backup process to complete

### Restoring from a Backup

1. Navigate to your database's details page
2. Find the backup you want to restore from the list
3. Click "Restore" next to the backup
4. Confirm the restoration

**Warning**: Restoring a database will overwrite all current data in the database.

### Deleting a Backup

1. Navigate to your database's details page
2. Find the backup you want to delete
3. Click "Delete" next to the backup
4. Confirm the deletion

## Security Considerations

- Database credentials are automatically generated and stored securely
- Connections are limited to localhost by default
- Backups are stored in a configurable directory (defaults to `/var/backups/ocean` if not specified)
- Each database has its own dedicated PostgreSQL user with limited permissions

## Troubleshooting

### PostgreSQL Commands Not Found

If you receive an error about PostgreSQL commands not being found, ensure that PostgreSQL is installed and that the bin directory is in your PATH.

On macOS (using Homebrew):
```bash
brew install postgresql
echo 'export PATH="/usr/local/opt/postgresql/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Backup Creation Fails

If backup creation fails, check:
1. The database is running and accessible
2. The backup directory (`/var/backups/ocean`) exists and is writable
3. There is sufficient disk space available

To create the backup directory with proper permissions, run:

```bash
sudo mkdir -p /var/backups/ocean
sudo chmod 777 /var/backups/ocean
```

If you see a permission error related to the backup directory, it means the application doesn't have permission to create or write to the directory. You can either:

1. Run the commands above to fix permissions on the default directory, or
2. Set the `DATABASE_BACKUP_DIR` environment variable to a directory where your application has write permissions without requiring sudo.

### Connection Issues

If your application cannot connect to the database, verify:
1. The database is running
2. You're using the correct connection string
3. Your application is running on the same machine as Ocean (for localhost connections)