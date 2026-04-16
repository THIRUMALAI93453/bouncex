

# Bounce X — Fun & Attractive Enhancement Ideas

Here are unique, standout features to make the game more addictive, visually impressive, and shareable:

---

## 1. Power-Up Tiles (New Tile Types)
- **Magnet Tile (🧲):** Auto-collects nearby diamonds for 5 seconds
- **Shield Tile (🛡️):** Gives one free "save" — if you miss a tile, you respawn instead of dying
- **Speed Boost Tile (⚡):** Temporarily doubles speed with a motion blur effect
- **Giant Ball Tile (🔮):** Ball grows 2x for 3 seconds, making it easier to land

Power-ups appear as glowing special tiles with distinct colors and floating icons.

---

## 2. Camera Shake + Slow-Mo on Epic Moments
- Screen shake on high combos (5x, 10x, etc.)
- Brief slow-motion effect when collecting a power-up or hitting a 10x combo streak
- Zoom-in effect right before game over for dramatic impact

---

## 3. Dynamic Color Themes That Change as You Play
- The entire scene (tiles, fog, background, ball trail) shifts color palette every 50 points
- Themes: Neon Purple → Sunset Orange → Ice Blue → Toxic Green → Golden Hour
- Smooth color transitions using `THREE.Color.lerp()`

---

## 4. Streak Flames & Visual Combos
- At 3x combo: ball gets a small fire trail
- At 5x: tiles ahead start pulsing to the beat faster
- At 10x: screen edges glow, firework particles burst on every bounce
- Combo counter appears as a big animated number in the center that fades out

---

## 5. Daily Challenge / Seed-Based Runs
- Generate a daily tile pattern from a date-based seed
- "Daily Challenge" button on menu — everyone gets the same layout
- Show "Today's Best" score using localStorage

---

## 6. Ball Skins Shop (using collected diamonds 💎)
- Skins: Default, Fire Ball, Ice Ball, Galaxy Ball, Disco Ball, Golden Ball
- Each skin has a unique trail effect and bounce particle color
- Store purchase state in localStorage
- Add a "Shop" button on the menu screen

---

## 7. Floating Text Pop-Ups
- "+10" floats up when landing on a tile
- "PERFECT!" for center landings
- "COMBO x5 🔥" with scaling animation
- "+50 💎" when collecting diamonds
- These use CSS animations overlaid on the canvas

---

## Implementation Priority (what to build)

### Phase 1 — High Impact, Quick Wins
1. **Floating score pop-ups** — CSS overlay with animated "+10", "PERFECT!", combo text
2. **Dynamic color themes** — Color palette shifts every 50 points with smooth lerp
3. **Streak flames** — Enhanced trail/particle effects at combo milestones (3x, 5x, 10x)
4. **Camera effects** — Shake on combos, brief slow-mo on power-up pickup

### Phase 2 — Deeper Features
5. **Power-up tiles** — Add 3 special tile types (Shield, Magnet, Speed Boost) with timed effects
6. **Ball skins shop** — Diamond-based unlock system with unique visuals per skin
7. **Daily challenge mode** — Seeded random generation for a shared daily run

### Technical Approach
- Power-ups: Add new tile types in `TileManager.ts` with a `powerUpType` field; handle effects in `GameEngine.ts`
- Color themes: Add a theme array in `constants.ts`; lerp all materials in the game loop based on score thresholds
- Floating text: New React component `FloatingText.tsx` positioned via CSS `absolute` with `animation-fill-mode: forwards`
- Ball skins: New `SkinManager.ts` class that swaps ball material/trail; skin state in localStorage
- Camera effects: Add shake offset + slow-mo time multiplier in `GameEngine.ts` loop

