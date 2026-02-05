import os
from app import create_app

# WSGI entrypoint (Gunicorn/Production)
app = create_app()

# Opcional: permite ejecutar "python wsgi.py" para test rápido
if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "5000"))
    app.run(host=host, port=port, debug=False)
