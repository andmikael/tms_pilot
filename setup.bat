@echo off
setlocal

:: Step 1: Check that Node.js is installed
echo Step 1: Checking if Node.js is installed...
where node >nul 2>nul
if %errorlevel% NEQ 0 (
    echo Node.js is not installed.
    echo Please install Node.js manually from https://nodejs.org/en/download/ and re-run setup.bat script.
    echo.
    pause ;;
    exit /b 0
) else (
    echo Node.js is already installed. No action needed.
)

:: Step 2: Setup .env file
echo.
echo Step 2: Checking if .env file has been set up...
if exist .env (
    echo .env file already exists.
) else (
    echo .env file not found. Creating it now...
    echo GOOGLE_API_KEY='' > .env
    echo .env file has been created.
    echo Please open the .env file with notepad and fill in your Google API key inside the quotation marks ''. Re-run this script afterwards.
    echo.
    pause ;;
    exit /b 0
)

echo setup.bat complete. Please run "start.bat" to start the application.
echo Press any key to exit...
pause >nul
exit /b 0