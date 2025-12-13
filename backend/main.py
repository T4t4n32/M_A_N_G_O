from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",  # 🔧 CAMBIA si despliegas en servidor real
        port=5000,       # 🔧 CAMBIA si el puerto no está disponible
        debug=True       # 🔧 CAMBIA a False en producción
    )
