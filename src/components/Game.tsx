import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine, GameState } from '../game/GameEngine';
import { MenuScreen } from './MenuScreen';
import { GameOverScreen } from './GameOverScreen';
import { GameHUD } from './GameHUD';

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [finalDiamonds, setFinalDiamonds] = useState(0);

  const onScoreUpdate = useCallback((s: number, c: number, d: number) => {
    setScore(s);
    setCombo(c);
    setDiamonds(d);
  }, []);

  const onGameOver = useCallback((s: number, hs: number, d: number) => {
    setFinalScore(s);
    setHighScore(hs);
    setFinalDiamonds(d);
  }, []);

  const onStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current, { onScoreUpdate, onGameOver, onStateChange });
    engineRef.current = engine;
    return () => engine.dispose();
  }, [onScoreUpdate, onGameOver, onStateChange]);

  const handlePlay = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handleMenu = useCallback(() => {
    engineRef.current?.goToMenu();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {gameState === 'menu' && <MenuScreen onPlay={handlePlay} />}
      {gameState === 'playing' && <GameHUD score={score} combo={combo} diamonds={diamonds} />}
      {gameState === 'gameover' && (
        <GameOverScreen
          score={finalScore}
          highScore={highScore}
          diamonds={finalDiamonds}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
};

export default Game;
