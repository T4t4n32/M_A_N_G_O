from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        # CHANGE_BEFORE_PRODUCTION: Set debug=False and use gunicorn/waitress instead.
        debug=True,
    )
