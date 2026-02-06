import subprocess
import threading
import chess
import chess.pgn
import io
from config import (
    STOCKFISH_PATH,
    DEFAULT_DEPTH,
    DEFAULT_MULTIPV,
    DEFAULT_THREADS,
    DEFAULT_HASH_MB,
)


class StockfishEngine:
    """Communicate with Stockfish via subprocess to avoid asyncio/eventlet conflicts."""

    def __init__(self):
        self.process = None
        self.lock = threading.Lock()

    def start(self):
        self.process = subprocess.Popen(
            [STOCKFISH_PATH],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            bufsize=1,
        )
        self._send("uci")
        self._read_until("uciok")
        self._send(f"setoption name Threads value {DEFAULT_THREADS}")
        self._send(f"setoption name Hash value {DEFAULT_HASH_MB}")
        self._send("isready")
        self._read_until("readyok")

    def stop(self):
        if self.process:
            self._send("quit")
            self.process.wait()
            self.process = None

    def _send(self, command):
        self.process.stdin.write(command + "\n")
        self.process.stdin.flush()

    def _read_until(self, token):
        lines = []
        while True:
            line = self.process.stdout.readline().strip()
            lines.append(line)
            if token in line:
                break
        return lines

    def analyze(self, fen, depth=DEFAULT_DEPTH, multipv=DEFAULT_MULTIPV):
        """Analyze a position and return top lines with evaluations."""
        with self.lock:
            if not self.process:
                self.start()

            board = chess.Board(fen)

            if board.is_game_over():
                return {
                    "fen": fen,
                    "is_game_over": True,
                    "result": board.result(),
                    "lines": [],
                }

            self._send("ucinewgame")
            self._send(f"setoption name MultiPV value {multipv}")
            self._send(f"position fen {fen}")
            self._send("isready")
            self._read_until("readyok")
            self._send(f"go depth {depth}")
            output = self._read_until("bestmove")

            # Parse the last set of "info depth N" lines at the target depth
            lines_by_pv = {}
            for line in output:
                if line.startswith("info") and " pv " in line and "multipv" in line:
                    parsed = self._parse_info_line(line, board)
                    if parsed:
                        lines_by_pv[parsed["multipv"]] = parsed

            lines = []
            for key in sorted(lines_by_pv.keys()):
                entry = lines_by_pv[key]
                lines.append({
                    "pv": entry["pv_uci"],
                    "pv_san": entry["pv_san"],
                    "depth": entry["depth"],
                    "cp": entry["cp"],
                    "mate": entry["mate"],
                })

            return {
                "fen": fen,
                "is_game_over": False,
                "turn": "white" if board.turn else "black",
                "lines": lines,
            }

    def _parse_info_line(self, line, board):
        """Parse a UCI info line into structured data."""
        tokens = line.split()
        result = {"multipv": 1, "depth": 0, "cp": None, "mate": None, "pv_uci": [], "pv_san": []}

        i = 0
        while i < len(tokens):
            if tokens[i] == "depth":
                result["depth"] = int(tokens[i + 1])
                i += 2
            elif tokens[i] == "multipv":
                result["multipv"] = int(tokens[i + 1])
                i += 2
            elif tokens[i] == "score":
                if tokens[i + 1] == "cp":
                    cp = int(tokens[i + 2])
                    # Convert to White's perspective
                    result["cp"] = cp if board.turn == chess.WHITE else -cp
                    i += 3
                elif tokens[i + 1] == "mate":
                    mate = int(tokens[i + 2])
                    result["mate"] = mate if board.turn == chess.WHITE else -mate
                    i += 3
                else:
                    i += 1
            elif tokens[i] == "pv":
                pv_tokens = tokens[i + 1:]
                result["pv_uci"] = pv_tokens
                # Convert UCI moves to SAN
                temp_board = board.copy()
                for uci_move in pv_tokens:
                    try:
                        move = temp_board.parse_uci(uci_move)
                        result["pv_san"].append(temp_board.san(move))
                        temp_board.push(move)
                    except (ValueError, chess.IllegalMoveError):
                        break
                break  # pv is always the last token group
            else:
                i += 1

        return result if result["pv_uci"] else None

    def get_best_move(self, fen, depth=DEFAULT_DEPTH):
        """Get the single best move for a position."""
        result = self.analyze(fen, depth=depth, multipv=1)
        if result["lines"]:
            return {
                "uci": result["lines"][0]["pv"][0],
                "san": result["lines"][0]["pv_san"][0],
            }
        return None


def parse_pgn(pgn_string):
    """Parse a PGN string and return list of positions with moves."""
    game = chess.pgn.read_game(io.StringIO(pgn_string))
    if not game:
        return None

    positions = []
    board = game.board()

    positions.append({
        "fen": board.fen(),
        "move_number": 0,
        "move": None,
        "san": None,
    })

    for i, move in enumerate(game.mainline_moves()):
        san = board.san(move)
        board.push(move)
        positions.append({
            "fen": board.fen(),
            "move_number": i + 1,
            "move": move.uci(),
            "san": san,
        })

    return {
        "headers": dict(game.headers),
        "positions": positions,
    }
