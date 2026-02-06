import chess
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from config import DEFAULT_DEPTH, DEFAULT_MULTIPV, MIN_DEPTH, MAX_DEPTH
from engine import StockfishEngine, parse_pgn

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

engine = StockfishEngine()


@app.route("/health")
def health():
    return {"status": "ok"}


@socketio.on("connect")
def handle_connect():
    print("Client connected")
    emit("connected", {"message": "Connected to chess analysis server"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


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
        result = engine.analyze(fen, depth=depth, multipv=multipv)
        emit("analysis_result", result)
    except Exception as e:
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
        print("Stockfish engine started")
    except Exception as e:
        print(f"Warning: Could not start Stockfish: {e}")
        print("Make sure Stockfish is installed and STOCKFISH_PATH is set correctly")

    socketio.run(app, host="0.0.0.0", port=5001, debug=True)
