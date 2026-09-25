export function TransactionHeatmap({
  dailyActivity,
  period,
}: TransactionHeatmapProps) {
  const locale = useLocale();{!isYearly && (
  <div
    className="mx-auto mb-2 grid w-max gap-1 text-[10px] font-bold text-white/40"
    style={{ gridTemplateColumns: `repeat(7, var(--cell-size))` }}
  >
    {dayLabels.map((label, i) => (
      <span key={i} className="text-center">
        {label}
      </span>
    ))}
  </div>
)}

{isYearly ? (
  <div className="flex w-max">
    <div
      className="mr-1 grid gap-1 text-[10px] font-bold text-white/40"
      style={{ gridTemplateRows: `repeat(7, var(--cell-size))` }}
    >
      {dayLabels.map((label, i) => (
        <span key={i} className="flex items-center justify-center">
          {label}
        </span>
      ))}
    </div>
    <div className="grid gap-1" style={gridStyle}>
      {renderCells()}
    </div>
  </div>
) : (
  <div className="mx-auto grid w-max gap-1" style={gridStyle}>
    {renderCells()}
  </div>
)}