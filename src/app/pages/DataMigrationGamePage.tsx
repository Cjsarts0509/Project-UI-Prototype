import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { StarConnection } from '../components/StarConnection';

interface Item {
  cost: number;
  count: number;
  clickInc: number;
  autoInc: number;
  multiplier: number;
  name: string;
  desc: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

const initialItems: Record<number, Item> = {
  1: { cost: 20, count: 0, clickInc: 1, autoInc: 0, multiplier: 1.5, name: '마우스 광클 연습', desc: '클릭 시 +1 Byte 추가' },
  2: { cost: 100, count: 0, clickInc: 0, autoInc: 2, multiplier: 1.6, name: '신입 사원 투입', desc: '초당 +2 Byte 자동 이관' },
  3: { cost: 500, count: 0, clickInc: 10, autoInc: 0, multiplier: 1.7, name: 'Metabase 쿼리 튜닝', desc: '클릭 시 +10 Byte 추가' },
  4: { cost: 2500, count: 0, clickInc: 0, autoInc: 50, multiplier: 1.8, name: '로마식 행정 시스템 도입', desc: '초당 +50 Byte 자동 이관' },
  5: { cost: 10000, count: 0, clickInc: 0, autoInc: 300, multiplier: 2.0, name: '9회말 2아웃 역전의 집중력', desc: '초당 +300 Byte 자동 이관' },
};

function formatNumber(num: number) {
  return Math.floor(num).toLocaleString('ko-KR');
}

export default function DataMigrationGamePage() {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoPower, setAutoPower] = useState(0);
  const [items, setItems] = useState<Record<number, Item>>(() =>
    JSON.parse(JSON.stringify(initialItems))
  );
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const floatIdRef = useRef(0);
  const scoreRef = useRef(0);
  const autoPowerRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { autoPowerRef.current = autoPower; }, [autoPower]);

  // Auto income every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoPowerRef.current > 0) {
        setScore(prev => prev + autoPowerRef.current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    setScore(prev => prev + clickPower);
    const id = floatIdRef.current++;
    setFloatingTexts(prev => [...prev, {
      id,
      x: e.clientX,
      y: e.clientY - 20,
      text: `+${formatNumber(clickPower)}`,
    }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== id));
    }, 1000);
  }, [clickPower]);

  const buyItem = useCallback((itemId: number) => {
    setItems(prev => {
      const item = prev[itemId];
      if (scoreRef.current < item.cost) return prev;

      setScore(s => s - item.cost);
      setClickPower(cp => cp + item.clickInc);
      setAutoPower(ap => ap + item.autoInc);

      return {
        ...prev,
        [itemId]: {
          ...item,
          count: item.count + 1,
          cost: Math.floor(item.cost * item.multiplier),
        },
      };
    });
  }, []);

  return (
    <div
      className="h-full w-full flex flex-col items-center overflow-auto relative"
      style={{
        background: '#0d1117',
        fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
        color: '#d4d4d4',
        userSelect: 'none',
      }}
    >
      {/* Star background */}
      <StarConnection />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center w-full py-10 px-5">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 px-3 py-1.5 rounded text-[12px] cursor-pointer transition-colors"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#8b949e',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#e6edf3'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#8b949e'; }}
        >
          ← 돌아가기
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[24px] m-0 mb-2" style={{ color: '#569cd6', fontWeight: 700 }}>
            🗂️ 데이터 수동 이관 대작전
          </h1>
          <p className="text-[14px]" style={{ color: '#9cdcfe' }}>
            기다리기 지루하신가요? 시스템 통합을 위해 데이터를 수동으로 옮겨주세요!
          </p>
        </div>

        {/* Game container */}
        <div
          className="flex gap-12 p-8 rounded-xl"
          style={{
            background: 'rgba(37, 37, 38, 0.85)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Left: Click area */}
          <div className="flex flex-col items-center" style={{ minWidth: 300 }}>
            <div className="text-[32px] mb-5" style={{ fontWeight: 700, color: '#4ec9b0' }}>
              {formatNumber(score)} <span className="text-[20px]" style={{ color: '#8b949e' }}>Byte</span>
            </div>

            <button
              onClick={handleClick}
              className="rounded-full cursor-pointer transition-transform active:scale-95"
              style={{
                width: 150,
                height: 150,
                background: 'linear-gradient(135deg, #007acc, #005f9e)',
                color: 'white',
                border: 'none',
                fontSize: '1.2rem',
                fontWeight: 700,
                boxShadow: '0 5px 20px rgba(0, 122, 204, 0.4), 0 0 40px rgba(0, 122, 204, 0.1)',
              }}
            >
              데이터 이관<br />(Click!)
            </button>

            <div className="mt-5 text-center text-[14px]" style={{ color: '#c586c0', lineHeight: 1.8 }}>
              클릭 파워: <span style={{ color: '#4ec9b0', fontWeight: 700 }}>{formatNumber(clickPower)}</span> Byte/클릭<br />
              자동 이관: <span style={{ color: '#4ec9b0', fontWeight: 700 }}>{formatNumber(autoPower)}</span> Byte/초
            </div>
          </div>

          {/* Right: Store */}
          <div className="flex flex-col gap-2.5" style={{ minWidth: 350 }}>
            <div
              className="text-[16px] text-center pb-2.5 mb-2.5"
              style={{ color: '#ce9178', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 700 }}
            >
              ⚡ 업그레이드 센터
            </div>

            {[1, 2, 3, 4, 5].map(id => {
              const item = items[id];
              const canBuy = score >= item.cost;
              return (
                <button
                  key={id}
                  onClick={() => buyItem(id)}
                  disabled={!canBuy}
                  className="flex justify-between items-center p-4 rounded-lg cursor-pointer text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: canBuy ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${canBuy ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                    color: '#d4d4d4',
                  }}
                  onMouseEnter={e => { if (canBuy) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = canBuy ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'; }}
                >
                  <div className="flex flex-col">
                    <span className="text-[14px]" style={{ fontWeight: 700, color: '#dcdcaa' }}>{item.name}</span>
                    <span className="text-[12px] mt-1" style={{ color: '#808080' }}>{item.desc}</span>
                    <span className="text-[12px] mt-1" style={{ fontWeight: 700, color: '#f44336' }}>
                      비용: {formatNumber(item.cost)} Byte
                    </span>
                  </div>
                  <span className="text-[18px] ml-4" style={{ fontWeight: 700, color: '#569cd6' }}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating texts */}
      {floatingTexts.map(ft => (
        <div
          key={ft.id}
          className="fixed pointer-events-none"
          style={{
            left: ft.x,
            top: ft.y,
            color: '#4ec9b0',
            fontWeight: 700,
            fontSize: '16px',
            animation: 'floatUp 1s ease-out forwards',
            zIndex: 100,
          }}
        >
          {ft.text}
        </div>
      ))}

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
      `}</style>
    </div>
  );
}
