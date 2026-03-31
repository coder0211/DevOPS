# =============================================================================
# DevOPS VPS Manager — Makefile
# Usage: make <target>
# =============================================================================

.PHONY: up down build logs restart clean dev-backend dev-frontend help

# Default target — start everything with one command
.DEFAULT_GOAL := up

# =============================================================================
# DOCKER COMMANDS
# =============================================================================

## up: Build images (if needed) and start all services in the background
up:
	@echo "🚀 Starting DevOPS VPS Manager..."
	docker compose up --build -d
	@echo ""
	@echo "✅ App is running at http://localhost:3000"
	@echo "   API available at http://localhost:3000/api"
	@echo ""
	@echo "Run 'make logs' to view logs."

## down: Stop and remove all containers
down:
	@echo "🛑 Stopping DevOPS VPS Manager..."
	docker compose down

## build: Force rebuild all Docker images
build:
	@echo "🔨 Rebuilding images..."
	docker compose build --no-cache

## logs: Tail logs from all services
logs:
	docker compose logs -f

## logs-backend: Tail logs from backend only
logs-backend:
	docker compose logs -f backend

## logs-frontend: Tail logs from frontend only
logs-frontend:
	docker compose logs -f frontend

## restart: Restart all services
restart:
	@echo "🔄 Restarting services..."
	docker compose restart

## status: Show running containers and their status
status:
	docker compose ps

## clean: Stop containers, remove volumes and images (full reset)
clean:
	@echo "🧹 Cleaning up all containers, volumes and images..."
	docker compose down --volumes --rmi local
	@echo "Done."

# =============================================================================
# LOCAL DEV COMMANDS (without Docker)
# =============================================================================

## dev-backend: Run the Go backend locally
dev-backend:
	@echo "▶️  Starting Go backend on :8080..."
	cd backend && go run main.go

## dev-frontend: Run the Vite dev server locally
dev-frontend:
	@echo "▶️  Starting Vite dev server on :5173..."
	cd frontend && npm run dev

# =============================================================================
# HELP
# =============================================================================

## help: Show this help message
help:
	@echo ""
	@echo "DevOPS VPS Manager — Available Commands:"
	@echo ""
	@grep -E '^## ' Makefile | sed 's/## /  make /' | column -t -s ':'
	@echo ""
