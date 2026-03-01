Backend patch — Lovable compatibility (no frontend changes needed)

Why this patch:
Lovable UI expects:
- /api/v1/auth/status, /api/v1/auth/login, /api/v1/auth/logout
- /api/v1/health returning {status, timestamp}
- /api/v1/metrics returning {available:[ph,temperature,turbidity]}
- /api/v1/latest/by_type returning top-level keys: ph, temperature, turbidity
- /api/v1/range accepting type=temperature and returning {type,count,series}

This patch ADDS those endpoints while staying backward-compatible:
- It also includes a 'latest' wrapper with raw types if your old dashboard uses it.

Install steps:
1) Copy files into your repo:
   - backend/app/routes/lovable_auth.py
   - backend/app/routes/lovable_compat.py

2) Register blueprints in your Flask app:
   - If you have backend/app/__init__.py with create_app():
       from .routes.lovable_auth import auth_bp
       from .routes.lovable_compat import compat_bp
       app.register_blueprint(auth_bp)
       app.register_blueprint(compat_bp)

   - If you use backend/app/routes/__init__.py to collect BPs, import them there and register.

3) Ensure Flask sessions work:
   - SECRET_KEY must be set (you already have it)
   - In docker/compose env, set:
       ADMIN_EMAIL=you@example.com
       ADMIN_PASSWORD_HASH=<hash>  (recommended)
     or (dev only):
       ADMIN_PASSWORD=plainpass

   Generate hash:
   python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('YOUR_PASSWORD'))"

4) Rebuild:
   docker compose up -d --build

Test:
- curl -i http://localhost:8080/api/v1/health
- curl -i http://localhost:8080/api/v1/auth/status
- curl -i http://localhost:8080/api/v1/metrics
- curl -i http://localhost:8080/api/v1/latest/by_type
- curl -i "http://localhost:8080/api/v1/range?type=temperature&minutes=60"

Notes:
- If your models module path is different, update the import in lovable_compat.py:
    from app.models import SensorReading
