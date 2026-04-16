import { FC, useState } from 'react';
import { SKINS, BallSkin, SkinManager } from '../game/SkinManager';

interface Props {
  skinManager: SkinManager;
  onClose: () => void;
  onEquip: () => void;
}

export const ShopScreen: FC<Props> = ({ skinManager, onClose, onEquip }) => {
  const [diamonds, setDiamonds] = useState(skinManager.getTotalDiamonds());
  const [equipped, setEquipped] = useState(skinManager.getEquipped().id);
  const [, forceUpdate] = useState(0);

  const handleBuy = (skin: BallSkin) => {
    const result = skinManager.buy(skin.id, diamonds);
    if (result.success) {
      setDiamonds(result.remaining);
      skinManager.setTotalDiamonds(result.remaining);
      forceUpdate(n => n + 1);
    }
  };

  const handleEquip = (skin: BallSkin) => {
    if (skinManager.equip(skin.id)) {
      setEquipped(skin.id);
      onEquip();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 animate-[fade-in_0.3s_ease-out]">
      <div className="glass-panel flex flex-col items-center gap-4 max-w-md mx-4 w-full max-h-[80vh]">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-display text-2xl font-bold text-foreground">🏪 Ball Shop</h2>
          <div className="flex items-center gap-1.5">
            <span>💎</span>
            <span className="font-display font-bold text-foreground">{diamonds}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full overflow-y-auto pr-1" style={{ maxHeight: '50vh' }}>
          {SKINS.map(skin => {
            const owned = skinManager.isOwned(skin.id);
            const isEquipped = equipped === skin.id;
            const canAfford = diamonds >= skin.cost;

            return (
              <div
                key={skin.id}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                style={{
                  background: isEquipped
                    ? 'hsl(var(--primary) / 0.2)'
                    : 'hsl(var(--muted) / 0.3)',
                  border: isEquipped
                    ? '2px solid hsl(var(--primary))'
                    : '2px solid transparent',
                }}
              >
                <span className="text-3xl">{skin.emoji}</span>
                <span className="text-sm font-bold text-foreground">{skin.name}</span>

                {!owned ? (
                  <button
                    onClick={() => handleBuy(skin)}
                    disabled={!canAfford}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: canAfford
                        ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-orange)))'
                        : 'hsl(var(--muted) / 0.5)',
                      color: canAfford ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                      opacity: canAfford ? 1 : 0.5,
                    }}
                  >
                    💎 {skin.cost}
                  </button>
                ) : isEquipped ? (
                  <span className="px-4 py-1.5 text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    ✓ Equipped
                  </span>
                ) : (
                  <button
                    onClick={() => handleEquip(skin)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold"
                    style={{
                      background: 'hsl(var(--festival-purple) / 0.5)',
                      color: 'hsl(var(--secondary-foreground))',
                    }}
                  >
                    Equip
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="btn-endless w-full mt-2">
          ← Back
        </button>
      </div>
    </div>
  );
};
