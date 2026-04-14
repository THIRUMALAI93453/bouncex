import { FC } from 'react';
import { GAME } from '../game/constants';

interface GameHUDProps {
  score: number;
  combo: number;
  diamonds: number;
}

export const GameHUD: FC<GameHUDProps> = ({ score, combo, diamonds }) => {
  return (
    <div className="absolute inset-x-0 top-0 z-10 pointer-events-none p-4">
      <div className="flex items-start justify-between max-w-2xl mx-auto">
        {/* Score */}
        <div className="flex flex-col items-center">
          <span className="hud-text text-4xl font-extrabold">{score}</span>
          {combo >= GAME.COMBO_THRESHOLD && (
            <span className="text-xs font-bold text-primary sparkle">
              🔥 x{combo}
            </span>
          )}
        </div>

        {/* Diamonds */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg">💎</span>
          <span className="hud-text text-xl font-bold">{diamonds}</span>
        </div>
      </div>
    </div>
  );
};
