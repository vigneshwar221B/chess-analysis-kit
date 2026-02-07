import { useState, useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { io } from "socket.io-client";
import {
  RotateCcw,
  ArrowLeftRight,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import EvalBar from "@/components/EvalBar";
import AnalysisPanel from "@/components/AnalysisPanel";
import PgnInput from "@/components/PgnInput";
import MoveList from "@/components/MoveList";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function App() {
  const [game, setGame] = useState(new Chess());
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [connected, setConnected] = useState(false);
  const [analysisLines, setAnalysisLines] = useState([]);
  const [analysisDepth, setAnalysisDepth] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [pgnPositions, setPgnPositions] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [depth, setDepth] = useState(20);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("analysis_result", (data) => {
      setIsAnalyzing(false);
      if (data.lines && data.lines.length > 0) {
        setAnalysisLines(data.lines);
        setAnalysisDepth(data.lines[0].depth);
        setBestMove({
          from: data.lines[0].pv[0].substring(0, 2),
          to: data.lines[0].pv[0].substring(2, 4),
        });
      } else {
        setAnalysisLines([]);
        setBestMove(null);
      }
    });

    socket.on("analysis_error", (data) => {
      setIsAnalyzing(false);
      console.error("Analysis error:", data.error);
    });

    socket.on("pgn_parsed", (data) => {
      setPgnPositions(data.positions);
      const moves = data.positions.filter((p) => p.san).map((p) => p.san);
      setMoveHistory(moves);
      const startFen = data.positions[0].fen;
      setGame(new Chess(startFen));
      setCurrentMoveIndex(-1);
      requestAnalysis(startFen);
    });

    socket.on("pgn_error", (data) => {
      console.error("PGN error:", data.error);
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAnalysis = useCallback(
    (fen) => {
      if (socketRef.current?.connected) {
        setIsAnalyzing(true);
        setAnalysisLines([]);
        setBestMove(null);
        socketRef.current.emit("analyze", { fen, depth, multipv: 3 });
      }
    },
    [depth]
  );

  useEffect(() => {
    const fen = game.fen();
    const timeout = setTimeout(() => requestAnalysis(fen), 200);
    return () => clearTimeout(timeout);
  }, [game, requestAnalysis]);

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare, piece }) => {
      if (!targetSquare) return false;
      const gameCopy = new Chess(game.fen());
      try {
        const pieceType = piece.pieceType || "";
        const isPromotion =
          pieceType.toUpperCase() === "P" &&
          (targetSquare[1] === "8" || targetSquare[1] === "1");

        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined,
        });

        if (!move) return false;
        setPgnPositions(null);
        setCurrentMoveIndex(-1);
        setMoveHistory((prev) => [...prev, move.san]);
        setGame(gameCopy);
        return true;
      } catch {
        return false;
      }
    },
    [game]
  );

  const tryMove = useCallback(
    (from, to) => {
      const gameCopy = new Chess(game.fen());
      try {
        const piece = gameCopy.get(from);
        const isPromotion =
          piece?.type === "p" && (to[1] === "8" || to[1] === "1");
        const move = gameCopy.move({
          from,
          to,
          promotion: isPromotion ? "q" : undefined,
        });
        if (!move) return false;
        setPgnPositions(null);
        setCurrentMoveIndex(-1);
        setMoveHistory((prev) => [...prev, move.san]);
        setGame(gameCopy);
        return true;
      } catch {
        return false;
      }
    },
    [game]
  );

  const handleSquareClick = useCallback(
    ({ square }) => {
      if (selectedSquare) {
        const moved = tryMove(selectedSquare, square);
        setSelectedSquare(moved ? null : square);
      } else {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        }
      }
    },
    [selectedSquare, game, tryMove]
  );

  const handlePieceClick = useCallback(
    ({ square }) => {
      if (selectedSquare && selectedSquare !== square) {
        const moved = tryMove(selectedSquare, square);
        if (moved) {
          setSelectedSquare(null);
          return;
        }
      }
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    },
    [selectedSquare, game, tryMove]
  );

  const handleLoadPgn = (pgnString) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("parse_pgn", { pgn: pgnString });
    }
  };

  const handleSelectMove = (index) => {
    if (!pgnPositions) return;
    const posIndex = index + 1;
    if (posIndex >= 0 && posIndex < pgnPositions.length) {
      setGame(new Chess(pgnPositions[posIndex].fen));
      setCurrentMoveIndex(index);
    }
  };

  const handleNavigate = (direction) => {
    if (!pgnPositions) return;
    const newIndex = currentMoveIndex + direction;
    if (newIndex >= -1 && newIndex < pgnPositions.length - 1) {
      handleSelectMove(newIndex);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (!pgnPositions) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNavigate(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNavigate(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setPgnPositions(null);
    setCurrentMoveIndex(-1);
    setAnalysisLines([]);
    setBestMove(null);
    requestAnalysis(newGame.fen());
  };

  const customArrows = bestMove
    ? [{ startSquare: bestMove.from, endSquare: bestMove.to, color: "rgba(129, 140, 248, 0.6)" }]
    : [];

  const topCp = analysisLines.length > 0 ? analysisLines[0].cp : null;
  const topMate = analysisLines.length > 0 ? analysisLines[0].mate : null;

  let statusText = "";
  if (game.isCheckmate()) statusText = "Checkmate";
  else if (game.isDraw()) statusText = "Draw";
  else if (game.isStalemate()) statusText = "Stalemate";
  else if (game.isCheck()) statusText = "Check";

  const turnText = game.turn() === "w" ? "White" : "Black";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border flex-shrink-0 bg-card h-12 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground" style={{ marginLeft: 40 }}>
            Chess Analysis
          </span>
          <div className="flex items-center gap-2" style={{ marginRight: 40 }}>
            {statusText ? (
              <Badge variant={game.isCheckmate() ? "danger" : "default"}>
                {statusText}
              </Badge>
            ) : (
              <Badge variant="muted">{turnText} to move</Badge>
            )}
            <Badge variant={connected ? "success" : "danger"}>
              {connected ? (
                <>
                  <Wifi className="h-3 w-3" /> Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" /> Offline
                </>
              )}
            </Badge>
          </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="flex gap-5 items-start">
          {/* Eval Bar */}
          <div className="h-[560px] flex-shrink-0">
            <EvalBar
              cp={topCp}
              mate={topMate}
              flipped={boardOrientation === "black"}
            />
          </div>

          {/* Board column */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            <div className="w-[560px] rounded overflow-hidden border border-border">
              <Chessboard
                options={{
                  id: "analysis-board",
                  position: game.fen(),
                  onPieceDrop: onDrop,
                  onSquareClick: handleSquareClick,
                  onPieceClick: handlePieceClick,
                  boardOrientation: boardOrientation,
                  arrows: customArrows,
                  darkSquareStyle: { backgroundColor: "#7094A9" },
                  lightSquareStyle: { backgroundColor: "#D9E4E8" },
                  ...(selectedSquare && {
                    customSquareStyles: {
                      [selectedSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
                    },
                  }),
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Button variant="secondary" size="sm" onClick={handleNewGame}>
                  <RotateCcw className="h-3 w-3" /> New
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setBoardOrientation((p) =>
                      p === "white" ? "black" : "white"
                    )
                  }
                >
                  <ArrowLeftRight className="h-3 w-3" /> Flip
                </Button>
                {pgnPositions && (
                  <>
                    <div className="w-px h-5 bg-border mx-1" />
                    <Button variant="ghost" size="icon" onClick={() => handleSelectMove(-1)}>
                      <SkipBack className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(-1)}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(1)}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSelectMove(pgnPositions.length - 2)}>
                      <SkipForward className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-muted-foreground">Depth</span>
                <Slider
                  min={1}
                  max={30}
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-5 text-right">
                  {depth}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-3 w-[340px] flex-shrink-0 h-[592px] overflow-y-auto">
            <AnalysisPanel
              lines={analysisLines}
              depth={analysisDepth}
              isAnalyzing={isAnalyzing}
            />
            {moveHistory.length > 0 && (
              <MoveList
                moves={moveHistory}
                currentMoveIndex={currentMoveIndex}
                onSelectMove={handleSelectMove}
              />
            )}
            <PgnInput onLoadPgn={handleLoadPgn} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
