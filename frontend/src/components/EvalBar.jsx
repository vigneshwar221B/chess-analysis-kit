const EVAL_CAP = 10;

function evalToPercentage(cp, mate) {
  if (mate !== null && mate !== undefined) return mate > 0 ? 100 : 0;
  if (cp === null || cp === undefined) return 50;
  const clamped = Math.max(-EVAL_CAP * 100, Math.min(EVAL_CAP * 100, cp));
  return 50 + (clamped / (EVAL_CAP * 100)) * 50;
}

function formatEval(cp, mate) {
  if (mate !== null && mate !== undefined) return `M${Math.abs(mate)}`;
  if (cp === null || cp === undefined) return "0.0";
  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
}

export default function EvalBar({ cp, mate, flipped }) {
  const whitePercent = evalToPercentage(cp, mate);
  const displayPercent = flipped ? 100 - whitePercent : whitePercent;
  const evalText = formatEval(cp, mate);
  const isWhiteAdvantage =
    (cp !== null && cp > 0) || (mate !== null && mate > 0);

  return (
    <div className="w-8 h-full rounded overflow-hidden border border-zinc-300 flex flex-col relative">
      <div
        className="bg-[#312e2b] transition-all duration-500 ease-out"
        style={{ height: `${100 - displayPercent}%` }}
      />
      <div
        className="bg-white transition-all duration-500 ease-out flex-1"
      />
      <span
        className={`absolute left-1/2 -translate-x-1/2 text-[9px] font-semibold ${
          isWhiteAdvantage ? "text-zinc-600" : "text-zinc-400"
        }`}
        style={{
          top: isWhiteAdvantage ? undefined : "4px",
          bottom: isWhiteAdvantage ? "4px" : undefined,
        }}
      >
        {evalText}
      </span>
    </div>
  );
}
