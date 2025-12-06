@echo off
echo Running migrations...
call npm run typeorm migration:run
pause
