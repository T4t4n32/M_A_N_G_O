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

@auth_bp.route("/me", methods=["GET"])
def me():
    if "user" not in session:
        return jsonify({"authenticated": False}), 401

    return jsonify({
        "authenticated": True,
        "user": session["user"]
    })
