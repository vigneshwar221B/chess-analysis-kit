import eventlet
eventlet.monkey_patch()

import json
import logging
import sys
import time

import chess
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

from config import DEFAULT_DEPTH, DEFAULT_MULTIPV, MIN_DEPTH, MAX_DEPTH
from engine import StockfishEngine, parse_pgn


class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        })


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("chess-backend")

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

ANALYSIS_REQUESTS = Counter(
    "chess_analysis_requests_total",
    "Total number of analysis requests",
    ["status"],
)
ANALYSIS_DURATION = Histogram(
    "chess_analysis_duration_seconds",
    "Time spent on Stockfish analysis",
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

engine = StockfishEngine()


@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


@socketio.on("connect")
def handle_connect():
    logger.info("Client connected")
    emit("connected", {"message": "Connected to chess analysis server"})


@socketio.on("disconnect")
def handle_disconnect():
    logger.info("Client disconnected")


@socketio.on("analyze")
def handle_analyze(data):
    """Analyze a position given a FEN string.

    Expected data:
        fen: FEN string of the position
        depth: (optional) search depth, defaults to DEFAULT_DEPTH
        multipv: (optional) number of lines, defaults to DEFAULT_MULTIPV
    """
    fen = data.get("fen")
    if not fen:
        emit("analysis_error", {"error": "No FEN provided"})
        return

    try:
        chess.Board(fen)
    except ValueError:
        emit("analysis_error", {"error": "Invalid FEN string"})
        return

    depth = data.get("depth", DEFAULT_DEPTH)
    depth = max(MIN_DEPTH, min(MAX_DEPTH, int(depth)))
    multipv = data.get("multipv", DEFAULT_MULTIPV)

    try:
        start = time.time()
        result = engine.analyze(fen, depth=depth, multipv=multipv)
        ANALYSIS_DURATION.observe(time.time() - start)
        ANALYSIS_REQUESTS.labels(status="success").inc()
        emit("analysis_result", result)
    except Exception as e:
        ANALYSIS_REQUESTS.labels(status="error").inc()
        emit("analysis_error", {"error": str(e)})


@socketio.on("parse_pgn")
def handle_parse_pgn(data):
    """Parse a PGN string and return all positions.

    Expected data:
        pgn: PGN string
    """
    pgn_string = data.get("pgn")
    if not pgn_string:
        emit("pgn_error", {"error": "No PGN provided"})
        return

    try:
        result = parse_pgn(pgn_string)
        if result is None:
            emit("pgn_error", {"error": "Failed to parse PGN"})
            return
        emit("pgn_parsed", result)
    except Exception as e:
        emit("pgn_error", {"error": str(e)})


if __name__ == "__main__":
    try:
        engine.start()
        logger.info("Stockfish engine started")
    except Exception as e:
        logger.warning("Could not start Stockfish: %s", e)

    socketio.run(app, host="0.0.0.0", port=5001, debug=False)
