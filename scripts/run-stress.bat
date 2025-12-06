@echo off
setlocal enabledelayedexpansion

REM ============================================
REM VALIDATE PARAMETER
REM ============================================
if "%~1"=="" (
    echo ERROR: Test file must be specified. Example:
    echo scripts\run-stress.bat GETcampaigns.js
    pause
    exit /b 1
)

REM ============================================
REM OBTAIN TEST NAME WITHOUT EXTENSION
REM ============================================
set TESTFILE=%~1
set TESTNAME=%~n1

REM ============================================
REM FORMAT TIME AND DATE
REM Format: YYYY-MM-DD_HHMMSS
REM ============================================
for /f "tokens=2-4 delims=/ " %%a in ("%date%") do (
    set YYYY=%%c
    set MM=%%a
    set DD=%%b
)

set HH=%time:~0,2%
set MN=%time:~3,2%
set SS=%time:~6,2%

REM Remove spaces on HH (Windows assigns spaces on hour smaller than 10)
if "%HH:~0,1%"==" " set HH=0%HH:~1,1%

set TIMESTAMP=%YYYY%-%MM%-%DD%_%HH%%MN%%SS%

REM ============================================
REM CREATE LOG NAME
REM ============================================
set LOGPATH=src\test\stress\logs\%TESTNAME%-%TIMESTAMP%.json

echo ============================================
echo Executing stress test: %TESTFILE%
echo Log: %LOGPATH%
echo ============================================

REM ============================================
REM EXECUTE TEST WITH K6 AND GENERATE LOG
REM ============================================
k6 run src/test/stress/%TESTFILE% --out json=%LOGPATH%

echo ============================================
echo Test finished. Log generated in:
echo %LOGPATH%
echo ============================================

pause
