import { useEffect, useRef, useState, type ReactNode } from "react";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match || !match[1]) return { h: 220, s: 0.5, l: 0.06 };
  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number): string =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const SATURATION = 0.72;

/** A full hue circle plus a brightness slider; emits a hex color live. */
export function ColorWheel({ color, onChange }: { color: string; onChange: (hex: string) => void }): ReactNode {
  const initial = useRef(hexToHsl(color));
  const [hue, setHue] = useState(initial.current.h);
  const [light, setLight] = useState(initial.current.l);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const { h, l } = hexToHsl(color);
    setHue((cur) => (Math.abs(cur - h) > 0.5 ? h : cur));
    setLight((cur) => (Math.abs(cur - l) > 0.004 ? l : cur));
  }, [color]);

  const emit = (h: number, l: number): void => onChange(hslToHex(h, SATURATION, l));

  const pick = (clientX: number, clientY: number): void => {
    const el = ringRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    let h = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (h < 0) h += 360;
    setHue(h);
    emit(h, light);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={ringRef}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) pick(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        className="relative mx-auto h-36 w-36 touch-none cursor-crosshair rounded-full"
        style={{ background: "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      >
        <div className="absolute inset-[24%] rounded-full border border-line" style={{ background: hslToHex(hue, SATURATION, light) }} />
        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_6px_rgba(0,0,0,0.8)]"
          style={{ left: `${50 + 44 * Math.sin((hue * Math.PI) / 180)}%`, top: `${50 - 44 * Math.cos((hue * Math.PI) / 180)}%` }}
        />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <span className="w-12 shrink-0 text-white/50">☀</span>
        <input
          type="range"
          min={2}
          max={70}
          value={Math.round(light * 100)}
          onChange={(e) => {
            const l = Number(e.target.value) / 100;
            setLight(l);
            emit(hue, l);
          }}
          className="h-1 flex-1 cursor-pointer accent-brand"
        />
        <span className="w-10 shrink-0 text-end text-white/50">{Math.round(light * 100)}%</span>
      </label>
    </div>
  );
}
