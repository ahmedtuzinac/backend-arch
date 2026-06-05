#!/usr/bin/env bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}🔧 Backend Arch — New Project Setup${NC}\n"

# --- Project name ---
read -p "Project name (kebab-case, e.g. my-app): " PROJECT_NAME
if [ -z "$PROJECT_NAME" ]; then
    echo -e "${RED}Project name is required.${NC}"
    exit 1
fi

read -p "Description: " PROJECT_DESC
if [ -z "$PROJECT_DESC" ]; then
    PROJECT_DESC="$PROJECT_NAME backend"
fi

# --- Service selection ---
echo ""
echo -e "${BLUE}Which starter services do you want to keep?${NC}"

read -p "Auth service (OAuth2 + JWT)? [Y/n]: " KEEP_AUTH
KEEP_AUTH=${KEEP_AUTH:-Y}

read -p "WebSocket service? [Y/n]: " KEEP_WS
KEEP_WS=${KEEP_WS:-Y}

# --- Confirm ---
echo ""
echo -e "${BOLD}Summary:${NC}"
echo "  Project:   $PROJECT_NAME"
echo "  Desc:      $PROJECT_DESC"
echo "  Auth:      $KEEP_AUTH"
echo "  WebSocket: $KEEP_WS"
echo ""
read -p "Proceed? [Y/n]: " CONFIRM
CONFIRM=${CONFIRM:-Y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""

# --- Update project name in files ---
echo -e "${GREEN}Updating project name...${NC}"

# Root pyproject.toml
sed -i '' "s/name = \"backend-arch\"/name = \"$PROJECT_NAME\"/" pyproject.toml
sed -i '' "s/description = \"Backend microservice architecture template\"/description = \"$PROJECT_DESC\"/" pyproject.toml

# README
sed -i '' "s/# Backend Architecture Template/# $PROJECT_NAME/" README.md
sed -i '' "s/Production-ready microservice backend template.*/$PROJECT_DESC/" README.md

# --- Remove unwanted services ---
if [[ ! "$KEEP_AUTH" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Removing auth service...${NC}"
    rm -rf services/auth

    # Remove from podman-compose
    sed -i '' '/^  auth:/,/^  [a-z]/{ /^  auth:/d; /^    /d; }' podman-compose.yml
    sed -i '' '/auth_db/d' infra/postgres/init.sql

    # Remove from Makefile
    sed -i '' '/test-auth/d' Makefile
    sed -i '' '/services\/auth/d' Makefile

    # Remove from nginx
    sed -i '' '/upstream auth_service/,/^}/d' infra/nginx/nginx.conf
    sed -i '' '/location \/auth/,/^    }/d' infra/nginx/nginx.conf

    # Remove from CI
    sed -i '' 's/\[auth, websocket\]/[websocket]/' .github/workflows/ci.yml
    sed -i '' 's/\[auth, websocket\]/[websocket]/' .github/workflows/build-push.yml
fi

if [[ ! "$KEEP_WS" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Removing websocket service...${NC}"
    rm -rf services/websocket

    # Remove from podman-compose
    sed -i '' '/^  websocket:/,/^  [a-z]/{ /^  websocket:/d; /^    /d; }' podman-compose.yml
    sed -i '' '/websocket_db/d' infra/postgres/init.sql

    # Remove from Makefile
    sed -i '' '/test-ws/d' Makefile
    sed -i '' '/services\/websocket/d' Makefile

    # Remove from nginx
    sed -i '' '/upstream websocket_service/,/^}/d' infra/nginx/nginx.conf
    sed -i '' '/location \/ws/,/^    }/d' infra/nginx/nginx.conf

    # Remove from CI
    sed -i '' 's/\[auth, websocket\]/[auth]/' .github/workflows/ci.yml
    sed -i '' 's/\[auth, websocket\]/[auth]/' .github/workflows/build-push.yml
fi

# --- Generate .env files ---
echo -e "${GREEN}Generating .env files from examples...${NC}"

for service_dir in services/*/; do
    if [ -f "$service_dir/.env.example" ]; then
        cp "$service_dir/.env.example" "$service_dir/.env"
        echo "  Created $service_dir.env"
    fi
done

# --- Clean up init files ---
echo -e "${GREEN}Cleaning up template files...${NC}"
rm -rf docs/superpowers/
rm -f scripts/init-project.sh

# Remove init-project target from Makefile if present
sed -i '' '/init-project/d' Makefile

# --- Done ---
echo ""
echo -e "${BOLD}${GREEN}✅ Project '$PROJECT_NAME' initialized!${NC}"
echo ""
echo -e "Next steps:"
echo "  1. Review and update .env files in services/*/"
echo "  2. Create new services:  make new-service name=<name>"
echo "  3. Start everything:     make up"
echo ""
