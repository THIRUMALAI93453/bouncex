import { FC } from 'react';

interface PowerUpDisplay {
  type: string;
  timeLeft: number;
  duration: number;
}

interface Props {
  powerUps: PowerUpDisplay[];
}

const ICONS: Record<string, string> = {
  shield: '🛡️',
  magnet: '🧲',
  speed: '⚡',
};

const COLORS: Record<string, string> = {
  shield: '#00b4d8',
  magnet: '#e84393',
  speed: '#70e000',
};

export const PowerUpIndicator: FC<Props> = ({ powerUps }) => {
  if (powerUps.length === 0) return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-16 z-20 flex gap-3 pointer-events-none">
      {powerUps.map((p, i) => {
        const pct = (p.timeLeft / p.duration) * 100;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl relative"
              style={{
                background: `conic-gradient(${COLORS[p.type] || '#fff'} ${pct}%, transparent ${pct}%)`,
                boxShadow: `0 0 15px ${COLORS[p.type] || '#fff'}`,
              }}
            >
              <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center text-xl">
                {ICONS[p.type] || '?'}
              </div>
            </div>
            <span className="text-[10px] font-bold" style={{ color: COLORS[p.type] || '#fff' }}>
              {p.timeLeft.toFixed(1)}s
            </span>
          </div>
        );
      })}
    </div>
  );
};
