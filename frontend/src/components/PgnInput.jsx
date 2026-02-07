import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SAMPLE_PGN = `
[Event "FIDE World Blitz Chess Championship 2023"]
[Site "Chess.com"]
[Date "2023.12.29"]
[Round "11"]
[White "Dubov, Daniil"]
[Black "Nepomniachtchi, Ian"]
[Result "*"]
[WhiteElo "2763"]
[BlackElo "2795"]

1. Nf3 Nf6 2. Nd4 Nd5 3. Nb3 Nb6 4. Nc3 Nc6 5. Ne4 Ne5 6. Ng5 Ng4 7. Nf3 Nf6 8.
Ng1 Ng8 9. Nc5 Nc4 10. Na4 Na5 11. Nc3 Nc6 12. Nb1 Nb8 *`;

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
          rows={12}
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
