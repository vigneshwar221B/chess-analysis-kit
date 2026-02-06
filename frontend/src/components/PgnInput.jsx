import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SAMPLE_PGN = `[Event "Example Game"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O`;

export default function PgnInput({ onLoadPgn }) {
  const [pgn, setPgn] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = pgn.trim();
    if (!trimmed) {
      setError("Please enter a PGN");
      return;
    }
    setError("");
    onLoadPgn(trimmed);
  };

  const handleLoadSample = () => {
    setPgn(SAMPLE_PGN);
    setError("");
    onLoadPgn(SAMPLE_PGN);
  };

  return (
    <Card>
      <CardHeader className="justify-between">
        <CardTitle>Import PGN</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleLoadSample}>
          Load sample
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder="Paste PGN here..."
          rows={18}
          className="w-full rounded bg-muted border border-border px-3 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/40 resize-none transition-colors"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button variant="success" className="w-full" onClick={handleSubmit}>
          Analyze PGN
        </Button>
      </CardContent>
    </Card>
  );
}
