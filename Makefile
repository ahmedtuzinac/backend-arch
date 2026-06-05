.PHONY: up down test test-auth test-ws lint format new-service migrate init-project

up:
	podman-compose up --build

down:
	podman-compose down

test:
	cd services/auth && python -m pytest tests/ -v
	cd services/websocket && python -m pytest tests/ -v

test-auth:
	cd services/auth && python -m pytest tests/ -v

test-ws:
	cd services/websocket && python -m pytest tests/ -v

lint:
	ruff check .

format:
	ruff format .

new-service:
	@if [ -z "$(name)" ]; then echo "Usage: make new-service name=<service_name>"; exit 1; fi
	copier copy service-template services/$(name)

migrate:
	cd services/auth && aerich upgrade
	cd services/websocket && aerich upgrade

init-project:
	@bash scripts/init-project.sh
