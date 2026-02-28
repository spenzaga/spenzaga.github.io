import { useState } from "react";
import { LayoutGrid, X, Flag } from "lucide-react";

interface Props {
  total: number;
  current: number;
  answered: Record<string, boolean>;
  flagged?: Record<string, boolean>;
  questionIds: string[];
  onNavigate: (index: number) => void;
}

const NavigationPanel = ({ total, current, answered, flagged = {}, questionIds, onNavigate }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        title="Navigasi Soal"
      >
        {open ? <X className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed right-20 top-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-2xl border border-border p-4 w-64 animate-slide-in-right">
          <h3 className="text-sm font-bold text-primary mb-3">Navigasi Soal</h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: total }).map((_, i) => {
              const isAnswered = answered[questionIds[i]];
              const isCurrent = i === current;
              const isFlagged = flagged[questionIds[i]];
              return (
                <button
                  key={i}
                  onClick={() => { onNavigate(i); setOpen(false); }}
                  className={`relative w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-accent"
                      : isAnswered
                      ? "bg-success text-success-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                  }`}
                >
                  {i + 1}
                  {isFlagged && (
                    <Flag className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" fill="currentColor" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success" /> Terjawab</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary border" /> Belum</span>
            <span className="flex items-center gap-1"><Flag className="w-3 h-3 text-amber-500" fill="currentColor" /> Ditandai</span>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationPanel;
