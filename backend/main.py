from flask import Flask
from threading import Thread

from app.routes.ph import ph_bp
from app.routes.turbidity import turbidity_bp
from app.routes.temperature import temperature_bp
from app.services.data_ingestion import read_ph_from_serial

def create_app():
    app = Flask(__name__)

    # Register routes
    app.register_blueprint(ph_bp, url_prefix="/api")
    app.register_blueprint(turbidity_bp, url_prefix="/api")
    app.register_blueprint(temperature_bp, url_prefix="/api")

    return app


app = create_app()

# Start Serial listener in background
serial_thread = Thread(target=read_ph_from_serial, daemon=True)
serial_thread.start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
