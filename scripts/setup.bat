@echo off
echo ================================
echo   Initializing local environment
echo ================================

echo Installing NPM dependencies...
call npm install

echo Verifying .env file...
IF NOT EXIST .env (
    echo Copying .env.example to .env
    copy .env.example .env
)

echo Starting Docker Services (PostgreSQL, Redis, S3)...
docker compose up -d

echo Initializing NestJS on development mode...
call npm run start:dev

echo Environment is ready!
pause
