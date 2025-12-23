@echo off
echo Setting environment variables for AWS Secrets Manager test...
echo WARNING: This file should NOT contain real secrets!
echo Set these environment variables in your system or use .env file instead.
echo.
set NODE_ENV=production
set AWS_REGION=us-east-1
REM TODO: Set AWS_ACCESS_KEY_ID from environment variable or .env file
REM set AWS_ACCESS_KEY_ID=your-access-key-here
REM TODO: Set AWS_SECRET_ACCESS_KEY from environment variable or .env file
REM set AWS_SECRET_ACCESS_KEY=your-secret-key-here
REM TODO: Set DB_SECRET_NAME from environment variable or .env file
REM set DB_SECRET_NAME=your-db-secret-name

echo.
echo Running AWS Secrets Manager test...
if not exist test-secrets-manager.js (
    echo ERROR: test-secrets-manager.js not found!
    pause
    exit /b 1
)
node test-secrets-manager.js

pause
