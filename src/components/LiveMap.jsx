import { useMemo } from 'react';
import { RIDE_TYPES } from '../data/mock';

const W = 640;
const H = 340;
const CELL = 40;

const typeColor = Object.fromEntries(RIDE_TYPES.map((t) => [t.id, t.color]));

/**
 * Stylised city map with animated driver dots (pure SVG + SMIL, no map SDK).
 * Positions are derived from each driver's index so they stay stable between renders.
 */
export default function LiveMap({ drivers }) {
  const online = useMemo(() => drivers.filter((d) => d.status === 'online'), [drivers]);

  const blocks = useMemo(() => {
    const out = [];
    for (let i = 0; i < W / CELL; i++) {
      for (let j = 0; j < H / CELL + 1; j++) {
        const h = (i * 73 + j * 31 + i * j * 7) % 11;
        out.push({ x: i * CELL, y: j * CELL, park: h === 0 });
      }
    }
    return out;
  }, []);

  const riverPath = useMemo(() => {
    const pts = [];
    for (let y = -20; y <= H + 20; y += 10) {
      pts.push(`${pts.length ? 'L' : 'M'}${(48 + Math.sin(y / 38) * 22).toFixed(1)} ${y}`);
    }
    return pts.join(' ');
  }, []);

  const loops = useMemo(
    () =>
      online.slice(0, 22).map((d, i) => {
        const x0 = ((i * 5) % 12 + 2) * CELL;
        const y0 = ((i * 3) % 5 + 1) * CELL;
        const w = (i % 3) + 2;
        const h = ((i + 1) % 3) + 1;
        const x1 = Math.min(x0 + w * CELL, W - CELL);
        const y1 = Math.min(y0 + h * CELL, H - CELL);
        return {
          id: d.id,
          color: typeColor[d.typeId] || '#4f46e5',
          path: `M${x0} ${y0} H${x1} V${y1} H${x0} Z`,
          dur: 16 + ((i * 7) % 18),
          begin: -((i * 5) % 16),
        };
      }),
    [online],
  );

  const hotspots = [
    { x: 330, y: 120, r: 54, label: 'Park Street' },
    { x: 520, y: 80, r: 44, label: 'Salt Lake' },
    { x: 200, y: 250, r: 40, label: 'Gariahat' },
  ];

  return (
    <div className="livemap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Live driver positions">
        <rect width={W} height={H} fill="var(--map-land)" />
        {blocks.map((b) => (
          <rect
            key={`${b.x}-${b.y}`}
            x={b.x + 3}
            y={b.y + 3}
            width={CELL - 6}
            height={CELL - 6}
            rx={7}
            fill={b.park ? 'var(--map-park)' : 'var(--map-block)'}
          />
        ))}
        {Array.from({ length: W / CELL + 1 }, (_, i) => (
          <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H} stroke="var(--map-road)" strokeWidth={i % 4 === 0 ? 9 : 5} />
        ))}
        {Array.from({ length: H / CELL + 2 }, (_, j) => (
          <line key={`h${j}`} x1={0} y1={j * CELL} x2={W} y2={j * CELL} stroke="var(--map-road)" strokeWidth={j % 4 === 0 ? 9 : 5} />
        ))}

        <path d={riverPath} fill="none" stroke="var(--map-water)" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />

        {hotspots.map((h) => (
          <g key={h.label}>
            <circle cx={h.x} cy={h.y} r={h.r} fill="#ef4444" opacity="0.12">
              <animate attributeName="r" values={`${h.r - 8};${h.r + 8};${h.r - 8}`} dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.18;0.06;0.18" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx={h.x} cy={h.y} r={h.r / 2.4} fill="#ef4444" opacity="0.16" />
          </g>
        ))}

        {loops.map((l) => (
          <g key={l.id}>
            <circle r="9" fill={l.color} opacity="0.22">
              <animateMotion dur={`${l.dur}s`} begin={`${l.begin}s`} repeatCount="indefinite" path={l.path} />
            </circle>
            <circle r="4.6" fill={l.color} stroke="#fff" strokeWidth="1.8">
              <animateMotion dur={`${l.dur}s`} begin={`${l.begin}s`} repeatCount="indefinite" path={l.path} />
            </circle>
          </g>
        ))}
      </svg>

      <div className="map-legend">
        {RIDE_TYPES.map((t) => (
          <span key={t.id}>
            <i style={{ background: t.color }} />
            {t.name.replace('Raahi ', '')}
          </span>
        ))}
        <span>
          <i className="hot" />
          High demand
        </span>
      </div>
    </div>
  );
}
