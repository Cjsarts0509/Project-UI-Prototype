import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { 
  FileText,
  ChevronRight,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../../../lib/utils'; 

const menuGroups = [
  {
    label: '통합유통시스템[구매]',
    items: [
      { label: '1. 문구/음반 정가변경', href: '/price-change' },
      { label: '2. 문구/음반 상품상태변경', href: '/status-change' },
      { label: '3. 발주기준관리', href: '/order-standard' },
      { label: '4. 문구 추가발주의뢰', href: '/stationery-order' },
      { label: '5. 음반 추가발주의뢰', href: '/album-order' },
      { label: '6. 음반 발주확정', href: '/album-order-confirm' },
      { label: '7. 해외문구 추가발주의뢰', href: '/overseas-stationery-order' },
      { label: '8. 음반 신보발주', href: '/album-new-release-order' },
      { label: '9. 문구 신상품발주', href: '/stationery-new-release-order' },
      { label: '10. 문구/음반 발주의뢰조회', href: '/order-request-inquiry' },
      { label: '11. 물류센터 출고의뢰등록', href: '/bugok-delivery-order' },
      { label: '12. 음반 매입처별 등급관리', href: '/album-supplier-degree' },
      { label: '13. 음반 매입처별 반품율관리', href: '/album-supplier-return-rate' },
      { label: '14. 음반 매입처별 반품한도조회', href: '/album-supplier-return-limit' },
      { label: '15. 문구 반품목록', href: '/stationery-return-list' },
      { label: '16. 국내입하 조마감', href: '/domestic-arrival-closing' },
      { label: '17. 국내입하 일마감(문구/음반)', href: '/domestic-arrival-daily-closing' },
      { label: '18. 해외문구 매입 및 부대비용 확정', href: '/overseas-stationery-purchase-confirm' },
      { label: '23. 매입처 등급관리(문구)', href: '/stationery-supplier-grade' },
      { label: '24. 대체매입처군 관리(특정매입)', href: '/alt-supplier-group' },
      { label: '25. 수수료율 관리(특정매입)', href: '/specific-purchase-fee-rate' },
      { label: '38. 문구/음반 매출조회', href: '/stationery-album-sales-inquiry' },
    ]
  },
  {
    label: '통합유통시스템[영업점]',
    items: [
      { label: '19. 상품정보 메인', href: '/product-info-main' },
      { label: '20. 분담프로모션등록', href: '/promotion-registration' },
      { label: '21. 분담프로모션매출조회', href: '/promotion-sales' },
      { label: '22. 기간별 판매조회', href: '/periodical-sales' },
      { label: '26. 기획특가프로모션등록(특정)', href: '/special-promo-registration' },
      { label: '27. 점포진열 관리(특정매입)', href: '/store-display-management' },
    ]
  },
  {
    label: 'SCM',
    items: [
      { label: '28. 공문서 관리(문구/음반)', href: '/official-document-management' },
      { label: '29. 재고정보', href: '/inventory-information' },
      { label: '30. 발주내역(문구/음반)', href: '/order-history' },
      { label: '31. 반품(문구/음반)', href: '/return-history' },
      { label: '32. 장부조회(문구/음반)', href: '/ledger-inquiry' },
      { label: '33. 장부상세내역', href: '/ledger-detail' },
      { label: '34. 계산서 확인', href: '/invoice-confirmation' },
    ]
  },
  {
    label: 'WMS',
    items: [
      { label: '35. 해외문구 입하등록', href: '/overseas-stationery-arrival' },
      { label: '36. 문구 서가번호조회', href: '/stationery-bookshelf-inquiry' },
      { label: '37. 일반서가강제입고', href: '/forced-stock-in' },
      { label: '39. 구간입하등록', href: '/section-arrival-registration' }, // ★ 39번 메뉴 추가
    ]
  }
];

export function Sidebar() {
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (label: string) => {
    if (openGroups.includes(label)) {
      setOpenGroups(openGroups.filter(group => group !== label));
    } else {
      setOpenGroups([...openGroups, label]);
    }
  };

  return (
    <div className="hidden md:flex flex-col border-r bg-gray-900 text-gray-100 w-72 flex-shrink-0 h-full overflow-hidden">
      <div className="flex h-16 items-center border-b border-gray-800 px-6 flex-shrink-0">
        <span className="text-lg font-bold tracking-tight">메뉴</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 #1f2937' }}>
        <nav className="space-y-1 px-2">
          {/* Dashboard link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => cn(
              "group flex items-center rounded-md px-3 py-2.5 text-[13px] font-bold transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-700 hover:text-white"
            )}
          >
            <LayoutDashboard className="mr-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>대시보드</span>
          </NavLink>

          <div className="border-b border-gray-700 my-2" />

          {menuGroups.map((group) => (
            <div key={group.label}>
              <div
                className="group flex items-center rounded-md px-3 py-2.5 text-[13px] font-bold cursor-pointer text-gray-200 hover:bg-gray-700 hover:text-white select-none transition-colors"
                onClick={() => toggleGroup(group.label)}
              >
                {openGroups.includes(group.label) ? (
                  <ChevronDown className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                )}
                <span>{group.label}</span>
              </div>
              {openGroups.includes(group.label) && (
                <div className="pl-4">
                  {group.items.map((item) => (
                     <NavLink
                       key={item.label}
                       to={item.href}
                       className={({ isActive }) => cn(
                         "group flex items-center rounded-md px-3 py-1.5 text-[12px] font-medium",
                         isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"
                       )}
                     >
                       <span className="w-1 h-1 rounded-full bg-gray-500 mr-2.5 flex-shrink-0" />
                       <span>{item.label}</span>
                     </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}