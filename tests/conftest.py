"""Shared fixtures for the backend test suite.

The backend package lives in ../backend, so it is added to sys.path here.
Configuration is read from the environment at import time, so the test
database URL must be set before `app.config` is imported.
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
for path in (str(REPO_ROOT), str(BACKEND_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

_DB_FILE = os.path.join(tempfile.mkdtemp(prefix="mango-tests-"), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_FILE}"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["REDIS_URL"] = ""
os.environ.pop("INGEST_API_KEY", None)
os.environ.setdefault("UPLOAD_FOLDER", tempfile.mkdtemp(prefix="mango-uploads-"))


@pytest.fixture(scope="session")
def app():
    from app import create_app
    from app.extensions import db

    flask_app = create_app()
    flask_app.config.update(TESTING=True)

    with flask_app.app_context():
        db.create_all()

    return flask_app


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def logged_in_client(app):
    """Test client with a session for an active viewer user."""
    from app.extensions import db
    from app.models.user import MangoUser

    with app.app_context():
        user = MangoUser.query.filter_by(email="tester@mango.test").first()
        if user is None:
            user = MangoUser(email="tester@mango.test", role="estudiante", active=True)
            user.set_password("irrelevant")
            db.session.add(user)
            db.session.commit()
        user_id = user.id

    test_client = app.test_client()
    with test_client.session_transaction() as sess:
        sess["user_id"] = user_id
        sess["role"] = "estudiante"
    return test_client
