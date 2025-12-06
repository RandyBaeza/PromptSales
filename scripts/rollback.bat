@echo off
echo Rolling back the last migration...
call npm run typeorm migration:revert
pause
