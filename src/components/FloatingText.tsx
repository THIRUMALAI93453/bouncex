import { FC, useEffect, useState, useCallback, useRef } from 'react';

interface FloatingItem {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: string;
}

let nextId = 0;

export interface FloatingTextRef {
  spawn: (text: string, color?: string, size?: string) => void;
}

export const FloatingText: FC<{ refCallback: (ref: FloatingTextRef) => void }> = ({ refCallback }) => {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const spawn = useCallback((text: string, color = '#ffd700', size = '1.5rem') => {
    const id = nextId++;
    const x = 40 + Math.random() * 20; // 40-60% from left
    const y = 35 + Math.random() * 10; // 35-45% from top
    const item: FloatingItem = { id, text, x, y, color, size };
    setItems(prev => [...prev.slice(-8), item]); // max 9 items
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 1200);
  }, []);

  useEffect(() => {
    refCallback({ spawn });
  }, [refCallback, spawn]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {items.map(item => (
        <div
          key={item.id}
          className="absolute font-display font-extrabold whitespace-nowrap"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            color: item.color,
            fontSize: item.size,
            textShadow: `0 0 20px ${item.color}, 0 0 40px ${item.color}`,
            animation: 'floatUp 1.2s ease-out forwards',
            fontFamily: 'var(--font-display)',
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
