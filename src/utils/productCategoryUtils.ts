/**
 * 상품구분 판별 유틸리티
 * 
 * 매입처(Supplier)의 categoryCode 기반으로 상품구분을 판별합니다.
 * - 문구: categoryCode === '8' (해외문구 매입처 제외)
 * - 해외문구: categoryCode === '8' AND 해외문구 매입처코드에 해당
 * - 음반/영상: categoryCode === 'B'
 * - 특정매입: categoryCode === '6' (일부 화면에서 제외)
 * - 자나: 별도 매입처코드 기반 (향후 확장)
 */

// ★ 해외문구 매입처 코드 (공통 상수)
export const OVERSEAS_STATIONERY_SUPPLIER_CODES = ['0900216', '0900224', '0900252'];

// ★ 상품구분 enum
export type ProductCategoryType = 'stationery' | 'overseas_stationery' | 'album' | 'special' | 'unknown';

// ★ 상품구분 라벨
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryType, string> = {
  stationery: '문구',
  overseas_stationery: '해외문구',
  album: '음반/영상',
  special: '특정매입',
  unknown: '기타',
};

/**
 * 매입처 categoryCode + 매입처코드로 상품구분을 판별
 * @param categoryCode - 매입처의 categoryCode (예: '8', 'B', '6')
 * @param supplierCode - 매입처코드 (해외문구 판별용)
 */
export function getProductCategory(categoryCode: string, supplierCode: string): ProductCategoryType {
  if (categoryCode === 'B') return 'album';
  if (categoryCode === '6') return 'special';
  if (categoryCode === '8') {
    if (OVERSEAS_STATIONERY_SUPPLIER_CODES.includes(supplierCode)) return 'overseas_stationery';
    return 'stationery';
  }
  return 'unknown';
}

/**
 * 매입처 categoryCode + 매입처코드로 상품구분 라벨 반환
 */
export function getProductCategoryLabel(categoryCode: string, supplierCode: string): string {
  return PRODUCT_CATEGORY_LABELS[getProductCategory(categoryCode, supplierCode)];
}

/**
 * 상품의 매입처코드로부터 매입처 정보를 찾아 상품구분을 판별하는 헬퍼
 * @param supplierCode - 상품의 매입처코드
 * @param suppliers - 매입처 목록
 */
export function getProductCategoryBySupplierCode(
  supplierCode: string,
  suppliers: Array<{ code: string; categoryCode: string }>
): ProductCategoryType {
  const supplier = suppliers.find(s => s.code === supplierCode);
  if (!supplier) return 'unknown';
  return getProductCategory(supplier.categoryCode, supplierCode);
}

/**
 * 상품의 매입처코드로부터 상품구분 라벨 반환
 */
export function getProductCategoryLabelBySupplierCode(
  supplierCode: string,
  suppliers: Array<{ code: string; categoryCode: string }>
): string {
  return PRODUCT_CATEGORY_LABELS[getProductCategoryBySupplierCode(supplierCode, suppliers)];
}
