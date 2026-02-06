import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MoveList({ moves, currentMoveIndex, onSelectMove }) {
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      whiteIndex: i,
      black: moves[i + 1] || null,
      blackIndex: i + 1,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moves</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-52 overflow-y-auto space-y-px">
          <button
            onClick={() => onSelectMove(-1)}
            className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${
              currentMoveIndex === -1
                ? "bg-accent/10 text-accent font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Start
          </button>
          {movePairs.map((pair) => (
            <div key={pair.number} className="flex items-center">
              <span className="text-[11px] text-muted-foreground/50 w-8 text-right pr-2 font-mono">
                {pair.number}.
              </span>
              <button
                onClick={() => onSelectMove(pair.whiteIndex)}
                className={`flex-1 text-center px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  currentMoveIndex === pair.whiteIndex
                    ? "bg-accent/10 text-accent"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {pair.white}
              </button>
              {pair.black ? (
                <button
                  onClick={() => onSelectMove(pair.blackIndex)}
                  className={`flex-1 text-center px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    currentMoveIndex === pair.blackIndex
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {pair.black}
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
