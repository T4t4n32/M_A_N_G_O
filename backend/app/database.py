from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()


def init_db(app):
    """Initialize database and create all tables."""
    db.init_app(app)
    bcrypt.init_app(app)

    with app.app_context():
        db.create_all()
