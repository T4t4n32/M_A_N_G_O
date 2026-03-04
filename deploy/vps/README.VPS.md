# VPS deploy bundle (Debian 12) — Host Nginx + Docker backend

This bundle is designed for:
- Docker Compose running: Postgres + Redis + Backend
- Backend exposed ONLY on localhost (127.0.0.1:8000)
- Host Nginx serving the Lovable UI (static) and proxying /api/* to the backend
- HTTPS with Certbot for integramosoe.com + www.integramosoe.com

## 1) Build Lovable UI on your PC
```bash
cd lovable_ui/MANGO_PAGE_LOVABLE_V1.3
npm install
npm run build