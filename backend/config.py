import os

STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH", "/opt/homebrew/bin/stockfish")

# Default analysis parameters
DEFAULT_DEPTH = 20
MIN_DEPTH = 1
MAX_DEPTH = 40
DEFAULT_MULTIPV = 3  # Number of top lines to return
DEFAULT_THREADS = 2
DEFAULT_HASH_MB = 128
