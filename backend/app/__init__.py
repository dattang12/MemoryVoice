"""Archive service application factory.

Assembles and returns a configured Flask application with CORS,
request size limits, and all registered route blueprints.
"""

import os

from flask import Flask, jsonify
from flask_cors import CORS

_DEFAULT_KEY_SENTINEL = "change_me_to_a_random_32_char_secret"
_REQUEST_BODY_CAP = 320 * 1024 * 1024  # 320 MB ceiling


def build_server() -> Flask:
    """Assemble and configure the Flask application instance.

    Returns:
        Fully configured Flask application ready to serve requests.

    Raises:
        RuntimeError: If FLASK_SECRET_KEY is absent or is the known-weak default
            and the runtime environment is not development or testing.
    """
    server = Flask(__name__)

    runtime_env = os.environ.get("FLASK_ENV", "production")
    signing_key = os.environ.get("FLASK_SECRET_KEY")

    if not signing_key or signing_key == _DEFAULT_KEY_SENTINEL:
        if runtime_env in ("development", "testing"):
            signing_key = "dev-insecure-key-do-not-use-in-production"
        else:
            raise RuntimeError(
                "FLASK_SECRET_KEY is missing or is the default placeholder. "
                "Generate a real key: python -c \"import secrets; print(secrets.token_hex(32))\""
            )

    server.secret_key = signing_key
    server.config["MAX_CONTENT_LENGTH"] = _REQUEST_BODY_CAP

    _raw_origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,"
        "https://memorybridge-h4h-2026.web.app,"
        "https://memorybridge-h4h-2026.firebaseapp.com",
    )
    _allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

    CORS(server, origins=_allowed_origins, supports_credentials=True)

    from .routes.ingest import ingest_bp
    from .routes.vault import vault_bp
    from .routes.compute import compute_bp

    server.register_blueprint(ingest_bp, url_prefix="/api")
    server.register_blueprint(vault_bp, url_prefix="/api")
    server.register_blueprint(compute_bp, url_prefix="/api")

    @server.get("/")
    def root():
        return jsonify({
            "service": "memoryvoice-backend",
            "status": "running",
            "endpoints": {
                "health":        "GET  /api/health",
                "upload":        "POST /api/upload",
                "list_memories": "GET  /api/memories",
                "get_memory":    "GET  /api/memories/<memory_id>",
                "trigger_embed": "POST /api/embed",
            },
        }), 200

    return server
