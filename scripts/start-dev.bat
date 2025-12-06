@echo off
echo Initializing development environment...

docker compose up -d
call npm run start:dev

pause
