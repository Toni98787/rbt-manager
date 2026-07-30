#!/usr/bin/env bash
set -euo pipefail

cd /agent

REPO_NAME="rbt-manager"
VISIBILITY="${1:-private}" # private | public

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login"
  exit 1
fi

USER_LOGIN="$(gh api user -q .login)"
echo "Authenticated as: $USER_LOGIN"

# Prefer main as default branch for the remote repo
git branch -M main 2>/dev/null || true

# Create repo if it does not already exist
if gh repo view "$USER_LOGIN/$REPO_NAME" >/dev/null 2>&1; then
  echo "Repo already exists: https://github.com/$USER_LOGIN/$REPO_NAME"
else
  gh repo create "$REPO_NAME" --"$VISIBILITY" --source=. --remote=origin --description "RBT Manager — iPad POS, inventory, dashboard & shop operations"
fi

# Ensure origin is set
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$USER_LOGIN/$REPO_NAME.git"
fi

git push -u origin main

echo ""
echo "Done: https://github.com/$USER_LOGIN/$REPO_NAME"
