import { FC } from 'react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  diamonds: number;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverScreen: FC<GameOverScreenProps> = ({ score, highScore, diamonds, onRestart, onMenu }) => {
  const isNewBest = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 animate-[fade-in_0.5s_ease-out]">
      <div className="glass-panel flex flex-col items-center gap-5 text-center max-w-sm mx-4">
        <div className="text-4xl">🪔</div>
        <h2 className="font-display text-3xl font-bold text-foreground">Game Over</h2>

        {isNewBest && (
          <div className="text-sm font-bold text-primary sparkle">🏆 New High Score!</div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="flex flex-col items-center p-3 rounded-xl bg-muted/30">
            <span className="text-2xl font-display font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-muted/30">
            <span className="text-2xl font-display font-bold text-foreground">👑 {highScore}</span>
            <span className="text-xs text-muted-foreground">Best</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-foreground">
          <span>💎</span>
          <span className="font-display font-bold">{diamonds}</span>
          <span className="text-sm text-muted-foreground">collected</span>
        </div>

        <div className="flex flex-col gap-3 w-full mt-2">
          <button onClick={onRestart} className="btn-festival">
            🔄 Play Again
          </button>
          <button onClick={onMenu} className="btn-endless">
            🏠 Menu
          </button>
        </div>
      </div>
    </div>
  );
};
