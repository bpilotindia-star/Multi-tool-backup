import './ProgressBar.css';

export default function ProgressBar({ current, total, isActive }) {
  if (!isActive) return null;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="pb" id="progress-bar">
      <div className="pb__top">
        <span className="pb__label">Extracting…</span>
        <span className="pb__count">{current} / {total}</span>
      </div>
      <div className="pb__track">
        <div className="pb__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="pb__pct">{pct}%</span>
    </div>
  );
}
