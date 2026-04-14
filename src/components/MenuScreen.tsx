import { FC } from 'react';

interface MenuScreenProps {
  onPlay: () => void;
}

export const MenuScreen: FC<MenuScreenProps> = ({ onPlay }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
      <div className="glass-panel flex flex-col items-center gap-6 text-center max-w-md mx-4">
        {/* Decorative diya icon */}
        <div className="text-5xl sparkle">🪔</div>
        
        <h1 className="game-title leading-tight">
          Bounce X
        </h1>
        
        <p className="text-muted-foreground text-sm max-w-xs">
          Hop across glowing diyas to the rhythm of festive beats!
        </p>

        <div className="flex flex-col gap-3 w-full mt-2">
          <button onClick={onPlay} className="btn-festival flex items-center justify-center gap-3">
            <span className="text-xl">▶</span>
            <span>Play</span>
          </button>
          <button onClick={onPlay} className="btn-endless flex items-center justify-center gap-3">
            <span className="text-xl">▶</span>
            <span>Endless</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <span>👑 High Score: {localStorage.getItem('diyaJumperHighScore') || '0'}</span>
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>← → or Swipe to move</span>
        </div>
      </div>

      {/* Floating decorations */}
      <div className="absolute top-10 left-10 text-3xl sparkle" style={{ animationDelay: '0.3s' }}>✨</div>
      <div className="absolute top-20 right-14 text-2xl sparkle" style={{ animationDelay: '0.7s' }}>🪔</div>
      <div className="absolute bottom-20 left-16 text-2xl sparkle" style={{ animationDelay: '1.1s' }}>💎</div>
      <div className="absolute bottom-32 right-10 text-3xl sparkle" style={{ animationDelay: '0.5s' }}>✨</div>
    </div>
  );
};
