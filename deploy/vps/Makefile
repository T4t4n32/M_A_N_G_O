# M.A.N.G.O VPS — Docker Compose management
#
# Deploy:
#   make up              Start the full stack (safe re-deploy, removes orphans)
#   make down            Stop and remove containers (keeps volumes)
#   make restart         down + up
#
# Observability:
#   make status          Show running containers and their health
#   make health          Hit the backend health endpoint
#   make logs            Follow all service logs
#   make logs-backend    Follow backend logs only
#   make logs-db         Follow database logs only
#   make routes          List all registered Flask API routes
#   make db-tables       List all tables in the Postgres database
#
# Administration:
#   make admin-cli       Open the admin CLI (users + subscriptions)
#   make users-list      List all users with their active tier
#   make subs-list       List all subscriptions
#
# Maintenance:
#   make backup          Dump Postgres to backups/mango_YYYYMMDD_HHMMSS.sql
#   make restore BACKUP=backups/mango_<ts>.sql   Restore from a dump file
#   make shell-backend   Open a shell inside the backend container
#   make shell-db        Open psql inside the db container
#
# Destructive:
#   make nuke            Remove containers, volumes, and images (wipes all data)
#
# Requires: .env.vps in this directory (copy from .env.vps.example)

COMPOSE  := docker compose
FILE     := -f compose.vps.yml
ENV_FILE := --env-file .env.vps

# Read DB credentials from .env.vps for maintenance targets
include .env.vps
export

# Containers defined in compose.vps.yml — used by nuke to force-remove strays
CONTAINERS := mango_backend mango_db mango_db_init mango_redis
IMAGES     := mango-backend:local

# Frontend source and web root paths
FRONTEND_DIST := ../../frontend/dist
UI_WEBROOT    := /var/www/mango-ui

# Nginx config source and target
NGINX_SRC  := nginx/integramosoe.conf
NGINX_DEST := /etc/nginx/sites-available/integramosoe

.PHONY: up down restart logs logs-backend logs-db status health \
        routes db-tables admin-cli users-list subs-list \
        backup restore shell-backend shell-db nuke deploy-ui \
        setup-uploads migrate-uploads ssl-renew ssl-status deploy-nginx

## Create /var/www/mango-uploads with correct ownership for the bind mount.
## Run once on a fresh VPS before the first 'make up'.
setup-uploads:
	sudo mkdir -p /var/www/mango-uploads/image \
	              /var/www/mango-uploads/video \
	              /var/www/mango-uploads/document
	sudo chown -R root:www-data /var/www/mango-uploads
	sudo chmod -R 775 /var/www/mango-uploads
	@echo "Upload directory ready at /var/www/mango-uploads"

## One-time migration: copy files from the old Docker named volume (mango_uploads)
## to the new bind-mount path (/var/www/mango-uploads).
## Run this ONCE before switching to the bind-mount compose.
migrate-uploads:
	@echo "Migrating uploads from Docker volume vps_mango_uploads → /var/www/mango-uploads ..."
	sudo mkdir -p /var/www/mango-uploads
	docker run --rm \
	  -v vps_mango_uploads:/src:ro \
	  -v /var/www/mango-uploads:/dst \
	  alpine sh -c "cp -a /src/. /dst/ && echo 'Migration complete.'"
	@echo "Verify with: ls -lh /var/www/mango-uploads/"

## Deploy the nginx site config and reload nginx.
## This copies nginx/integramosoe.conf → /etc/nginx/sites-available/integramosoe,
## tests the config, and reloads nginx if the test passes.
deploy-nginx:
	@set -e; \
	 TS=$$(date +%Y%m%d_%H%M%S); \
	 BACKUP=$(NGINX_DEST).bak.$${TS}; \
	 sudo cp $(NGINX_DEST) $${BACKUP} && echo "Backup: $${BACKUP}"; \
	 sudo cp $(NGINX_SRC) $(NGINX_DEST); \
	 if sudo nginx -t 2>&1; then \
	   sudo systemctl reload nginx && echo "Nginx reloaded OK"; \
	 else \
	   echo "Config test FAILED — rolling back to $${BACKUP}"; \
	   sudo cp $${BACKUP} $(NGINX_DEST); \
	   exit 1; \
	 fi

## Copy the built frontend dist to the nginx web root.
## Run 'cd ../../frontend && npm run build' first, then this target.
deploy-ui:
	sudo rsync -a --delete $(FRONTEND_DIST)/ $(UI_WEBROOT)/
	@echo "Frontend deployed to $(UI_WEBROOT)"

## Start the full stack.
## --remove-orphans cleans up any stray container (including a leftover mango_redis)
## before Docker creates the new ones — this is the fix for the "name already in use" conflict.
up:
	$(COMPOSE) $(FILE) $(ENV_FILE) down --remove-orphans
	$(COMPOSE) $(FILE) $(ENV_FILE) up -d --build

## Stop and remove containers; data volumes are preserved.
down:
	$(COMPOSE) $(FILE) $(ENV_FILE) down --remove-orphans

## Full restart (down then up).
restart: down up

## Follow logs for all services. Ctrl-C to exit.
logs:
	$(COMPOSE) $(FILE) $(ENV_FILE) logs -f

## Follow backend container logs. Ctrl-C to exit.
logs-backend:
	docker logs mango_backend --follow --tail 100

## Follow database container logs. Ctrl-C to exit.
logs-db:
	docker logs mango_db --follow --tail 100

## Show container status and health.
status:
	$(COMPOSE) $(FILE) $(ENV_FILE) ps

## Hit the backend /api/v1/health endpoint and pretty-print the result.
health:
	@curl -fsS http://127.0.0.1:$(API_HOST_PORT)/api/v1/health 2>/dev/null \
	  | python3 -m json.tool 2>/dev/null \
	  || echo "ERROR: backend not reachable on port $(API_HOST_PORT)"

## Dump Postgres to a timestamped SQL file under backups/.
backup:
	@mkdir -p backups
	@TS=$$(date +%Y%m%d_%H%M%S); \
	 docker exec mango_db pg_dump -U $(DB_USER) $(DB_NAME) \
	   > backups/mango_$${TS}.sql && \
	 echo "Backup saved: backups/mango_$${TS}.sql"

## Restore Postgres from a dump file.
## Usage: make restore BACKUP=backups/mango_<timestamp>.sql
restore:
	@test -n "$(BACKUP)" || (echo "Usage: make restore BACKUP=<path>"; exit 1)
	@test -f "$(BACKUP)" || (echo "File not found: $(BACKUP)"; exit 1)
	@echo "Restoring $(BACKUP) into $(DB_NAME)..."
	@docker exec -i mango_db psql -U $(DB_USER) -d $(DB_NAME) < $(BACKUP)
	@echo "Restore complete."

## List all registered Flask API routes (method + path).
routes:
	@docker exec mango_backend python3 -c \
	  "from app import create_app; app=create_app(); \
	   rules=sorted(app.url_map.iter_rules(), key=lambda r: r.rule); \
	   [print(f'{str(sorted(r.methods-{\"HEAD\",\"OPTIONS\"})):>20}  {r.rule}') for r in rules]"

## List all Postgres tables in the mango database.
db-tables:
	@docker exec mango_db psql -U $(DB_USER) -d $(DB_NAME) -c \
	  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

## Open the admin CLI inside the backend container (users + subscriptions).
## Usage: make admin-cli
## Then run commands like: python /app/scripts/admin_cli.py users list
admin-cli:
	docker exec -it mango_backend python /app/scripts/admin_cli.py $(ARGS)

## List all registered users with their active tier.
users-list:
	@docker exec mango_backend python /app/scripts/admin_cli.py users list

## List all subscriptions (add ARGS="--active" to filter active only).
subs-list:
	@docker exec mango_backend python /app/scripts/admin_cli.py subs list $(ARGS)

## Open an interactive shell inside the backend container.
shell-backend:
	docker exec -it mango_backend sh

## Open psql inside the database container.
shell-db:
	docker exec -it mango_db psql -U $(DB_USER) -d $(DB_NAME)

## Renew the Let's Encrypt SSL certificate and reload nginx.
## Run when the cert is near expiry or after 'make ssl-status' shows < 30 days remaining.
ssl-renew:
	sudo certbot renew --nginx --cert-name integramosoe.com
	sudo systemctl reload nginx
	@echo "Renewal attempted. Verify with: make ssl-status"

## Show SSL certificate expiry date and days remaining.
ssl-status:
	@DOMAIN=$$(grep -oP '(?<=PUBLIC_BASE_URL=https://)([^/]+)' .env.vps 2>/dev/null || echo "integramosoe.com"); \
	 echo | openssl s_client -connect "$$DOMAIN:443" -servername "$$DOMAIN" 2>/dev/null \
	   | openssl x509 -noout -enddate -subject 2>/dev/null \
	   || echo "Could not connect to $$DOMAIN:443 — check nginx and cert path"

## DESTRUCTIVE: Remove everything — containers, volumes, and local images.
## This wipes all persistent data (Postgres + Redis). Use to start from scratch.
nuke:
	@echo "WARNING: This will delete all containers, volumes, and local images."
	@echo "All database data will be permanently lost."
	@read -r -p "Type YES to continue: " confirm && [ "$$confirm" = "YES" ]
	$(COMPOSE) $(FILE) $(ENV_FILE) down --volumes --remove-orphans
	@for c in $(CONTAINERS); do \
		docker rm -f "$$c" 2>/dev/null && echo "Removed container: $$c" || true; \
	done
	@for img in $(IMAGES); do \
		docker rmi -f "$$img" 2>/dev/null && echo "Removed image: $$img" || true; \
	done
	@echo "Done. Run 'make up' to redeploy from scratch."
