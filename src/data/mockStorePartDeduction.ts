// 점포별 공용알바 공제 더미 데이터 — (광화문점/강남점/창원점) 2026년 2월 실자료 기반
export interface DeductionSupplier {
  code: string;
  name: string;
  itemCode: string;
  itemName: string;
  type: 'N' | 'R' | 'A' | 'E';
  sales: number;
  excludeSales: number;
  fixedRate?: number;
  fixedAmount?: number;
  // 매입처 행 단위 감사 필드 (스토리보드: 추가 시점 / 수정 시점 자동 기록)
  regDate?: string;
  regEmpNo?: string;
  regName?: string;
  modDate?: string;
  modEmpNo?: string;
  modName?: string;
}

export interface DeductionMaster {
  id: string;
  yearMonth: string;
  storeCode: string;
  storeName: string;
  totalLaborCost: number;
  status: '작성중' | '확정';
  finalConfirmed: 'Y' | 'N';
  ifasSent: 'Y' | 'N';
  ifasSentDate: string;
  regDate: string;
  regEmpNo: string;
  regName: string;
  finalConfirmDate: string;
  finalConfirmEmpNo: string;
  finalConfirmName: string;
  note: string;
  suppliers: DeductionSupplier[];
}

export const MOCK_DEDUCTION_MASTERS: DeductionMaster[] = [];

export const STORE_LIST = [
  { code: '001', name: '광화문점' },
  { code: '002', name: '강남점' },
  { code: '003', name: '잠실점' },
  { code: '004', name: '영등포점' },
  { code: '005', name: '합정점' },
  { code: '006', name: '목동점' },
  { code: '007', name: '분당점' },
  { code: '008', name: '판교점' },
  { code: '009', name: '부산점' },
  { code: '010', name: '대구점' },
  { code: '011', name: '울산점' },
  { code: '012', name: '창원점' },
  { code: '013', name: '광주점' },
  { code: '014', name: '대전점' },
  { code: '015', name: '천안점' },
];

// ============================================================================
// 🔒 백엔드 시뮬레이션 영역 (프론트엔드 UI에 직접 노출되지 않음)
// ----------------------------------------------------------------------------
// 실제 운영에서는 DW에서 점포별 매입처 매출을 조회하는 서버 API에 해당.
// 화면에서는 아래 getter 함수들만 호출 (getStoreSupplierCodes / getStoreSupplierSales 등)
// ============================================================================

/**
 * 매입처 마스터 정보 (백엔드 DB의 매입처 테이블 역할)
 * - 공용알바 공제 대상 매입처 (문구/음반/특정매입/해외문구 포함)
 * - items[]: 매입처별 매핑된 매입처품목 리스트 (첫 번째가 기본값 '일반')
 */
interface SupplierItem {
  itemCode: string;
  itemName: string;
}
interface SupplierMaster {
  code: string;
  name: string;
  division: '문구' | '음반' | '특정매입' | '해외문구';
  items: SupplierItem[];
}

// 매입처품목 카테고리 풀 — '일반'은 항상 첫 번째 (기본값)
const ITEM_CATEGORIES = ['일반', '대표상품', '기획전', 'PB', '정품', '특가', '증정', '리미티드', '베이직', '문구행사'];
const MUSIC_CATEGORIES = ['일반', '음반', 'KPOP', '해외음반'];
const SPECIFIC_CATEGORIES = ['일반', '특정매입', '시즌특가'];

function makeItems(code: string, name: string, division: SupplierMaster['division']): SupplierItem[] {
  // 결정적 해시
  let h = 0;
  for (let i = 0; i < code.length; i++) h = ((h << 5) - h + code.charCodeAt(i)) | 0;
  const baseDigits = code.replace(/\D/g, '').slice(-4).padStart(4, '0');
  const prefix = division === '음반' ? 'IB0' : 'IC0';

  // '일반'은 항상 포함 (스토리보드: 기본값 일반)
  const items: SupplierItem[] = [{
    itemCode: prefix + baseDigits + '00',
    itemName: `${name} 일반`,
  }];

  // 카테고리 풀 선택
  const pool = (division === '음반' ? MUSIC_CATEGORIES : division === '특정매입' ? SPECIFIC_CATEGORIES : ITEM_CATEGORIES).slice(1);
  // 추가 항목 0~4개 — 일부 매입처는 일반만 보유 (extraCount === 0)
  const extraCount = Math.abs(h) % 5;
  const used = new Set<string>();
  for (let i = 0; i < extraCount; i++) {
    const cat = pool[Math.abs(h + i * 31) % pool.length];
    if (used.has(cat)) continue;
    used.add(cat);
    items.push({
      itemCode: prefix + baseDigits + String(i + 1).padStart(2, '0'),
      itemName: `${name} ${cat}`,
    });
  }
  return items;
}

const SUPPLIER_MASTER: SupplierMaster[] = ([
  // 문구 (categoryCode='8')
  ['0803741', 'BST'], ['0803791', '공장'], ['0816555', '냐냐온 스튜디오'], ['0817528', '누크코퍼레이션'],
  ['0807485', '대시앤도트'], ['0817625', '대인커머스'], ['0816903', '더시호'], ['0818620', '더토브'],
  ['0817225', '도혜드로잉'], ['0810456', '디앤에프조이필'], ['0803503', '로마네'], ['0816525', '루카랩컴퍼니'],
  ['0812988', '모트모트'], ['0811795', '베르제마넷'], ['0817604', '비온뒤'], ['0803289', '솜씨스템프'],
  ['0803222', '아르디움'], ['0803186', '아이코닉'], ['0803159', '안테나샵'], ['0803303', '이투컬렉션'],
  ['0803690', '인디고'], ['0803825', '정인통상'], ['0803187', '칠삼이일디자인'], ['0811513', '캘리엠'],
  ['0810588', '케이디코퍼레이션'], ['0818036', '페펜스튜디오'], ['0803267', '플레플레'], ['0807497', '학산문화사'],
  ['0817135', '해피썬'], ['0803144', '씨케이세일즈'], ['0803527', '프론티어통상'], ['0803255', '모닝글로리'],
  ['0803158', '바이풀디자인'], ['0816796', '마이누'], ['0816312', '엠젯패밀리'], ['0806798', '이가라인유통'],
  ['0816166', '해밀'], ['0807481', '골드디자인'], ['0800334', '아이비스코리아'], ['0803080', '위드에버상사'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '문구' as const, items: makeItems(code, name, '문구') }))
.concat(([
  // 음반/영상
  ['01B0470', '드림어스컴퍼니'], ['01B0478', '와이지플러스'], ['01B0504', '카카오엔터테인먼트'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '음반' as const, items: makeItems(code, name, '음반') })))
.concat(([
  // 특정매입
  ['0803124', '아톰상사(특정매입)'], ['0803833', '모나미(특정매입)'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '특정매입' as const, items: makeItems(code, name, '특정매입') })))
.concat(([
  // 해외문구
  ['0900216', 'LEUCHTTURM'], ['0900224', 'LIHIT LAB.,INC'], ['0900252', 'HIGHTIDE CO.,LTD'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '해외문구' as const, items: makeItems(code, name, '해외문구') })))
.concat(([
  // 창원점 전용 (또는 기타 — 일반 단일품목)
  ['0803176', '라이브워크'],
  ['0817560', '도나앤데코'],
  ['0806606', '디자인랩(레더랩)'],
  ['0803229', '웨이크업(wakup)'],
  ['0803288', '명성코리아'],
] as [string, string][]).map(([code, name]) => ({
  code, name, division: '문구' as const,
  items: [{
    itemCode: 'IC0' + code.replace(/\D/g, '').slice(-4).padStart(4, '0') + '00',
    itemName: name + ' 일반',
  }],
})));

/**
 * 점포별 매입처 코드 리스트 (핵심 5개 점포)
 * - 모든 점포가 공통 매입처 풀에서 동일한 코드를 갖되,
 *   백엔드 매출 시뮬레이션을 위해 점포별로 명시적으로 관리.
 * - 실제로는 DW에서 "해당 점포에서 매출이 발생한 매입처"를 조회.
 * - 프론트엔드 UI에는 직접 노출되지 않음 (모달 필터링 용도로만 사용).
 */
const STORE_SUPPLIER_CODES_MAP: Record<string, string[]> = {
  '001': SUPPLIER_MASTER.map(s => s.code), // 광화문점 - 전체
  '002': SUPPLIER_MASTER.map(s => s.code), // 강남점 - 전체
  '003': SUPPLIER_MASTER.map(s => s.code), // 잠실점 - 전체
  '009': SUPPLIER_MASTER.map(s => s.code), // 부산점 - 전체
  '012': SUPPLIER_MASTER.map(s => s.code), // 창원점 - 전체
};

/**
 * 공용알바 공제 대상 점포 목록
 */
export const DEDUCTION_TARGET_STORES = ['001', '002', '003', '009', '012'];

/**
 * 점포×매입처 매출 매트릭스 (백엔드 시뮬레이션)
 * - 실제로는 DW의 매출 팩트 테이블 조회 쿼리 결과에 해당
 * - 점포별로 매입처마다 서로 다른 매출/매출제외 값 보유
 */
interface StoreSupplierSales {
  sales: number;
  excludeSales: number;
}

// 결정적(deterministic) 해시 기반 매출 생성 — 같은 입력이면 항상 같은 값
function hashSales(storeCode: string, supplierCode: string, base: number, variance: number): number {
  let h = 0;
  const s = storeCode + ':' + supplierCode;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  const pct = (Math.abs(h) % 10000) / 10000; // 0 ~ 0.9999
  // 1만원 단위로 반올림
  const raw = base + (pct * variance * 2 - variance);
  return Math.max(0, Math.round(raw / 10000) * 10000);
}

/**
 * 사용자 지정 매입처 단위 매출 — 해시 결과를 덮어쓰는 화이트리스트
 * (실데이터 기반 시연 케이스. 매입처품목 단위 분배는 아래 로직을 따른다)
 */
const SUPPLIER_TOTAL_OVERRIDES: Record<string, Record<string, StoreSupplierSales>> = {
  '012': {
    '0803176': { sales: 2223710, excludeSales: 0 },
    '0817560': { sales: 1429400, excludeSales: 0 },
    '0806606': { sales: 877500,  excludeSales: 0 },
    '0803229': { sales: 227600,  excludeSales: 0 },
    '0803288': { sales: 166950,  excludeSales: 0 },
  },
};

/**
 * 점포 × 매입처 × 매입처품목 매출 매트릭스
 * 분배 규칙 (xlsx와 동일):
 *   1품목: 100%
 *   2품목 이상: 일반(첫 품목) 60%, 나머지 균등
 */
const STORE_SUPPLIER_ITEM_SALES_MAP: Record<string, Record<string, Record<string, StoreSupplierSales>>> = (() => {
  const map: Record<string, Record<string, Record<string, StoreSupplierSales>>> = {};
  const scale: Record<string, number> = {
    '001': 1.0, '002': 0.75, '009': 0.55, '003': 0.45, '012': 0.30,
  };
  const round10k = (n: number) => Math.round(n / 10000) * 10000;

  DEDUCTION_TARGET_STORES.forEach(storeCode => {
    map[storeCode] = {};
    const s = scale[storeCode] ?? 0.5;
    (STORE_SUPPLIER_CODES_MAP[storeCode] || []).forEach(code => {
      // 매입처 단위 합계 매출 (해시 또는 화이트리스트 override)
      const override = SUPPLIER_TOTAL_OVERRIDES[storeCode]?.[code];
      const totalSales = override
        ? override.sales
        : hashSales(storeCode, code, 3_000_000 * s, 2_500_000 * s);
      // 매출제외 — override 있으면 그 값, 없으면 hash로 일부 매입처 ~10%
      const exHash = (code.charCodeAt(code.length - 1) + storeCode.charCodeAt(2)) % 10;
      const totalExclude = override
        ? override.excludeSales
        : (exHash === 0 ? round10k(totalSales * 0.15) : 0);

      // 매입처가 보유한 매입처품목 리스트 (카탈로그 기준)
      const items = SUPPLIER_MASTER.find(sp => sp.code === code)?.items || [];
      const itemSales: Record<string, StoreSupplierSales> = {};
      if (items.length === 0) {
        // 카탈로그에 없는 매입처(드물게) — 단일 fallback 키로 등록
        const last4 = code.replace(/\D/g, '').slice(-4).padStart(4, '0');
        itemSales[`IC0${last4}00`] = { sales: totalSales, excludeSales: totalExclude };
      } else {
        const n = items.length;
        items.forEach((it, i) => {
          const w = n === 1 ? 1 : (i === 0 ? 0.6 : 0.4 / (n - 1));
          itemSales[it.itemCode] = {
            sales: round10k(totalSales * w),
            excludeSales: round10k(totalExclude * w),
          };
        });
      }
      map[storeCode][code] = itemSales;
    });
  });
  return map;
})();

/**
 * [백엔드 API 시뮬레이션] 점포에 등록된 매입처 코드 리스트 조회
 */
export function getStoreSupplierCodes(storeCode: string): string[] {
  return STORE_SUPPLIER_CODES_MAP[storeCode] || [];
}

/**
 * [백엔드 API 시뮬레이션] 점포 + 매입처 + 매입처품목 단위 매출 조회
 * - 매출조회의 새 lookup 키: (storeCode, supplierCode, itemCode)
 */
export function getStoreSupplierItemSales(
  storeCode: string,
  supplierCode: string,
  itemCode: string,
): { sales: number; excludeSales: number } | null {
  return STORE_SUPPLIER_ITEM_SALES_MAP[storeCode]?.[supplierCode]?.[itemCode] || null;
}

/**
 * [백엔드 API 시뮬레이션] 점포의 전체 (매입처, 매입처품목) 매출 일괄 조회
 * - 매입처품목 단위로 분배된 매출을 반환
 * - 반환 키 형식: `${supplierCode}__${itemCode}`
 */
export function getAllStoreSupplierItemSales(
  storeCode: string
): Record<string, { sales: number; excludeSales: number }> {
  const result: Record<string, StoreSupplierSales> = {};
  const supMap = STORE_SUPPLIER_ITEM_SALES_MAP[storeCode] || {};
  Object.entries(supMap).forEach(([supplierCode, items]) => {
    Object.entries(items).forEach(([itemCode, vals]) => {
      result[`${supplierCode}__${itemCode}`] = vals;
    });
  });
  return result;
}

/**
 * [백엔드 API 시뮬레이션] 매입처코드로 매입처 마스터 정보 조회
 * - 실제: GET /api/suppliers/{supplierCode}
 * - itemCode/itemName 은 기본 매입처품목('일반') 기준으로 반환
 */
export function getSupplierMaster(
  supplierCode: string
): { code: string; name: string; itemCode: string; itemName: string } | null {
  const m = SUPPLIER_MASTER.find(s => s.code === supplierCode);
  if (!m) return null;
  const def = m.items[0];
  return { code: m.code, name: m.name, itemCode: def.itemCode, itemName: def.itemName };
}

/**
 * [백엔드 API 시뮬레이션] 매입처에 매핑된 매입처품목 리스트 조회
 * - 실제: GET /api/suppliers/{supplierCode}/items
 * - 그리드 dropdown 옵션으로 사용
 */
export function getSupplierItems(
  supplierCode: string
): { itemCode: string; itemName: string }[] {
  return SUPPLIER_MASTER.find(s => s.code === supplierCode)?.items || [];
}