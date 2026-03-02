import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { StarConnection } from './StarConnection';

const messages = [
            "개발자가 커피를 수혈받고 있습니다...",
            "숨어있는 버그와 치열하게 면담 중...",
            "디자이너가 픽셀을 장인정신으로 깎는 중...",
            "서버에 시원한 물을 주는 중... (뿌리지 마세요)",
            "오픈 준비율: (개발자 뇌피셜) 99.9%",
            "앗, 내가 방금 무슨 코드를 지운 거지?",
            "기대하셔도 좋습니다. 아마도요.",
            "데이터베이스를 예쁘게 정리하는 중...",
            "키보드 샷건 수리 중...",
            "대표님 몰래 농땡이... 아니 열일 중입니다.",
            "기획서_최종_진짜최종_이게마지막.pptx",
            "개발자님, 이거 간단한 거 맞죠? (아님)",
            "대표님, 그 기능은 이번 페이즈에 없습니다...",
            "시스템 통합은 언제나 짜릿해. 늘 새로워.",
            "Metabase SQL 쿼리 짜다가 눈물 흘리는 중...",
            "신구 시스템 마이그레이션은 왜 이리 험난한가",
            "어? 제 PC에선 잘 되는데요?",
            "로그아웃 버튼보다 퇴근 버튼이 시급합니다.",
            "새로고침 백 번 한다고 서버가 살아나진 않습니다.",
            "임시 사무실은 상암? 합정? 아니, 내 방이었으면...",
            "오늘 점심 뭐 먹지? (직장인 최대 난제)",
            "아, 그거 어제까지였나요?",
            "회의를 위한 회의를 준비하는 회의 중...",
            "넵. 넵! 네넵. 넹. (직장인 대답 4단 변화)",
            "반려견보다 반려된 기획서가 더 많습니다.",
            "퇴근 시간은 빛보다 빠르게, 출근 시간은 중력보다 무겁게.",
            "월급은 통장을 스칠 뿐.",
            "피할 수 없다면 수당을 받아라.",
            "일찍 일어나는 새가 피곤하다.",
            "보스는 지시하고 리더는 함께한다지만, 나는 집에 가고 싶다.",
            "칭찬은 고래를 춤추게 하고, 야근은 직장인을 미치게 한다.",
            "'나중에 할게요' = '안 하겠습니다'",
            "저장 단축키(Ctrl+S)는 숨 쉬듯이 눌러라.",
            "백업을 안 한 자, 모든 것을 잃으리라.",
            "출근하자마자 퇴근하고 싶다.",
            "중요한 것은 꺾이지 않는 퇴근 의지.",
            "세상에서 가장 가난한 왕은? 최저임금.",
            "신이 화나면? 신발끈.",
            "화장실에서 방금 나온 사람은? 일본사람.",
            "왕이 넘어지면? 킹콩.",
            "오리가 얼어 죽으면? 언덕.",
            "차를 발로 차면? 카놀라유.",
            "소가 계단을 올라가면? 소오름.",
            "전화기로 세운 건물은? 콜로세움.",
            "아몬드가 죽으면? 다이아몬드.",
            "바나나가 웃으면? 바나나킥.",
            "세상에서 제일 야한 채소는? 버섯.",
            "어부들이 가장 싫어하는 가수는? 배철수.",
            "저탄고지 다이어트의 최대 적은 야근 식대입니다.",
            "탄수화물 없이 버티는 혹독한 정체기...",
            "역시 로마 제국의 정통 후계자는 조선... 아니 우리 회사 시스템.",
            "물리학적으로 직구 종속은 없다지만, 퇴근길 발걸음 종속은 확실히 느려집니다.",
            "너 T야? 아니 나 F(ixed)야...",
            "폼 미쳤다... (서버 터지는 폼이)",
            "무플보단 악플이 낫... 아니 무플이 낫습니다.",
            "이 산이 아닌가벼. (프로젝트 엎어짐)",
            "영차 영차... (데이터 옮기는 중)",
            "내 코딩과 기획은 로마처럼 하루아침에 이루어지지 않았다.",
            "커피 섭취량과 버그 발생률의 상관관계 분석 중...",
            "에러 코드 보며 캬~ 취한다!",
            "잠깐, 내가 방금 DB에서 무슨 쿼리를 날린 거지...?",
            "기도 메타로 서버 운영 중...",
            "지금 이 문구를 보고 있다면 당신은 농땡이를 피우고 있는 겁니다."
        ];

const TARGET_DATE = new Date('2027-01-01T00:00:00').getTime();

export function ProjectCountdown() {
  const navigate = useNavigate();
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0, ms: 0 });
  const [msg, setMsg] = useState(messages[0]);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let lastMsgTime = 0;

    const tick = (timestamp: number) => {
      const now = Date.now();
      const distance = TARGET_DATE - now;

      if (distance < 0) {
        setDone(true);
        return;
      }

      setTime({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000),
        ms: Math.floor(distance % 1000),
      });

      if (timestamp - lastMsgTime > 3500) {
        lastMsgTime = timestamp;
        setMsg(messages[Math.floor(Math.random() * messages.length)]);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const pad = (n: number, len: number) => String(n).padStart(len, '0');

  if (done) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <p className="text-[28px]" style={{ fontWeight: 700, color: '#00ff41', fontFamily: "'Courier New', Courier, monospace" }}>
          SERVICE LAUNCHED!
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full relative overflow-hidden"
      style={{ background: '#0d1117', fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Matrix digital rain background */}
      <StarConnection />

      {/* Dark vignette overlay for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(13,17,23,0.1) 0%, rgba(13,17,23,0.6) 100%)',
        }}
      />

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }}
      />

      {/* Title */}
      
      <p className="relative z-10 text-[16px] tracking-[5px] mb-8" style={{ color: '#c9d1d9' }}>
        SYSTEM OPEN: 2027.01.01 00:00:00
      </p>

      {/* Timer */}
      <div className="relative z-10 flex items-end gap-6">
        {[
          { value: pad(time.days, 3), label: 'DAYS' },
          { value: pad(time.hours, 2), label: 'HOURS' },
          { value: pad(time.mins, 2), label: 'MINUTES' },
          { value: pad(time.secs, 2), label: 'SECONDS' },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center" style={{ width: 130 }}>
            <span
              className="text-[72px]"
              style={{
                fontWeight: 700,
                color: '#00ff41',
                lineHeight: 1,
                textShadow: '0 0 15px rgba(0, 255, 65, 0.5)',
              }}
            >
              {item.value}
            </span>
            <span className="text-[13px] mt-2 tracking-[2px]" style={{ color: '#8b949e' }}>
              {item.label}
            </span>
          </div>
        ))}
        {/* Milliseconds */}
        <div className="flex flex-col items-center pb-[28px]">
          <span
            className="text-[36px]"
            style={{
              fontWeight: 700,
              color: '#58a6ff',
              lineHeight: 1,
              textShadow: '0 0 10px rgba(88, 166, 255, 0.6)',
            }}
          >
            {pad(time.ms, 3)}
          </span>
        </div>
      </div>

      {/* Status message */}
      <p
        className="relative z-10 mt-10 text-[15px] cursor-pointer transition-opacity hover:opacity-70"
        style={{ color: '#ff7b72', fontWeight: 700 }}
        onClick={() => navigate('/easter-egg')}
        title="🤫"
      >
        {'> '}{msg}
        <span
          style={{ animation: 'blink 1s step-end infinite' }}
        >
          _
        </span>
      </p>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}