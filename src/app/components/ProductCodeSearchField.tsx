import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { ProductSearchModal } from './ProductSearchModal';
import { useMockData } from '../../context/MockDataContext';

/**
 * 공통 상품코드/명 조회 컴포넌트
 * 
 * 표준 동작:
 * - 상품코드 입력 후 Enter → 정확히 일치하는 상품이 1건이면 자동으로 상품명 채움, 아니면 팝업
 * - 상품명 일부 입력 후 Enter → 부분 일치 1건이면 자동채움, 아니면 팝업
 * - 돋보기 아이콘 클릭 → 상품조회 팝업 오픈
 * - 팝업에서 선택 → 상품코드/명 자동 채움 + onSelect 콜백 호출
 */
interface ProductCodeSearchFieldProps {
  productCode: string;
  setProductCode: (v: string) => void;
  productName: string;
  setProductName: (v: string) => void;
  onSelect?: (item: any) => void;
  codePlaceholder?: string;
  namePlaceholder?: string;
  codeWidth?: string;
  codeInputClassName?: string;
}

export function ProductCodeSearchField({
  productCode,
  setProductCode,
  productName,
  setProductName,
  onSelect,
  codePlaceholder = 'ISBN',
  namePlaceholder = '상품명',
  codeWidth = 'w-24',
  codeInputClassName,
}: ProductCodeSearchFieldProps) {
  const { products = [] } = useMockData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductCodeSearch = () => {
    if (!productCode.trim()) { setIsModalOpen(true); return; }
    const numCode = productCode.replace(/[^0-9]/g, '');
    setProductCode(numCode);
    const exactMatches = products.filter(p => String(p.productCode || '') === numCode);
    if (exactMatches.length === 1) {
      setProductName(String(exactMatches[0].productName || ''));
      onSelect?.(exactMatches[0]);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleProductNameSearch = () => {
    if (!productName.trim()) { setIsModalOpen(true); return; }
    const exactMatches = products.filter(p => String(p.productName || '').includes(productName.trim()));
    if (exactMatches.length === 1) {
      setProductCode(String(exactMatches[0].productCode || ''));
      setProductName(String(exactMatches[0].productName || ''));
      onSelect?.(exactMatches[0]);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleModalSelect = (item: any) => {
    setProductCode(String(item.productCode || ''));
    setProductName(String(item.productName || ''));
    onSelect?.(item);
  };

  return (
    <>
      <div className="flex items-center gap-1 flex-1">
        <Input
          className={codeInputClassName || `h-6 ${codeWidth} text-[11px] rounded-[2px] border-gray-300`}
          placeholder={codePlaceholder}
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleProductCodeSearch(); }}
        />
        <div className="flex-1 relative flex items-center">
          <Input
            className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6"
            placeholder={namePlaceholder}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleProductNameSearch(); }}
          />
          <Search
            className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      <ProductSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSearchName={productName}
        onSelect={(item) => {
          handleModalSelect(item);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}