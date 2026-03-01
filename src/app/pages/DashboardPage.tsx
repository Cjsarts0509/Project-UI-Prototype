import React from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ProjectCountdown } from '../components/ProjectCountdown';

export default function DashboardPage() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${['일','월','화','수','목','금','토'][today.getDay()]}요일`;

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: '#f5f6fa' }}>
      {/* Hero Banner */}
      <div className="relative h-[200px] flex-shrink-0 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1649520189000-be2b9d14914e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBib29rc2hvcCUyMGxpYnJhcnklMjBzaGVsdmVzJTIwd2FybXxlbnwxfHx8fDE3NzIzODk3Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="bookstore"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/60 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full px-8">
          <p className="text-gray-300 text-[13px] mb-1">{dateStr}</p>
          <h1 className="text-white text-[22px] mb-1" style={{ fontWeight: 700 }}>상품관리 통합시스템 구축 프로젝트</h1>
          <p className="text-gray-300 text-[13px]">UI 프로토타입</p>
        </div>
      </div>

      {/* Countdown - fills remaining space */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-full">
          <ProjectCountdown />
        </div>
      </div>
    </div>
  );
}