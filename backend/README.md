## Flujo del Backend

main.py
  ↓
app/__init__.py   → crea Flask()
  ↓
app/api.py        → registra rutas
  ↓
routes/*.py       → endpoints
  ↓
services/*.py     → lógica
  ↓
models/*.py       → datos

Perfecto, vamos **con orden, claridad y sin saltarnos nada**.
Lo que hiciste hasta ahora está **correcto** 👍:

* ✅ Creaste el entorno virtual en `backend/`
* ✅ Instalaste `flask` y `flask-cors`

Ahora te explico **qué sigue**, **qué va en cada archivo**, te doy el **`requirements.txt`**, y **te marco explícitamente qué cosas debes cambiar tú** (con “🔧 CAMBIA ESTO”).

---

# 🧭 DÓNDE ESTAMOS EN EL PROCESO

Ya tenemos:

* A ✅ Frontend (dashboard)
* B ✅ Estructura backend
* B ✅ Entorno virtual creado

👉 **Ahora estamos en B.1: Backend funcional mínimo y entendible**

Antes de conectar frontend ↔ backend, necesitamos:

1. Backend **arrancando correctamente**
2. Archivos con **responsabilidad clara**
3. Tú sabiendo **qué partes son temporales** y **qué debes personalizar**

---

# 1️⃣ `requirements.txt` (OBLIGATORIO)

📍 Ubicación:

```text
backend/requirements.txt
```

📄 **Contenido recomendado ahora mismo**:

```txt
Flask==3.0.0
flask-cors==4.0.0
```

🔧 **CAMBIA ESTO MÁS ADELANTE**:

* Cuando agreguemos base de datos, autenticación segura, etc.
* Por ahora esto es **correcto y mínimo**

📦 Si ya instalaste las librerías, puedes regenerarlo así:

```bash
pip freeze > requirements.txt
```

---

# 2️⃣ Qué va en cada archivo (CLARÍSIMO)

Te explico **archivo por archivo**, según tu estructura actual 👇

---

## 📂 `backend/main.py`

📌 **Solo arranca el servidor**

```python
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",  # 🔧 CAMBIA si despliegas en servidor real
        port=5000,       # 🔧 CAMBIA si el puerto no está disponible
        debug=True       # 🔧 CAMBIA a False en producción
    )
```

🔧 **COSAS QUE DEBES CAMBIAR TÚ**

* `debug=True` → `False` en producción
* `port=5000` si usas otro puerto

📌 **NO CAMBIES**:

* `if __name__ == "__main__":`
  👉 Esto es estándar en Python, **no se renombra**

---

## 📂 `backend/app/__init__.py`

📌 **Crea la app Flask**

```python
from flask import Flask
from flask_cors import CORS
from .config import Config
from .api import register_routes

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)
    CORS(app, supports_credentials=True)

    register_routes(app)

    return app
```

🔧 **CAMBIA ESTO**

```python
app = Flask(__name__)
```

👉 **NO cambies `__name__`**, es correcto así.

🔧 **CAMBIA ESTO EN `config.py`**, no aquí:

* `SECRET_KEY`
* configuración sensible

---

## 📂 `backend/app/config.py`

📌 **Configuración central**

```python
class Config:
    SECRET_KEY = "CHANGE_THIS_SECRET_KEY"  # 🔧 CAMBIA ESTO
```

🔧 **OBLIGATORIO QUE CAMBIES**

* `"CHANGE_THIS_SECRET_KEY"`

  * Usa algo largo y aleatorio
  * Ejemplo:

    ```python
    SECRET_KEY = "mango_super_secret_key_2025"
    ```

---

## 📂 `backend/app/api.py`

📌 **Conecta todas las rutas (blueprints)**

```python
from .routes.auth import auth_bp
from .routes.health import health_bp
from .routes.sensors import sensors_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(sensors_bp)
```

📌 Aquí **NO pones lógica**, solo conectas rutas.

---

## 📂 `backend/app/routes/auth.py`

📌 **Login / Logout**

```python
from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

USERS = {
    "admin": "admin"  # 🔧 TEMPORAL — CAMBIA MÁS ADELANTE
}

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    if USERS.get(data.get("username")) == data.get("password"):
        session["user"] = data["username"]
        return jsonify({"status": "ok"})
    return jsonify({"error": "invalid credentials"}), 401

@auth_bp.route("/logout")
def logout():
    session.clear()
    return jsonify({"status": "logged out"})
```

🔧 **CAMBIA MÁS ADELANTE**

* Usuarios hardcodeados
* Passwords en texto plano

📌 **AHORA ESTÁ BIEN ASÍ**

---

## 📂 `backend/app/routes/health.py`

📌 **Endpoint de prueba (MUY ÚTIL)**

```python
from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__, url_prefix="/api")

@health_bp.route("/health")
def health():
    return jsonify({"status": "ok"})
```

👉 Esto te permite comprobar:

```
http://localhost:5000/api/health
```

---

## 📂 `backend/app/routes/sensors.py`

📌 **Datos del sensor**

```python
from flask import Blueprint, jsonify, session, request
import random

sensors_bp = Blueprint("sensors", __name__, url_prefix="/api")

@sensors_bp.route("/latest")
def latest():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401

    return jsonify({
        "level": round(120 + random.uniform(-1, 1), 2),
        "temperature": round(26 + random.uniform(-0.5, 0.5), 2),
        "salinity": round(32 + random.uniform(-0.3, 0.3), 2)
    })
```

---

# 3️⃣ ¿Qué sigue AHORA MISMO?

### PASO 1 — Verificar backend

Ejecuta:

```bash
cd backend
source venv/bin/activate
python main.py
```

Abre en el navegador:

* ✅ `http://localhost:5000/api/health`

---

### PASO 2 — Probar login (Postman o curl)

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

### PASO 3 — Probar datos protegidos

```bash
http://localhost:5000/api/latest
```

---

# 🧠 RESUMEN CLAVE (GUÁRDALO)

* `venv` → en `backend/`
* `requirements.txt` → mínimo y limpio
* `__name__` → **NO SE CAMBIA**
* `"CHANGE_THIS_*"` → **SÍ SE CAMBIA**
* Usuarios hardcodeados → temporal
* Arquitectura → correcta y profesional

---

"""
M.A.N.G.O. — Backend API (Step B)
Minimal but production-ready Flask backend

Features:
- Authentication (login)
- Protected API endpoints
- Time-series data endpoints
- Server-Sent Events (SSE)

NOTE:
This backend is designed to plug directly into the existing dashboard
without changing the frontend structure.
"""

from flask import Flask, jsonify, request, session, Response
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import time

app = Flask(__name__)
app.secret_key = "CHANGE_THIS_SECRET_KEY"
CORS(app, supports_credentials=True)

# -----------------------------
# Fake user database (TEMP)
# -----------------------------
USERS = {
    "admin": "admin"  # username: password (replace later)
}

# -----------------------------
# Authentication helpers
# -----------------------------

def is_authenticated():
    return session.get("user") is not None

# -----------------------------
# Login endpoint
# -----------------------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if USERS.get(username) == password:
        session["user"] = username
        return jsonify({"status": "ok", "user": username})

    return jsonify({"status": "error", "message": "Invalid credentials"}), 401


@app.route("/api/logout")
def logout():
    session.clear()
    return jsonify({"status": "logged_out"})

# -----------------------------
# Data generators (SIMULATION)
# -----------------------------

def generate_series(base, hours):
    points = hours * 6  # one point every 10 min
    now = datetime.utcnow()
    data = []

    for i in range(points, -1, -1):
        ts = now - timedelta(minutes=i * 10)
        value = base + random.uniform(-2, 2)
        data.append({
            "timestamp": ts.isoformat() + "Z",
            "value": round(value, 2)
        })

    return data

# -----------------------------
# Protected data endpoints
# -----------------------------
@app.route("/api/latest")
def latest():
    if not is_authenticated():
        return jsonify({"error": "unauthorized"}), 401

    return jsonify({
        "level": round(120 + random.uniform(-1, 1), 2),
        "temperature": round(26 + random.uniform(-0.5, 0.5), 2),
        "salinity": round(32 + random.uniform(-0.3, 0.3), 2),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })


@app.route("/api/range/<metric>")
def range_data(metric):
    if not is_authenticated():
        return jsonify({"error": "unauthorized"}), 401

    hours = int(request.args.get("hours", 24))

    base_map = {
        "level": 120,
        "temperature": 26,
        "salinity": 32
    }

    if metric not in base_map:
        return jsonify({"error": "invalid metric"}), 400

    return jsonify(generate_series(base_map[metric], hours))

# -----------------------------
# Server-Sent Events (SSE)
# -----------------------------
@app.route("/api/stream")
def stream():
    if not is_authenticated():
        return jsonify({"error": "unauthorized"}), 401

    def event_stream():
        while True:
            data = {
                "level": round(120 + random.uniform(-1, 1), 2),
                "temperature": round(26 + random.uniform(-0.5, 0.5), 2),
                "salinity": round(32 + random.uniform(-0.3, 0.3), 2),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            yield f"data: {jsonify(data).get_data(as_text=True)}\n\n"
            time.sleep(5)

    return Response(event_stream(), mimetype="text/event-stream")


# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

