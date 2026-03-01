#!/usr/bin/env bash
# ============================================================
# MemoryVoice — Local Development Startup Script
# ============================================================
# Starts both the Flask backend and Vite frontend in parallel.
# Press Ctrl+C to stop both processes.
#
# Usage (from project root):
#   chmod +x scripts/dev.sh
#   ./scripts/dev.sh
# ============================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

BACKEND_PORT=5000
FRONTEND_PORT=5173

# Process IDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""

# ------------------------------------------------------------
# Cleanup — kill both processes on Ctrl+C or script exit
# ------------------------------------------------------------
cleanup() {
    echo ""
    echo "Shutting down MemoryVoice dev servers..."
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID"
        echo "  Backend stopped (PID $BACKEND_PID)"
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID"
        echo "  Frontend stopped (PID $FRONTEND_PID)"
    fi
    echo "Done."
    exit 0
}

trap cleanup INT TERM

# ------------------------------------------------------------
# Pre-flight checks
# ------------------------------------------------------------
echo "============================================================"
echo " MemoryVoice Development Server"
echo "============================================================"

# Check .env files exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "WARNING: backend/.env not found."
    echo "  Run: cp backend/.env.example backend/.env"
    echo "  Then fill in your API keys."
    echo ""
fi

if [ ! -f "$FRONTEND_DIR/.env" ]; then
    echo "WARNING: frontend/.env not found."
    echo "  Run: cp frontend/.env.example frontend/.env"
    echo "  Then fill in your Firebase config."
    echo ""
fi

# Check backend venv
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo "ERROR: backend/.venv not found."
    echo "  Run: ./backend/setup_venv.sh"
    exit 1
fi

# Check frontend node_modules
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "Frontend dependencies not found. Installing..."
    (cd "$FRONTEND_DIR" && npm install)
fi

# ------------------------------------------------------------
# Start Flask backend
# ------------------------------------------------------------
echo ""
echo "Starting Flask backend on http://localhost:$BACKEND_PORT ..."
(
    cd "$BACKEND_DIR"
    # shellcheck disable=SC1091
    source .venv/bin/activate
    export FLASK_APP=run.py
    export FLASK_ENV="${FLASK_ENV:-development}"
    flask run --host=0.0.0.0 --port="$BACKEND_PORT" 2>&1 | \
        sed 's/^/  [backend] /'
) &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Give Flask a moment to start
sleep 2

# ------------------------------------------------------------
# Start Vite frontend
# ------------------------------------------------------------
echo ""
echo "Starting Vite frontend on http://localhost:$FRONTEND_PORT ..."
(
    cd "$FRONTEND_DIR"
    npm run dev -- --host 2>&1 | \
        sed 's/^/  [frontend] /'
) &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# ------------------------------------------------------------
# Print access URLs
# ------------------------------------------------------------
echo ""
echo "============================================================"
echo " MemoryVoice is running!"
echo ""
echo "  Frontend:  http://localhost:$FRONTEND_PORT"
echo "  Backend:   http://localhost:$BACKEND_PORT"
echo "  API docs:  http://localhost:$BACKEND_PORT/api"
echo ""
echo "  Press Ctrl+C to stop all servers."
echo "============================================================"
echo ""

# Wait for both background processes
wait
