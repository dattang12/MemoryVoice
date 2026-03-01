@echo off
REM ============================================================
REM MemoryVoice Backend — Virtual Environment Setup (Windows)
REM ============================================================
REM Usage: Double-click setup_venv.bat, or run from cmd/PowerShell:
REM   .\setup_venv.bat
REM ============================================================

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set VENV_DIR=%SCRIPT_DIR%.venv
set REQUIREMENTS=%SCRIPT_DIR%requirements.txt

echo ============================================================
echo  MemoryVoice Backend Setup (Windows)
echo ============================================================

REM ------------------------------------------------------------
REM 1. Check Python version
REM ------------------------------------------------------------
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: python not found.
    echo Install Python 3.11+ from https://python.org
    echo Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo Python version: %PYTHON_VERSION%  (ensure 3.11+)

REM ------------------------------------------------------------
REM 2. Create virtual environment
REM ------------------------------------------------------------
if exist "%VENV_DIR%\" (
    echo Virtual environment already exists at: %VENV_DIR%
    echo To recreate it: rmdir /s /q .venv  then re-run this script.
) else (
    echo Creating virtual environment at: %VENV_DIR%
    python -m venv "%VENV_DIR%"
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created.
)

REM ------------------------------------------------------------
REM 3. Activate and upgrade pip
REM ------------------------------------------------------------
echo Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

echo Upgrading pip...
python -m pip install --upgrade pip --quiet

REM ------------------------------------------------------------
REM 4. Install dependencies
REM ------------------------------------------------------------
if not exist "%REQUIREMENTS%" (
    echo ERROR: requirements.txt not found at %REQUIREMENTS%
    pause
    exit /b 1
)

echo Installing dependencies from requirements.txt...
pip install -r "%REQUIREMENTS%"
if %errorlevel% neq 0 (
    echo ERROR: pip install failed. Check the output above.
    pause
    exit /b 1
)

REM ------------------------------------------------------------
REM 5. Verify .env exists
REM ------------------------------------------------------------
if not exist "%SCRIPT_DIR%.env" (
    echo.
    echo WARNING: backend\.env not found.
    echo   Copy and fill in the example file:
    echo   copy backend\.env.example backend\.env
)

REM ------------------------------------------------------------
REM 6. Verify serviceAccount.json exists
REM ------------------------------------------------------------
if not exist "%SCRIPT_DIR%serviceAccount.json" (
    echo.
    echo WARNING: backend\serviceAccount.json not found.
    echo   Download from: Firebase Console -^> Project Settings -^> Service Accounts
    echo   -^> Generate new private key -^> save as backend\serviceAccount.json
)

echo.
echo ============================================================
echo  Backend ready!
echo.
echo  The virtual environment is now active in this terminal.
echo.
echo  To activate it in a new terminal:
echo    backend\.venv\Scripts\activate.bat
echo.
echo  To start the Flask server:
echo    cd backend
echo    flask run --host=0.0.0.0 --port=5000
echo ============================================================

endlocal
pause
