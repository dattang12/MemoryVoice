"""Archive service entry point.

Loads environment configuration, initializes the application via the
factory function, and starts the development server on port 5000.
"""

import logging
import os
import sys

from dotenv import load_dotenv

# Ensure the project root is on sys.path so `import ai` resolves correctly
# regardless of the working directory when this script is invoked.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

load_dotenv()

_env = os.environ.get("FLASK_ENV", "production")

logging.basicConfig(
    level=logging.DEBUG if _env == "development" else logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

from app import build_server  # noqa: E402 — import after dotenv + logging setup

server = build_server()

if __name__ == "__main__":
    dev_flag = _env == "development"
    server.run(host="0.0.0.0", port=5000, debug=dev_flag)
