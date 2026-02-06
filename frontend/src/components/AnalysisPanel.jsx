import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatEval(cp, mate) {
  if (mate !== null && mate !== undefined) {
    return `${mate > 0 ? "+" : ""}M${Math.abs(mate)}`;
  }
  if (cp === null || cp === undefined) return "0.0";
  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
}

function evalColorClass(cp, mate) {
  if (mate !== null && mate !== undefined) {
    return mate > 0 ? "text-success" : "text-danger";
  }
  if (cp === null || cp === undefined) return "text-muted-foreground";
  if (cp > 100) return "text-success";
  if (cp < -100) return "text-danger";
  return "text-warning";
}

export default function AnalysisPanel({ lines, depth, isAnalyzing }) {
  return (
    <Card>
      <CardHeader className="justify-between">
        <CardTitle>Engine Lines</CardTitle>
        <Badge variant={isAnalyzing ? "default" : "muted"}>
          {isAnalyzing ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
              d{depth}
            </span>
          ) : (
            `d${depth}`
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-8">
            {isAnalyzing
              ? "Analyzing position..."
              : "Make a move or load a PGN"}
          </p>
        ) : (
          <div className="space-y-0.5">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  i === 0 ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <span
                  className={`font-mono text-sm font-bold min-w-[48px] text-right tabular-nums ${evalColorClass(
                    line.cp,
                    line.mate
                  )}`}
                >
                  {formatEval(line.cp, line.mate)}
                </span>
                <span className="flex-1 font-mono text-[11px] text-muted-foreground truncate leading-relaxed">
                  {line.pv_san.slice(0, 10).join("  ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
