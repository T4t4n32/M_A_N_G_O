# Patch Application Notes

## Context

This patch is consistent with the current file tree:

- `Dockerfile`, `requirements`, `wsgi`, `entrypoint`, `db_init` live in `backend/`
- `compose.yaml` and `compose.rx.yaml` live at the repo root
- `nginx/default.conf` lives in `nginx/`
- `mango` (hub script) lives at the repo root

## Apply Steps

1. Copy these files to the repo root (replacing existing):
   - `compose.yaml`
   - `compose.rx.yaml`
   - `mango`
   - `nginx/default.conf`

2. Make the hub script executable:
   ```bash
   chmod +x ./mango
   ```

3. Create the environment file if it does not exist:
   ```bash
   cp .env.example .env
   ```

4. Start the stack:
   ```bash
   ./mango up
   ```

5. Enable dummy data:
   ```bash
   ./mango dummy-on
   ```

6. Run the health check:
   ```bash
   ./mango doctor
   ```

## Serving the Lovable UI

In `.env`, set the build output path:

```
UI_DIR=./lovable_ui/MANGO_PAGE_LOVABLE_V1.3/dist
```

Ensure `dist/index.html` exists by running `npm run build` inside the Lovable UI folder first.

## Verify URLs

| Service | URL |
| ------- | --- |
| UI      | http://localhost:8080/ |
| API     | http://localhost:8000/api/v1/health |
| Data    | http://localhost:8080/api/v1/latest/by_type |
