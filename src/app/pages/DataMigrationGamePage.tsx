import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';

/* ─────────── Types ─────────── */
interface Item {
  cost: number;
  count: number;
  clickInc: number;
  autoInc: number;
  multiplier: number;
  name: string;
  desc: string;
  icon: string;
}

interface BoxOnRail {
  id: number;
  startTime: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

type WorkerType = 'rookie' | 'veteran' | 'nightcrew';

interface AutoWorker {
  type: WorkerType;
  offset: number; // desync offset
}

/* ─────────── Constants ─────────── */
const TARGET_SCORE = 30_000;
const BOOKS_PER_BOX = 40;
const BOOK_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#fd79a8', '#a29bfe', '#00cec9'];

const SHELF_RIGHT = 92;
const BOX_X = 220;
const WORKER_START = 96;
const WORKER_END = 212;

function formatNum(n: number) { return Math.floor(n).toLocaleString('ko-KR'); }

const initialItems: Record<number, Item> = {
  1: { cost: 15, count: 0, clickInc: 1, autoInc: 0, multiplier: 1.4, name: '두꺼운 장갑 지급', desc: '클릭 파워 +1', icon: '🧤' },
  2: { cost: 80, count: 0, clickInc: 0, autoInc: 2, multiplier: 1.5, name: '신입 직원 채용', desc: '자동 이관 +2/초 (직원 추가!)', icon: '🧑‍💼' },
  3: { cost: 400, count: 0, clickInc: 8, autoInc: 0, multiplier: 1.6, name: 'L-카트 도입', desc: '클릭 파워 +8 (한 번에 여러 권!)', icon: '🛒' },
  4: { cost: 2000, count: 0, clickInc: 0, autoInc: 40, multiplier: 1.7, name: '베테랑 팀 배치', desc: '자동 이관 +40/초 (고속 직원!)', icon: '💪' },
  5: { cost: 5000, count: 0, clickInc: 0, autoInc: 150, multiplier: 1.9, name: '야간 특공대 편성', desc: '자동 이관 +150/초 (초고속!)', icon: '🌙' },
};

/* ─────────── Source Bookshelf (left) ─────────── */
function SourceBookshelf({ depletePercent }: { depletePercent: number }) {
  const totalSlots = 48;
  const remainSlots = Math.max(0, Math.floor(totalSlots * (1 - depletePercent / 100)));
  return (
    <g transform="translate(8, 16)">
      <rect x={0} y={0} width={82} height={108} fill="#5D4037" stroke="#3E2723" strokeWidth={2} rx={2} />
      <rect x={10} y={-10} width={62} height={14} fill="#3E2723" rx={3} />
      <text x={41} y={0} textAnchor="middle" fill="#f1c40f" fontSize={8} fontFamily="'NeoDunggeunmo', monospace">OLD 서가</text>
      {[0, 1, 2, 3].map(row => {
        const sy = 4 + row * 26;
        const rowStart = row * 12;
        const booksHere = Math.min(12, Math.max(0, remainSlots - rowStart));
        return (
          <g key={row}>
            <rect x={3} y={sy + 21} width={76} height={3} fill="#795548" />
            {Array.from({ length: booksHere }).map((_, i) => (
              <rect key={i} x={5 + i * 6} y={sy + 3} width={5} height={18}
                fill={BOOK_COLORS[(row * 12 + i) % BOOK_COLORS.length]}
                stroke="rgba(0,0,0,0.15)" strokeWidth={0.3} rx={0.5}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* ─────────── Packing Box ─────────── */
function PackingBox({ booksInBox }: { booksInBox: number }) {
  const capped = Math.min(booksInBox, BOOKS_PER_BOX);
  const fillRatio = capped / BOOKS_PER_BOX;
  return (
    <g transform={`translate(${BOX_X}, 58)`}>
      <rect x={0} y={8} width={48} height={56} fill="#C4A265" stroke="#8B6914" strokeWidth={1.5} rx={1} />
      <polygon points="48,8 56,2 56,58 48,64" fill="#A8893A" stroke="#8B6914" strokeWidth={0.8} />
      <polygon points="0,8 -3,2 20,0 24,8" fill="#D4B26A" stroke="#8B6914" strokeWidth={0.8} />
      <polygon points="24,8 28,0 56,2 48,8" fill="#CAAA5E" stroke="#8B6914" strokeWidth={0.8} />
      <rect x={10} y={22} width={28} height={20} fill="#DFC88A" stroke="#8B6914" strokeWidth={0.5} rx={1} />
      <text x={24} y={30} textAnchor="middle" fill="#5D4037" fontSize={5} fontFamily="'NeoDunggeunmo', monospace">BOOKS</text>
      <text x={24} y={38} textAnchor="middle" fill="#8B6914" fontSize={6} fontFamily="'NeoDunggeunmo', monospace">{capped}/{BOOKS_PER_BOX}</text>
      <rect x={3} y={48} width={42} height={4} fill="#A89060" rx={1} />
      <rect x={3} y={48} width={42 * fillRatio} height={4} fill="#2ecc71" rx={1} />
      <rect x={20} y={8} width={8} height={56} fill="rgba(200,180,120,0.3)" />
      <line x1={20} y1={36} x2={28} y2={36} stroke="#8B6914" strokeWidth={0.3} />
      <rect x={8} y={-8} width={32} height={10} fill="#8B6914" rx={2} />
      <text x={24} y={-1} textAnchor="middle" fill="#fff" fontSize={6} fontFamily="'NeoDunggeunmo', monospace">📦 BOX</text>
    </g>
  );
}

/* ─────────── Rail & exiting boxes ─────────── */
function RailAndBoxes({ exitingBoxes, now }: { exitingBoxes: BoxOnRail[]; now: number }) {
  const railStart = BOX_X + 58;
  return (
    <g>
      <rect x={railStart} y={108} width={530 - railStart - 10} height={6} fill="#7f8c8d" stroke="#555" strokeWidth={1} rx={2} />
      {Array.from({ length: Math.floor((530 - railStart - 10) / 20) }).map((_, i) => (
        <rect key={i} x={railStart + 5 + i * 20} y={106} width={4} height={10} fill="#95a5a6" rx={1} />
      ))}
      <polygon points={`${530 - 10},111 ${530},108 ${530},114`} fill="#f39c12" />
      <text x={530 - 8} y={104} fill="#f39c12" fontSize={7} fontFamily="'NeoDunggeunmo', monospace" textAnchor="end">OUT→</text>
      {exitingBoxes.map(box => {
        const elapsed = (now - box.startTime) / 1000;
        const xPos = railStart + elapsed * 140;
        if (xPos > 540) return null;
        const opacity = xPos > 480 ? Math.max(0, 1 - (xPos - 480) / 60) : 1;
        return (
          <g key={box.id} transform={`translate(${xPos}, 82)`} opacity={opacity}>
            <rect x={0} y={0} width={26} height={22} fill="#C4A265" stroke="#8B6914" strokeWidth={1} rx={1} />
            <polygon points="26,0 32,-3 32,19 26,22" fill="#A8893A" stroke="#8B6914" strokeWidth={0.5} />
            <rect x={9} y={-1} width={8} height={24} fill="rgba(200,180,120,0.4)" rx={0.5} />
            <rect x={0} y={8} width={26} height={6} fill="rgba(200,180,120,0.4)" rx={0.5} />
            <text x={13} y={14} textAnchor="middle" fill="#2ecc71" fontSize={9}>✓</text>
          </g>
        );
      })}
    </g>
  );
}

/* ─────────── Pixel Worker (with type-based appearance) ─────────── */
function PixelWorker({ xPos, facingRight, walking, hasBooks, bookCount, hasCart, workerType, walkPhase }: {
  xPos: number;
  facingRight: boolean;
  walking: boolean;
  hasBooks: boolean;
  bookCount: number;
  hasCart: boolean;
  workerType: 'main' | WorkerType;
  walkPhase: number;
}) {
  const walkCycle = walking ? Math.sin(walkPhase * Math.PI * 2) : 0;
  const bob = walking ? Math.abs(Math.sin(walkPhase * Math.PI * 2)) * 1.5 : 0;

  // Appearance by type
  let bodyColor: string;
  let vestColor: string;
  let hairColor: string;
  let skinColor = '#ffcc80';

  switch (workerType) {
    case 'main':
      bodyColor = '#2c3e50'; vestColor = '#2980b9'; hairColor = '#1a1a1a';
      break;
    case 'rookie':
      bodyColor = '#27ae60'; vestColor = '#2ecc71'; hairColor = '#5D4037';
      break;
    case 'veteran':
      bodyColor = '#c0392b'; vestColor = '#e74c3c'; hairColor = '#1a1a1a'; skinColor = '#e8b87a';
      break;
    case 'nightcrew':
      bodyColor = '#1a1a2e'; vestColor = '#2c2c54'; hairColor = '#0a0a0a'; skinColor = '#dbb98f';
      break;
  }

  return (
    <g transform={`translate(${xPos}, ${92 - bob})`}>
      <g transform={facingRight ? '' : `scale(-1,1) translate(-16,0)`}>
        {/* Shadow */}
        <ellipse cx={8} cy={32} rx={hasCart ? 16 : 8} ry={2} fill="rgba(0,0,0,0.25)" />

        {/* Cart */}
        {hasCart && hasBooks && (
          <g transform="translate(16, 8)">
            <rect x={0} y={12} width={24} height={14} fill="#7f8c8d" stroke="#555" strokeWidth={1} rx={2} />
            <rect x={-4} y={14} width={6} height={3} fill="#95a5a6" rx={1} />
            <rect x={2} y={14} width={20} height={10} fill="#95a5a6" rx={1} />
            {Array.from({ length: Math.min(bookCount, 6) }).map((_, i) => (
              <rect key={i} x={3 + (i % 3) * 6} y={14 + Math.floor(i / 3) * 4}
                width={5} height={4}
                fill={BOOK_COLORS[(i * 3) % BOOK_COLORS.length]}
                stroke="rgba(0,0,0,0.15)" strokeWidth={0.3} rx={0.3}
              />
            ))}
            <circle cx={5} cy={28} r={2.5} fill="#333" stroke="#555" strokeWidth={0.6} />
            <circle cx={19} cy={28} r={2.5} fill="#333" stroke="#555" strokeWidth={0.6} />
          </g>
        )}
        {hasCart && !hasBooks && (
          <g transform="translate(-26, 8)">
            <rect x={0} y={12} width={24} height={14} fill="#7f8c8d" stroke="#555" strokeWidth={1} rx={2} />
            <rect x={22} y={14} width={6} height={3} fill="#95a5a6" rx={1} />
            <rect x={2} y={14} width={20} height={10} fill="#95a5a6" rx={1} />
            <circle cx={5} cy={28} r={2.5} fill="#333" stroke="#555" strokeWidth={0.6} />
            <circle cx={19} cy={28} r={2.5} fill="#333" stroke="#555" strokeWidth={0.6} />
          </g>
        )}

        {/* Legs */}
        <rect x={3} y={22} width={4} height={9 + walkCycle * 1.5} fill="#2c3e50" rx={1} />
        <rect x={9} y={22} width={4} height={9 - walkCycle * 1.5} fill="#2c3e50" rx={1} />
        <rect x={2} y={30 + walkCycle * 1.5} width={6} height={3} fill="#1a1a1a" rx={1} />
        <rect x={8} y={30 - walkCycle * 1.5} width={6} height={3} fill="#1a1a1a" rx={1} />

        {/* Body */}
        <rect x={1} y={12} width={14} height={12} fill={bodyColor} rx={2} />
        {/* Vest/Apron */}
        <rect x={3} y={12} width={10} height={11} fill={vestColor} rx={1} />

        {/* Type-specific body details */}
        {workerType === 'main' && (
          <>
            {/* Name tag */}
            <rect x={4} y={14} width={8} height={4} fill="#fff" rx={0.5} />
            <rect x={5} y={15} width={6} height={1} fill="#ddd" />
            <rect x={5} y={17} width={4} height={0.5} fill="#ddd" />
          </>
        )}
        {workerType === 'rookie' && (
          <>
            {/* "NEW" badge */}
            <rect x={3} y={13} width={10} height={5} fill="#f1c40f" rx={1} stroke="#e67e22" strokeWidth={0.3} />
            <text x={8} y={17} textAnchor="middle" fill="#c0392b" fontSize={3.5} fontFamily="'NeoDunggeunmo', monospace">NEW</text>
          </>
        )}
        {workerType === 'veteran' && (
          <>
            {/* Star badge */}
            <polygon points="8,13 9,16 12,16 9.5,18 10.5,21 8,19 5.5,21 6.5,18 4,16 7,16" fill="#f1c40f" stroke="#e67e22" strokeWidth={0.3} />
            {/* Muscular arms (thicker) */}
          </>
        )}
        {workerType === 'nightcrew' && (
          <>
            {/* Moon emblem on vest */}
            <circle cx={8} cy={17} r={3} fill="#1a1a2e" stroke="#f1c40f" strokeWidth={0.5} />
            <circle cx={9.5} cy={16.5} r={2.5} fill="#2c2c54" /> {/* crescent effect */}
            {/* Reflective stripes */}
            <rect x={3} y={21} width={10} height={1} fill="#f1c40f" opacity={0.8} rx={0.3} />
          </>
        )}

        {/* Arms */}
        {hasBooks ? (
          hasCart ? (
            <>
              <rect x={14} y={16} width={6} height={3} fill={skinColor} rx={1} />
              <rect x={-3} y={15} width={4} height={6} fill={skinColor} rx={1} />
            </>
          ) : (
            <>
              <rect x={-4} y={14} width={5} height={3} fill={skinColor} rx={1} />
              <rect x={15} y={14} width={5} height={3} fill={skinColor} rx={1} />
              <g transform="translate(-6, 4)">
                {Array.from({ length: Math.min(bookCount, 5) }).map((_, i) => (
                  <rect key={i} x={0} y={8 - i * 3} width={28} height={3}
                    fill={BOOK_COLORS[(i * 3) % BOOK_COLORS.length]}
                    stroke="rgba(0,0,0,0.2)" strokeWidth={0.3} rx={0.5}
                  />
                ))}
              </g>
            </>
          )
        ) : (
          <>
            {/* Arms thickness varies by type */}
            <rect x={-3} y={14 + (walking ? walkCycle * 2 : 0)} width={workerType === 'veteran' ? 5 : 4} height={7} fill={skinColor} rx={1} />
            <rect x={workerType === 'veteran' ? 14 : 15} y={14 - (walking ? walkCycle * 2 : 0)} width={workerType === 'veteran' ? 5 : 4} height={7} fill={skinColor} rx={1} />
          </>
        )}

        {/* Head */}
        <rect x={2} y={2} width={12} height={11} fill={skinColor} rx={3} />

        {/* Type-specific head gear */}
        {workerType === 'main' && (
          <rect x={1} y={1} width={14} height={5} fill={hairColor} rx={2} />
        )}
        {workerType === 'rookie' && (
          <>
            {/* Neat short hair */}
            <rect x={1} y={1} width={14} height={5} fill={hairColor} rx={2} />
            {/* Cap */}
            <rect x={0} y={-1} width={16} height={4} fill="#2ecc71" rx={2} />
            <rect x={0} y={2} width={18} height={2} fill="#27ae60" rx={1} />
          </>
        )}
        {workerType === 'veteran' && (
          <>
            {/* Short buzz cut */}
            <rect x={2} y={1} width={12} height={3} fill={hairColor} rx={1} />
            {/* Headband (red) */}
            <rect x={0} y={3} width={16} height={3} fill="#e74c3c" rx={1} />
            {/* Headband knot on back */}
            <rect x={14} y={2} width={5} height={2} fill="#c0392b" rx={1} />
            <rect x={14} y={5} width={4} height={2} fill="#c0392b" rx={1} />
          </>
        )}
        {workerType === 'nightcrew' && (
          <>
            <rect x={1} y={1} width={14} height={5} fill={hairColor} rx={2} />
            {/* Night vision goggles / tactical helmet */}
            <rect x={-1} y={-2} width={18} height={6} fill="#2c3e50" rx={2} />
            {/* Goggle lenses */}
            <circle cx={5} cy={1} r={2.5} fill="#1a1a1a" stroke="#3498db" strokeWidth={0.5} />
            <circle cx={11} cy={1} r={2.5} fill="#1a1a1a" stroke="#3498db" strokeWidth={0.5} />
            {/* Green glow on lenses */}
            <circle cx={5} cy={1} r={1.2} fill="#2ecc71" opacity={0.6} />
            <circle cx={11} cy={1} r={1.2} fill="#2ecc71" opacity={0.6} />
            {/* Chin strap */}
            <line x1={0} y1={4} x2={2} y2={10} stroke="#2c3e50" strokeWidth={0.8} />
            <line x1={16} y1={4} x2={14} y2={10} stroke="#2c3e50" strokeWidth={0.8} />
          </>
        )}

        {/* Eyes (hidden for nightcrew due to goggles) */}
        {workerType !== 'nightcrew' && (
          <>
            <rect x={5} y={6} width={2} height={2} fill="#333" rx={0.5} />
            <rect x={9} y={6} width={2} height={2} fill="#333" rx={0.5} />
          </>
        )}

        {/* Mouth */}
        {hasBooks ? (
          workerType === 'veteran' ? (
            // Veteran grits teeth
            <rect x={6} y={10} width={4} height={1.5} fill="#fff" stroke="#333" strokeWidth={0.3} rx={0.3} />
          ) : (
            <path d="M6,10 L10,10" stroke="#333" strokeWidth={0.7} />
          )
        ) : walking ? (
          <path d="M6,10 Q8,11.5 10,10" stroke="#c0392b" strokeWidth={0.6} fill="none" />
        ) : (
          <rect x={7} y={10} width={2} height={1} fill="#c0392b" rx={0.3} />
        )}

        {/* Sweat */}
        {hasBooks && walking && (
          <>
            <circle cx={14} cy={4 + Math.sin(walkPhase * 20) * 2} r={1.2} fill="#87CEEB" opacity={0.8} />
            {workerType === 'rookie' && (
              // Rookies sweat more
              <circle cx={-1} cy={6 + Math.sin(walkPhase * 20 + 1) * 2} r={1} fill="#87CEEB" opacity={0.7} />
            )}
          </>
        )}

        {/* Veteran: afterimage speed lines when walking */}
        {workerType === 'veteran' && walking && (
          <>
            <line x1={-6} y1={16} x2={-12} y2={16} stroke="rgba(231,76,60,0.4)" strokeWidth={1} />
            <line x1={-6} y1={20} x2={-10} y2={20} stroke="rgba(231,76,60,0.3)" strokeWidth={0.8} />
          </>
        )}

        {/* Nightcrew: faint glow aura */}
        {workerType === 'nightcrew' && walking && (
          <circle cx={8} cy={16} r={14} fill="rgba(46,204,113,0.06)" />
        )}
      </g>
    </g>
  );
}

/* ─────────── Main Component ─────────── */
export default function DataMigrationGamePage() {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoPower, setAutoPower] = useState(0);
  const [items, setItems] = useState<Record<number, Item>>(() => JSON.parse(JSON.stringify(initialItems)));
  const [booksInBox, setBooksInBox] = useState(0);
  const [exitingBoxes, setExitingBoxes] = useState<BoxOnRail[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [now, setNow] = useState(Date.now());
  const [autoWorkers, setAutoWorkers] = useState<AutoWorker[]>([]);

  // Main worker: 'idle' | 'toBox' | 'placing' | 'returning'
  const [mainWorkerState, setMainWorkerState] = useState<'idle' | 'toBox' | 'placing' | 'returning'>('idle');
  const [mainWorkerTripStart, setMainWorkerTripStart] = useState(0);
  const clickQueueRef = useRef(0);
  const TRIP_SPEED = 400; // much faster!

  const AUTO_TRIP_SPEED = 700;

  const boxIdRef = useRef(0);
  const floatIdRef = useRef(0);
  const scoreRef = useRef(0);
  const autoPowerRef = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { autoPowerRef.current = autoPower; }, [autoPower]);

  // Animation frame
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      setNow(Date.now());
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Main worker state machine
  useEffect(() => {
    if (mainWorkerState === 'idle') return;
    const elapsed = now - mainWorkerTripStart;

    if (mainWorkerState === 'toBox' && elapsed >= TRIP_SPEED * 0.4) {
      setMainWorkerState('placing');
    } else if (mainWorkerState === 'placing' && elapsed >= TRIP_SPEED * 0.5) {
      setMainWorkerState('returning');
    } else if (mainWorkerState === 'returning' && elapsed >= TRIP_SPEED) {
      if (clickQueueRef.current > 0) {
        clickQueueRef.current--;
        setMainWorkerTripStart(Date.now());
        setMainWorkerState('toBox');
      } else {
        setMainWorkerState('idle');
      }
    }
  }, [now, mainWorkerState, mainWorkerTripStart]);

  // Box overflow check
  const shipBox = useCallback(() => {
    const id = boxIdRef.current++;
    setExitingBoxes(prev => [...prev, { id, startTime: Date.now() }]);
    setTimeout(() => {
      setExitingBoxes(prev => prev.filter(b => b.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    if (booksInBox >= BOOKS_PER_BOX) {
      shipBox();
      setBooksInBox(prev => prev - BOOKS_PER_BOX);
    }
  }, [booksInBox, shipBox]);

  // Auto income
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoPowerRef.current > 0) {
        setScore(prev => prev + autoPowerRef.current);
        setBooksInBox(prev => prev + autoPowerRef.current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    setScore(prev => prev + clickPower);
    setBooksInBox(prev => prev + clickPower);

    if (mainWorkerState === 'idle') {
      setMainWorkerTripStart(Date.now());
      setMainWorkerState('toBox');
    } else {
      clickQueueRef.current++;
    }

    const fid = floatIdRef.current++;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFloatingTexts(prev => [...prev, {
      id: fid,
      x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 30,
      y: rect.top - 10,
      text: `+${formatNum(clickPower)}`,
    }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== fid)), 1200);
  }, [clickPower, mainWorkerState]);

  const buyItem = useCallback((itemId: number) => {
    setItems(prev => {
      const item = prev[itemId];
      if (scoreRef.current < item.cost) return prev;
      setScore(s => s - item.cost);
      setClickPower(cp => cp + item.clickInc);
      setAutoPower(ap => ap + item.autoInc);

      if (itemId === 2) {
        setAutoWorkers(ws => [...ws, { type: 'rookie', offset: Math.random() * AUTO_TRIP_SPEED }]);
      } else if (itemId === 4) {
        setAutoWorkers(ws => [...ws,
          { type: 'veteran', offset: Math.random() * AUTO_TRIP_SPEED },
          { type: 'veteran', offset: Math.random() * AUTO_TRIP_SPEED },
        ]);
      } else if (itemId === 5) {
        setAutoWorkers(ws => [...ws,
          { type: 'nightcrew', offset: Math.random() * AUTO_TRIP_SPEED },
          { type: 'nightcrew', offset: Math.random() * AUTO_TRIP_SPEED },
          { type: 'nightcrew', offset: Math.random() * AUTO_TRIP_SPEED },
        ]);
      }

      return { ...prev, [itemId]: { ...item, count: item.count + 1, cost: Math.floor(item.cost * item.multiplier) } };
    });
  }, []);

  // Main worker position
  const getMainWorkerProps = () => {
    if (mainWorkerState === 'idle') {
      return { xPos: WORKER_START, facingRight: true, walking: false, hasBooks: false, walkPhase: 0 };
    }
    const elapsed = now - mainWorkerTripStart;
    const tripProgress = Math.min(1, elapsed / TRIP_SPEED);

    if (tripProgress <= 0.4) {
      const p = tripProgress / 0.4;
      return { xPos: WORKER_START + (WORKER_END - WORKER_START) * p, facingRight: true, walking: true, hasBooks: true, walkPhase: elapsed / 60 };
    } else if (tripProgress <= 0.5) {
      return { xPos: WORKER_END, facingRight: true, walking: false, hasBooks: false, walkPhase: 0 };
    } else {
      const p = (tripProgress - 0.5) / 0.5;
      return { xPos: WORKER_END - (WORKER_END - WORKER_START) * p, facingRight: false, walking: true, hasBooks: false, walkPhase: elapsed / 60 };
    }
  };

  // Auto worker position
  const getAutoWorkerProps = (worker: AutoWorker) => {
    const elapsed = ((now + worker.offset) % AUTO_TRIP_SPEED);
    const tripProgress = elapsed / AUTO_TRIP_SPEED;

    if (tripProgress <= 0.4) {
      const p = tripProgress / 0.4;
      return { xPos: WORKER_START + (WORKER_END - WORKER_START) * p, facingRight: true, walking: true, hasBooks: true, walkPhase: elapsed / 60 };
    } else if (tripProgress <= 0.5) {
      return { xPos: WORKER_END, facingRight: true, walking: false, hasBooks: false, walkPhase: 0 };
    } else {
      const p = (tripProgress - 0.5) / 0.5;
      return { xPos: WORKER_END - (WORKER_END - WORKER_START) * p, facingRight: false, walking: true, hasBooks: false, walkPhase: elapsed / 60 };
    }
  };

  const percentage = Math.min((score / TARGET_SCORE) * 100, 100);
  const totalShipped = Math.floor(score / BOOKS_PER_BOX);
  const hasCart = items[3].count > 0;
  const mainW = getMainWorkerProps();

  return (
    <div className="h-full w-full flex flex-col items-center overflow-auto relative"
      style={{ background: '#1a1a2e', fontFamily: "'NeoDunggeunmo', 'Malgun Gothic', 'Courier New', monospace", color: '#d4d4d4', userSelect: 'none' }}>
      <link href="https://cdn.jsdelivr.net/gh/neodunggeunmo/neodunggeunmo/style.css" rel="stylesheet" />

      {/* Starry bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={`star-${i}`} className="absolute rounded-full"
            style={{
              width: 1 + (i * 7) % 3, height: 1 + (i * 7) % 3,
              left: `${(i * 37 + 13) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
              background: '#fff', opacity: 0.15 + ((i * 17) % 30) / 100,
              animation: `twinkle ${2 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.7) % 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full py-5 px-4 gap-3 max-w-[900px]">
        <button onClick={() => navigate('/')} className="absolute top-3 left-3 cursor-pointer"
          style={{ background: '#222', border: '3px solid #fff', boxShadow: '3px 3px 0 #555', color: '#fff', padding: '4px 12px', fontFamily: 'inherit', fontSize: '0.85rem' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#444'; }} onMouseLeave={e => { e.currentTarget.style.background = '#222'; }}>
          ← 돌아가기
        </button>

        <div className="text-center mt-4">
          <h1 style={{ color: '#f1c40f', margin: 0, textShadow: '3px 3px 0 #d35400', fontSize: '1.4rem' }}>📚 데이터 이관 대작전</h1>
          <p style={{ color: '#bdc3c7', fontSize: '0.85rem', margin: '4px 0 0' }}>서가에서 책을 꺼내 박스에 담아 출하하세요!</p>
        </div>

        {/* Progress */}
        <div style={{ background: '#000', border: '3px solid #fff', boxShadow: '3px 3px 0 #555', padding: '8px 14px', width: '100%', textAlign: 'center' }}>
          <div style={{ color: '#2ecc71', fontSize: '0.9rem', marginBottom: 4 }}>
            이관 진행률: {formatNum(score)} / {formatNum(TARGET_SCORE)} 권 ({percentage.toFixed(2)}%)
            <span style={{ color: '#f39c12', marginLeft: 12, fontSize: '0.8rem' }}>📦 출하 박스: {totalShipped}개</span>
          </div>
          <div style={{ width: '100%', height: 18, background: '#333', border: '3px solid #fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percentage}%`, transition: 'width 0.3s', background: 'repeating-linear-gradient(45deg, #27ae60, #27ae60 8px, #2ecc71 8px, #2ecc71 16px)' }} />
          </div>
        </div>

        {/* Warehouse Scene */}
        <div style={{ width: '100%', height: 180, background: '#000', border: '3px solid #fff', boxShadow: '3px 3px 0 #555', position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 530 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="floor" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#3d2b1f" />
                <rect x="8" y="0" width="8" height="8" fill="#4a3728" />
                <rect x="0" y="8" width="8" height="8" fill="#4a3728" />
                <rect x="8" y="8" width="8" height="8" fill="#3d2b1f" />
              </pattern>
            </defs>
            <rect x={0} y={120} width={530} height={30} fill="url(#floor)" />
            <rect x={0} y={0} width={530} height={120} fill="#2c1810" opacity={0.5} />

            <rect x={220} y={4} width={120} height={16} fill="#3E2723" stroke="#fff" strokeWidth={1} rx={3} />
            <text x={280} y={15} textAnchor="middle" fill="#f1c40f" fontSize={9} fontFamily="'NeoDunggeunmo', monospace">
              📦 데이터 물류 창고
            </text>

            <SourceBookshelf depletePercent={percentage} />
            <PackingBox booksInBox={booksInBox % BOOKS_PER_BOX} />
            <RailAndBoxes exitingBoxes={exitingBoxes} now={now} />

            {/* Main worker */}
            <PixelWorker
              xPos={mainW.xPos} facingRight={mainW.facingRight} walking={mainW.walking}
              hasBooks={mainW.hasBooks} bookCount={Math.min(clickPower, 5)}
              hasCart={hasCart} workerType="main" walkPhase={mainW.walkPhase}
            />

            {/* Auto workers */}
            {autoWorkers.map((w, i) => {
              const aw = getAutoWorkerProps(w);
              const yOff = (i % 4) * 3;
              return (
                <g key={`auto-${i}`} transform={`translate(0, ${yOff})`}>
                  <PixelWorker
                    xPos={aw.xPos} facingRight={aw.facingRight} walking={aw.walking}
                    hasBooks={aw.hasBooks} bookCount={2}
                    hasCart={hasCart} workerType={w.type} walkPhase={aw.walkPhase}
                  />
                </g>
              );
            })}

            {/* Legend */}
            <text x={280} y={145} textAnchor="middle" fill="#aaa" fontSize={7} fontFamily="'NeoDunggeunmo', monospace">
              직원: {1 + autoWorkers.length}명 | 박스 적재: {booksInBox % BOOKS_PER_BOX}/{BOOKS_PER_BOX}
            </text>
          </svg>
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full">
          <div style={{ background: '#000', border: '3px solid #fff', boxShadow: '3px 3px 0 #555', padding: 14, flex: '0 0 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ color: '#2ecc71', fontSize: '1.3rem', textShadow: '2px 2px 0 #145a32' }}>
              {formatNum(score)}<span style={{ fontSize: '0.75rem', color: '#7f8c8d', marginLeft: 3 }}>권</span>
            </div>
            <button onClick={handleClick} className="cursor-pointer active:translate-y-[6px]"
              style={{ background: '#e74c3c', color: 'white', border: '4px solid #fff', boxShadow: '0 6px 0 #c0392b', padding: '12px 8px', fontSize: '1rem', fontFamily: 'inherit', width: '100%', transition: 'transform 0.05s' }}>
              📚 서가에서 꺼내기<br />(CLICK!)
            </button>
            <div style={{ color: '#f1c40f', lineHeight: 1.5, textAlign: 'center', fontSize: '0.8rem' }}>
              클릭: <span style={{ color: '#2ecc71' }}>{formatNum(clickPower)}</span> 권<br />
              자동: <span style={{ color: '#3498db' }}>{formatNum(autoPower)}</span> 권/초
            </div>
          </div>

          <div style={{ background: '#000', border: '3px solid #fff', boxShadow: '3px 3px 0 #555', padding: 10, flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ color: '#3498db', borderBottom: '2px dashed #fff', paddingBottom: 4, textAlign: 'center', fontSize: '0.95rem' }}>
              🔧 물류 업그레이드
            </div>
            {[1, 2, 3, 4, 5].map(id => {
              const item = items[id];
              const canBuy = score >= item.cost;
              return (
                <button key={id} onClick={() => buyItem(id)} disabled={!canBuy} className="cursor-pointer"
                  style={{
                    background: canBuy ? '#1a1a2e' : '#111', border: `2px solid ${canBuy ? '#fff' : '#444'}`,
                    color: canBuy ? '#fff' : '#555', padding: '5px 8px', fontFamily: 'inherit',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                    cursor: canBuy ? 'pointer' : 'not-allowed', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (canBuy) e.currentTarget.style.background = '#2a2a4e'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = canBuy ? '#1a1a2e' : '#111'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: canBuy ? '#f1c40f' : '#555', fontSize: '0.8rem' }}>{item.name}</span>
                      <span style={{ fontSize: '0.65rem', color: '#888', marginTop: 1 }}>{item.desc}</span>
                      <span style={{ color: '#e74c3c', fontSize: '0.7rem', marginTop: 1 }}>비용: {formatNum(item.cost)} 권</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem', color: '#3498db', minWidth: 24, textAlign: 'center' }}>{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating texts */}
      {floatingTexts.map(ft => (
        <div key={ft.id} className="fixed pointer-events-none"
          style={{ left: ft.x, top: ft.y, color: '#2ecc71', fontWeight: 700, fontSize: '18px',
            fontFamily: "'NeoDunggeunmo', monospace", textShadow: '2px 2px 0 #000',
            animation: 'floatUp 1.2s ease-out forwards', zIndex: 100 }}>
          {ft.text}
        </div>
      ))}

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-25px) scale(1.15); }
          100% { opacity: 0; transform: translateY(-55px) scale(0.8); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}