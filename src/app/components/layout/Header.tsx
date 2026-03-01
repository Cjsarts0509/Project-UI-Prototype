import React from 'react';
import { useLocation } from 'react-router'; // 추가된 부분
import { Bell, Search, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

// 경로별 페이지 타이틀 매핑
const PAGE_TITLES: Record<string, string> = {
  '/': '문구/음반 정가변경',
  '/price-change': '문구/음반 정가변경',
  '/todo-1': '추가예정[1] 화면',
  '/todo-2': '추가예정[2] 화면',
  '/todo-3': '추가예정[3] 화면',
  '/todo-4': '추가예정[4] 화면',
  '/todo-5': '추가예정[5] 화면',
  '/todo-6': '추가예정[6] 화면',
  '/todo-7': '추가예정[7] 화면',
  '/todo-8': '추가예정[8] 화면',
  '/todo-9': '추가예정[9] 화면',
  '/todo-10': '추가예정[10] 화면',
};

export function Header() {
  const location = useLocation(); // 현재 URL 경로 가져오기
  // 매핑된 타이틀이 없으면 기본값으로 표시
  const currentTitle = PAGE_TITLES[location.pathname] || '페이지를 찾을 수 없습니다'; 

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
      {/* 동적으로 변경되는 타이틀 적용 */}
      <h1 className="text-xl font-semibold text-gray-800">{currentTitle}</h1>
      
      <div className="flex-1">
        {/* Placeholder for optional breadcrumb or spacer */}
      </div>
      <div className="flex items-center gap-4">
        <form className="hidden lg:block relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="메뉴 검색..."
            className="w-64 pl-9 bg-gray-50 border-gray-200"
          />
        </form>
        <Button size="icon" variant="ghost" className="relative text-gray-500 hover:text-gray-900">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
        </Button>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="rounded-full bg-gray-100 text-gray-600">
            <User className="h-5 w-5" />
          </Button>
          <div className="hidden text-sm lg:block">
            <p className="font-medium text-gray-700">관리자</p>
            <p className="text-xs text-gray-500">운영팀</p>
          </div>
        </div>
      </div>
    </header>
  );
}