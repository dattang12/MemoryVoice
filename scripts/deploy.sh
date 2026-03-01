#!/usr/bin/env bash
# ============================================================
# MemoryVoice — Production Deployment Script
# ============================================================
# Deploys frontend to Firebase Hosting.
#
# Backend deploy: upload to AMD Developer Cloud via their
# dashboard at https://devcloud.amd.com or use their CLI.
# For demo day fallback: flask run --host=0.0.0.0 --port=5000
#
# Usage (from project root):
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
# ============================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DIST_DIR="$FRONTEND_DIR/dist"

FIREBASE_PROJECT="memorybridge-h4h-2026"
HOSTING_URL="https://$FIREBASE_PROJECT.web.app"

echo "============================================================"
echo " MemoryVoice Deployment"
echo " Target: $HOSTING_URL"
echo "============================================================"
echo ""

# ------------------------------------------------------------
# SECURITY CHECK 1: Ensure .env files are not committed
# ------------------------------------------------------------
echo "Verifying no secrets are committed to git..."

STAGED_ENV=$(git -C "$PROJECT_ROOT" diff --cached --name-only 2>/dev/null | grep -E '\.env$|\.env\.' || true)
if [ -n "$STAGED_ENV" ]; then
    echo ""
    echo "ABORT: Staged .env file(s) detected:"
    echo "  $STAGED_ENV"
    echo "  Run: git restore --staged <file>"
    exit 1
fi

TRACKED_ENV=$(git -C "$PROJECT_ROOT" ls-files 2>/dev/null | grep -E '\.env$|\.env\.' | grep -v '\.env\.example' || true)
if [ -n "$TRACKED_ENV" ]; then
    echo ""
    echo "ABORT: .env file(s) are tracked by git:"
    echo "  $TRACKED_ENV"
    echo "  Run: git rm --cached <file>"
    exit 1
fi

echo "  .env check passed."

# ------------------------------------------------------------
# SECURITY CHECK 2: Ensure serviceAccount.json is not in git
# ------------------------------------------------------------
TRACKED_SA=$(git -C "$PROJECT_ROOT" ls-files 2>/dev/null | grep 'serviceAccount.json' || true)
if [ -n "$TRACKED_SA" ]; then
    echo ""
    echo "ABORT: serviceAccount.json is tracked by git!"
    echo "  This file contains Firebase admin credentials."
    echo "  Run: git rm --cached backend/serviceAccount.json"
    echo "  Then add it to .gitignore and re-commit."
    exit 1
fi

echo "  serviceAccount.json check passed."

# ------------------------------------------------------------
# SECURITY CHECK 3: Scan for potential API keys in staged diff
# ------------------------------------------------------------
DIFF_CONTENT=$(git -C "$PROJECT_ROOT" diff --cached 2>/dev/null || true)
if echo "$DIFF_CONTENT" | grep -qE 'AIza[0-9A-Za-z_-]{35}|sk_[a-zA-Z0-9]{40,}'; then
    echo ""
    echo "WARNING: Potential API key pattern found in staged changes."
    echo "  Review your diff carefully before proceeding:"
    echo "    git diff --cached"
    echo ""
    read -r -p "Continue anyway? (type YES to confirm): " CONFIRM
    if [ "$CONFIRM" != "YES" ]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo ""
echo "Security checks passed."
echo ""

# ------------------------------------------------------------
# Check prerequisites
# ------------------------------------------------------------
if ! command -v firebase &> /dev/null; then
    echo "ERROR: Firebase CLI not found."
    echo "  Install with: npm install -g firebase-tools"
    echo "  Then login:   firebase login"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found. Install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check frontend dependencies
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd "$FRONTEND_DIR" && npm install)
fi

# ------------------------------------------------------------
# Build frontend
# ------------------------------------------------------------
echo "Building frontend for production..."
echo "  Running: npm run build"
echo ""
(cd "$FRONTEND_DIR" && npm run build)

if [ ! -d "$DIST_DIR" ]; then
    echo "ERROR: Build failed — dist/ directory not created."
    exit 1
fi

echo ""
echo "Frontend build complete: $DIST_DIR"

# ------------------------------------------------------------
# Deploy to Firebase Hosting
# ------------------------------------------------------------
echo ""
echo "Deploying to Firebase Hosting..."
echo "  Project: $FIREBASE_PROJECT"
echo ""

firebase deploy --only hosting --project "$FIREBASE_PROJECT"

# ------------------------------------------------------------
# Success
# ------------------------------------------------------------
echo ""
echo "============================================================"
echo " Deployment complete!"
echo ""
echo "  Frontend URL:  $HOSTING_URL"
echo "  Alternate URL: https://$FIREBASE_PROJECT.firebaseapp.com"
echo ""
echo "  Verify the deployment from an incognito window before"
echo "  submitting your Devpost URL."
echo ""
echo "  Backend deploy:"
echo "  - AMD Developer Cloud: https://devcloud.amd.com"
echo "    Upload backend/ directory via their dashboard or CLI."
echo "  - Local fallback for demo day:"
echo "    cd backend && flask run --host=0.0.0.0 --port=5000"
echo "============================================================"
