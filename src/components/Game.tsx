import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine, GameState } from '../game/GameEngine';
import { MenuScreen } from './MenuScreen';
import { GameOverScreen } from './GameOverScreen';
import { GameHUD } from './GameHUD';
import { FloatingText, FloatingTextRef } from './FloatingText';
import { PowerUpIndicator } from './PowerUpIndicator';
import { ShopScreen } from './ShopScreen';

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const floatingRef = useRef<FloatingTextRef | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [finalDiamonds, setFinalDiamonds] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<{ type: string; timeLeft: number; duration: number }[]>([]);
  const [showShop, setShowShop] = useState(false);
  const [comboGlow, setComboGlow] = useState(0);

  const onScoreUpdate = useCallback((s: number, c: number, d: number) => {
    setScore(s);
    setCombo(c);
    setDiamonds(d);
  }, []);

  const onGameOver = useCallback((s: number, hs: number, d: number) => {
    setFinalScore(s);
    setHighScore(hs);
    setFinalDiamonds(d);
    setActivePowerUps([]);
  }, []);

  const onStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const onFloatingText = useCallback((text: string, color?: string, size?: string) => {
    floatingRef.current?.spawn(text, color, size);
  }, []);

  const onPowerUp = useCallback((type: string, timeLeft: number, duration: number) => {
    setActivePowerUps(prev => {
      const existing = prev.find(p => p.type === type);
      if (existing) {
        return prev.map(p => p.type === type ? { ...p, timeLeft, duration } : p);
      }
      return [...prev, { type, timeLeft, duration }];
    });
  }, []);

  const onComboMilestone = useCallback((c: number) => {
    setComboGlow(c);
    setTimeout(() => setComboGlow(0), 1500);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current, {
      onScoreUpdate, onGameOver, onStateChange, onFloatingText, onPowerUp, onComboMilestone,
    });
    engineRef.current = engine;
    return () => engine.dispose();
  }, [onScoreUpdate, onGameOver, onStateChange, onFloatingText, onPowerUp, onComboMilestone]);

  const handlePlay = useCallback(() => {
    setShowShop(false);
    engineRef.current?.start(false);
  }, []);

  const handleDailyChallenge = useCallback(() => {
    setShowShop(false);
    engineRef.current?.start(true);
  }, []);

  const handleRestart = useCallback(() => engineRef.current?.start(false), []);
  const handleMenu = useCallback(() => engineRef.current?.goToMenu(), []);

  const handleFloatingRef = useCallback((ref: FloatingTextRef) => {
    floatingRef.current = ref;
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Combo glow border */}
      {comboGlow >= 10 && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            boxShadow: 'inset 0 0 80px 20px rgba(255,0,255,0.4)',
            animation: 'pulse 0.5s ease-out',
          }}
        />
      )}
      {comboGlow >= 5 && comboGlow < 10 && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            boxShadow: 'inset 0 0 60px 15px rgba(255,136,0,0.3)',
            animation: 'pulse 0.5s ease-out',
          }}
        />
      )}

      <FloatingText refCallback={handleFloatingRef} />

      {gameState === 'menu' && !showShop && (
        <MenuScreen
          onPlay={handlePlay}
          onDailyChallenge={handleDailyChallenge}
          onShop={() => setShowShop(true)}
        />
      )}
      {showShop && gameState === 'menu' && engineRef.current && (
        <ShopScreen
          skinManager={engineRef.current.skinManager}
          onClose={() => setShowShop(false)}
          onEquip={() => {}}
        />
      )}
      {gameState === 'playing' && (
        <>
          <GameHUD score={score} combo={combo} diamonds={diamonds} />
          <PowerUpIndicator powerUps={activePowerUps.filter(p => p.timeLeft > 0)} />
        </>
      )}
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
