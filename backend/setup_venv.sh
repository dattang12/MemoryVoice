#!/usr/bin/env bash
# ============================================================
# MemoryVoice Backend — Virtual Environment Setup (Unix/Mac)
# ============================================================
# Usage:
#   chmod +x setup_venv.sh
#   ./setup_venv.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
REQUIREMENTS="$SCRIPT_DIR/requirements.txt"

echo "============================================================"
echo " MemoryVoice Backend Setup"
echo "============================================================"

# ------------------------------------------------------------
# 1. Check Python version
# ------------------------------------------------------------
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found. Install Python 3.11+ from https://python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
REQUIRED_MAJOR=3
REQUIRED_MINOR=11

ACTUAL_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
ACTUAL_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$ACTUAL_MAJOR" -lt "$REQUIRED_MAJOR" ] || \
   ([ "$ACTUAL_MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$ACTUAL_MINOR" -lt "$REQUIRED_MINOR" ]); then
    echo "ERROR: Python $REQUIRED_MAJOR.$REQUIRED_MINOR+ required. Found: $PYTHON_VERSION"
    exit 1
fi

echo "Python version: $PYTHON_VERSION  (OK)"

# ------------------------------------------------------------
# 2. Create virtual environment
# ------------------------------------------------------------
if [ -d "$VENV_DIR" ]; then
    echo "Virtual environment already exists at: $VENV_DIR"
    echo "To recreate it, run: rm -rf .venv && ./setup_venv.sh"
else
    echo "Creating virtual environment at: $VENV_DIR"
    python3 -m venv "$VENV_DIR"
    echo "Virtual environment created."
fi

# ------------------------------------------------------------
# 3. Activate and upgrade pip
# ------------------------------------------------------------
echo "Activating virtual environment..."
# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"

echo "Upgrading pip..."
pip install --upgrade pip --quiet

# ------------------------------------------------------------
# 4. Install dependencies
# ------------------------------------------------------------
if [ ! -f "$REQUIREMENTS" ]; then
    echo "ERROR: requirements.txt not found at $REQUIREMENTS"
    exit 1
fi

echo "Installing dependencies from requirements.txt..."
pip install -r "$REQUIREMENTS"

# ------------------------------------------------------------
# 5. Verify .env exists
# ------------------------------------------------------------
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo ""
    echo "WARNING: backend/.env not found."
    echo "  Copy the example file and fill in your values:"
    echo "  cp backend/.env.example backend/.env"
fi

# ------------------------------------------------------------
# 6. Verify serviceAccount.json exists
# ------------------------------------------------------------
if [ ! -f "$SCRIPT_DIR/serviceAccount.json" ]; then
    echo ""
    echo "WARNING: backend/serviceAccount.json not found."
    echo "  Download from: Firebase Console → Project Settings → Service Accounts"
    echo "  → Generate new private key → save as backend/serviceAccount.json"
fi

echo ""
echo "============================================================"
echo " Backend ready!"
echo ""
echo " To activate the venv in your current shell:"
echo "   source backend/.venv/bin/activate"
echo ""
echo " To start the Flask server:"
echo "   cd backend && flask run --host=0.0.0.0 --port=5000"
echo "============================================================"
