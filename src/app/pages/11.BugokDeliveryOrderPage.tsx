import React, { useState, useRef } from 'react';
import { Calendar, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { ProductCodeSearchField } from '../components/ProductCodeSearchField';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';
import { getProductCategoryBySupplierCode, getProductCategoryLabelBySupplierCode } from '../../utils/productCategoryUtils';

const safeText = (val: any) => val && val !== '#' ? val : '';

// ★ 어떠한 포맷의 날짜라도 YYYY-MM-DD로 정확하게 파싱 (시간 무시, 5자리 일련번호 완벽 대응)
const parseExcelDate = (val: any) => {
  if (!val || val === '#') return '';
  if (typeof val === 'number') {
      const date = new Date((val - 25569) * 86400 * 1000);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
  }
  
  let strVal = String(val).trim();
  
  if (/^\d{5}$/.test(strVal)) {
      const numVal = parseInt(strVal, 10);
      if (numVal > 25569) {
          const date = new Date((numVal - 25569) * 86400 * 1000);
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
      }
  }

  if (strVal.includes(' ')) {
      strVal = strVal.split(' ')[0];
  }

  if (strVal.includes('-') || strVal.includes('.') || strVal.includes('/')) {
     const parts = strVal.split(/[-./]/);
     if (parts.length >= 3) {
         let y = parts[0];
         if (y.length === 2) y = '20' + y;
         const m = parts[1].padStart(2, '0');
         const d = parts[2].substring(0, 2).padStart(2, '0');
         return `${y}-${m}-${d}`;
     }
  }
  
  let raw = strVal.replace(/[^0-9]/g, '');
  if (raw.length >= 8) {
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  } else if (raw.length === 6) { 
      return `20${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4, 6)}`;
  }
  return strVal;
};

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const DateRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 10 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={endVal} onChange={(e) => onEndChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={endVal.length === 10 ? endVal : ''} onChange={(e) => onEndChange(e.target.value)} />
        </div>
    </div>
  </div>
);

const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-blue-600 whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

const actionBtnClass = "erp-btn-action";
const headerBtnClass = "erp-btn-header";

// 문자열에서 단위 수량(승수) 추출 로직 (예: "EA/12" -> 12, "BOX/24" -> 24)
const extractMultiplier = (unitStr: string) => {
    if (!unitStr) return 1;
    const match = String(unitStr).match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 1;
};

const STORE_LIST = ['합정', '창원', '잠실', '영등포', '부산', '북시티', '대구', '광화문', '강남'];

export default function BugokDeliveryOrderPage() {
  const { products, suppliers, supplierItems = [] } = useMockData();

  const [deliveryLocation, setDeliveryLocation] = useState('파주센터');
  const [orderDateStart, setOrderDateStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orderDateEnd, setOrderDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [groupCode, setGroupCode] = useState('00');
  
  const [searchProductCode, setSearchProductCode] = useState(''); 
  const [searchProductName, setSearchProductName] = useState('');
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  
  const [searchSupplierItemCode, setSearchSupplierItemCode] = useState('');
  const [searchSupplierItemName, setSearchSupplierItemName] = useState('');

  const [productCategory, setProductCategory] = useState('00');

  const [inputProductCode, setInputProductCode] = useState('');
  const [inputProductName, setInputProductName] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);
  
  const [productModalTarget, setProductModalTarget] = useState<'search' | 'input'>('search');

  const [masterData, setMasterData] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<Record<string, any[]>>({}); 
  const [activeMasterRowId, setActiveMasterRowId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProductSearch = (target: 'search' | 'input') => {
    setProductModalTarget(target);
    const codeVal = target === 'search' ? searchProductCode : inputProductCode;
    const nameVal = target === 'search' ? searchProductName : inputProductName;

    if (!codeVal.trim() && !nameVal.trim()) { setIsProductModalOpen(true); return; }

    const exactMatches = (products || []).filter(p => safeText(p.productCode).includes(codeVal.replace(/[^0-9]/g, '')) && safeText(p.productName).includes(nameVal));
    if (exactMatches.length === 1) {
        if (target === 'search') {
            setSearchProductCode(safeText(exactMatches[0].productCode)); 
            setSearchProductName(safeText(exactMatches[0].productName));
        } else {
            setInputProductCode(safeText(exactMatches[0].productCode)); 
            setInputProductName(safeText(exactMatches[0].productName));
            addProductToMaster(exactMatches[0]);
        }
    } else {
        setIsProductModalOpen(true);
    }
  };

  const handleSupplierSearch = () => {
    if (!searchSupplierCode.trim() && !searchSupplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.code.includes(searchSupplierCode) && s.name.includes(searchSupplierName));
    if (exactMatches.length === 1) {
        setSearchSupplierCode(exactMatches[0].code); setSearchSupplierName(exactMatches[0].name);
    } else {
        setIsSupplierModalOpen(true);
    }
  };

  const handleSupplierItemCodeSearch = () => {
    if (!searchSupplierCode.trim()) { alert('매입처코드값을 먼저 입력해주세요'); return; }
    if (!searchSupplierItemCode.trim()) { setIsSupplierItemModalOpen(true); return; }
    const formatted = searchSupplierItemCode.trim().padStart(3, '0');
    setSearchSupplierItemCode(formatted);
    const exactMatches = (supplierItems || []).filter(si => si.supplierCode === searchSupplierCode.trim() && String(si.itemCode).padStart(3, '0') === formatted);
    if (exactMatches.length === 1) setSearchSupplierItemName(exactMatches[0].itemName);
    else setIsSupplierItemModalOpen(true);
  };

  const handleSupplierItemNameSearch = () => {
    if (!searchSupplierCode.trim()) { alert('매입처코드값을 먼저 입력해주세요'); return; }
    if (!searchSupplierItemName.trim()) { setIsSupplierItemModalOpen(true); return; }
    const exactMatches = (supplierItems || []).filter(si => si.supplierCode === searchSupplierCode.trim() && si.itemName === searchSupplierItemName.trim());
    if (exactMatches.length === 1) {
      setSearchSupplierItemCode(String(exactMatches[0].itemCode).padStart(3, '0')); setSearchSupplierItemName(exactMatches[0].itemName);
    } else { setIsSupplierItemModalOpen(true); }
  };

  const handleSearchReset = () => {
    setDeliveryLocation('파주센터'); setOrderDateStart(format(new Date(), 'yyyy-MM-dd')); setOrderDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setGroupCode('00'); setSearchProductCode(''); setSearchProductName('');
    setSearchSupplierCode(''); setSearchSupplierName(''); 
    setSearchSupplierItemCode(''); setSearchSupplierItemName('');
    setProductCategory('00');
    setMasterData([]); setDetailData({}); setActiveMasterRowId(null);
  };

  const handleSearch = () => {
    // 시드 기반 의사 랜덤 (일관된 재고값 생성용)
    const seededRand = (seed: string, max: number) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) { hash = ((hash << 5) - hash) + seed.charCodeAt(i); hash |= 0; }
        return Math.abs(hash % max);
    };

    // 실제 상품 데이터 기반 필터링
    const baseProducts = (products || []).filter(p => {
        // ★ 특정매입(categoryCode=6) 제외
        const pCat = getProductCategoryBySupplierCode(safeText(p.supplierCode), suppliers || []);
        if (pCat === 'special') return false;

        // 상품구분 필터
        if (productCategory !== '00' && pCat !== productCategory) return false;

        if (groupCode === '02' && !safeText(p.groupCategory).includes('문구')) return false;
        if (groupCode === '03' && !safeText(p.groupCategory).includes('음반')) return false;
        if (searchProductCode && !safeText(p.productCode).includes(searchProductCode)) return false;
        if (searchProductName && !safeText(p.productName).includes(searchProductName)) return false;
        if (searchSupplierCode && safeText(p.supplierCode) !== searchSupplierCode) return false;
        return true;
    });

    // 8~15건 더미 데이터 생성 (상품정보 테이블 기반)
    const itemCount = Math.min(baseProducts.length, Math.floor(Math.random() * 8) + 8);
    const shuffledProducts = [...baseProducts].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    // 매입처코드순 정렬
    shuffledProducts.sort((a, b) => safeText(a.supplierCode).localeCompare(safeText(b.supplierCode)));

    const newMasterData = shuffledProducts.map((p, idx) => {
      const pCode = safeText(p.productCode);
      const pCatLabel = getProductCategoryLabelBySupplierCode(safeText(p.supplierCode), suppliers || []);
      return {
        id: `m${idx}-${Date.now()}`,
        gCode: safeText(p.groupCategory).includes('음반') ? '03' : '02',
        productCategoryLabel: pCatLabel,
        pCode,
        pName: safeText(p.productName),
        supplier: safeText(p.supplierName) || '알수없음',
        sItemCode: safeText((p as any).supplierItemCode) || '001',
        publisher: safeText(p.labelName),
        author: '',
        artist: safeText(p.artistName),
        status: safeText(p.productStatus) || '정상',
        logisticsUnit: p.logisticsUnit && p.logisticsUnitQty ? `${p.logisticsUnit}/${p.logisticsUnitQty}` : 'EA/1',
        stock: String(seededRand(pCode + 'stock', 2000) + 50)
      };
    });

    const newDetailData: Record<string, any[]> = {};
    newMasterData.forEach(m => {
        newDetailData[m.id] = STORE_LIST.map(store => ({
            storeName: store,
            stock: seededRand(m.pCode + store, 80) + 5,
            unitQtyInput: '',
            logisticsUnit: m.logisticsUnit,
            totalQty: ''
        }));
    });

    setMasterData(newMasterData);
    setDetailData(newDetailData);
    if (newMasterData.length > 0) setActiveMasterRowId(newMasterData[0].id);
  };

  const addProductToMaster = (product: any) => {
      const newId = `m-${Date.now()}`;
      const newMasterRow = {
          id: newId, 
          gCode: safeText(product.groupCategory).includes('음반') ? '03' : '02', 
          productCategoryLabel: getProductCategoryLabelBySupplierCode(safeText(product.supplierCode), suppliers || []),
          pCode: safeText(product.productCode), 
          pName: safeText(product.productName),
          supplier: safeText(product.supplierName) || '알수없음', 
          sItemCode: '-', 
          publisher: '', 
          author: '', 
          artist: safeText(product.artistName), 
          status: safeText(product.productStatus) || '정상',
          logisticsUnit: product.logisticsUnit && product.logisticsUnitQty ? `${product.logisticsUnit}/${product.logisticsUnitQty}` : 'EA/1', 
          stock: String(Math.floor(Math.random() * 2000) + 100)
      };

      const newStores = STORE_LIST.map(store => ({
          storeName: store, stock: 0, unitQtyInput: '', logisticsUnit: newMasterRow.logisticsUnit, totalQty: ''
      }));

      setMasterData(prev => [...prev, newMasterRow]);
      setDetailData(prev => ({ ...prev, [newId]: newStores }));
      setActiveMasterRowId(newId);
      setInputProductCode(''); setInputProductName('');
      alert("출고지시내역에 상품이 추가되었습니다.");
  };

  const handleFileUploadClick = () => fileInputRef.current?.click();
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert("엑셀 파일이 업로드되어 출고지시내역이 생성되었습니다.");
    e.target.value = '';
    handleSearch(); 
  };

  const handleDetailInputChange = (storeName: string, val: string) => {
      if (!activeMasterRowId) return;
      const rawVal = val.replace(/[^0-9]/g, ''); 

      setDetailData(prev => {
          const currentStores = prev[activeMasterRowId] || [];
          const updatedStores = currentStores.map(store => {
              if (store.storeName === storeName) {
                  const multiplier = extractMultiplier(store.logisticsUnit);
                  const numInput = Number(rawVal) || 0;
                  return {
                      ...store,
                      unitQtyInput: rawVal,
                      totalQty: rawVal ? String(numInput * multiplier) : '' 
                  };
              }
              return store;
          });
          return { ...prev, [activeMasterRowId]: updatedStores };
      });
  };

  const handleDetailReset = () => {
      if (!activeMasterRowId) return;
      setDetailData(prev => {
          const resetStores = (prev[activeMasterRowId] || []).map(store => ({ ...store, unitQtyInput: '', totalQty: '' }));
          return { ...prev, [activeMasterRowId]: resetStores };
      });
  };

  const handleDetailSave = () => {
      if (!activeMasterRowId) return alert("상품을 선택해주세요.");
      alert("출고지시 수량이 발주의뢰로 저장되었습니다. (발주배치 생성 연동)");
  };

  const activeStores = activeMasterRowId ? (detailData[activeMasterRowId] || []) : [];
  const activeMasterItem = masterData.find(m => m.id === activeMasterRowId);
  
  const sumUnitInput = activeStores.reduce((acc, cur) => acc + (Number(cur.unitQtyInput) || 0), 0);
  const sumTotalQty = activeStores.reduce((acc, cur) => acc + (Number(cur.totalQty) || 0), 0);

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">물류센터 출고의뢰등록</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">상품구분</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={productCategory} onValueChange={setProductCategory}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="00">전체</SelectItem>
                        <SelectItem value="stationery">문구</SelectItem>
                        <SelectItem value="album">음반/영상</SelectItem>
                        <SelectItem value="overseas_stationery">해외문구</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200">수불처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={deliveryLocation} onValueChange={setDeliveryLocation}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="파주센터">파주센터</SelectItem>
                        <SelectItem value="북시티">북시티</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200">출고지시일자</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={orderDateStart} endVal={orderDateEnd} onStartChange={setOrderDateStart} onEndChange={setOrderDateEnd} />
             </div>
             <Label className="border-r border-gray-200">조코드</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={groupCode} onValueChange={setGroupCode}>
                    <SelectTrigger className="h-6 w-[150px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="00">00 : 전체</SelectItem>
                        <SelectItem value="01">01 : 일반도서</SelectItem>
                        <SelectItem value="02">02 : 문구</SelectItem>
                        <SelectItem value="03">03 : 음반</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr]">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200" style={{gridColumn: 'span 3'}}>
                 <ProductCodeSearchField
                   productCode={searchProductCode}
                   setProductCode={setSearchProductCode}
                   productName={searchProductName}
                   setProductName={setSearchProductName}
                   codeWidth="w-20"
                 />
             </div>
             
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierSearch} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">매입처품목</Label>
             <div className="flex items-center p-1 gap-1 relative">
                 <Input className={cn("h-6 w-20 text-[11px] rounded-[2px] border-gray-300", !searchSupplierCode.trim() && "bg-gray-100 cursor-not-allowed")} placeholder="매입처품목코드" value={searchSupplierItemCode} onChange={(e) => setSearchSupplierItemCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierItemCodeSearch()} disabled={!searchSupplierCode.trim()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className={cn("h-6 w-full text-[11px] rounded-[2px] border-gray-300 pr-6", !searchSupplierCode.trim() ? "bg-gray-100 cursor-not-allowed" : "bg-[#fefefe]")} placeholder="매입처품목명" value={searchSupplierItemName} onChange={(e) => setSearchSupplierItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierItemNameSearch()} disabled={!searchSupplierCode.trim()} />
                    <Search className={cn("absolute right-1.5 h-3.5 w-3.5", searchSupplierCode.trim() ? "text-gray-400 cursor-pointer hover:text-gray-800" : "text-gray-300 cursor-not-allowed")} onClick={() => { if (searchSupplierCode.trim()) handleSupplierItemNameSearch(); }} />
                 </div>
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
               <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
               <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
       </div>
      </div>
      
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0 flex items-center p-1 gap-2">
         <Label className="bg-[#eef3f8] border-r border-gray-200 px-3 h-6 flex items-center text-[12px] font-bold text-blue-600">출고지시 의뢰상품정보</Label>
         <Label className="border-none w-auto text-gray-700 font-bold px-2">상품코드</Label>
         <div className="flex items-center gap-1 w-[300px] relative">
             <Input className="h-6 w-24 text-[11px] rounded-[2px] border-gray-300" placeholder="코드" value={inputProductCode} onChange={(e) => setInputProductCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductSearch('input')} />
             <div className="flex-1 relative flex items-center">
                <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="엔터 입력 시 즉시 추가" value={inputProductName} onChange={(e) => setInputProductName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductSearch('input')} />
                <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => handleProductSearch('input')} />
             </div>
         </div>
         <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>파일등록</Button>
         <div className="flex-1"></div> 
      </div>

      <div className="flex gap-4 flex-1 min-h-0 items-stretch">
          
          <div className="erp-section-group min-h-0 flex flex-col" style={{flex: '65 0 0%'}}>
              <div className="erp-section-toolbar min-h-[28px]">
                 <span className="erp-section-title">출고지시내역</span>
              </div>
              <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
               <div className="flex-1 overflow-auto relative">
                 <Table className="table-fixed min-w-[1200px] text-[11px]">
                     <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                         <TableRow className="h-8">
                             <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품구분</TableHead>
                             <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">조코드</TableHead>
                             <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                             <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                             <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처</TableHead>
                             <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처품목코드</TableHead>
                             <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">출판사</TableHead>
                             <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">저자</TableHead>
                             <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">가수</TableHead>
                             <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상태</TableHead>
                             <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">물류사용단위</TableHead>
                             <TableHead className="w-[80px] text-center font-bold text-gray-900 p-1">수불재고</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         {masterData.map((row) => {
                             const isSelected = activeMasterRowId === row.id;
                             return (
                               <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => setActiveMasterRowId(row.id)}>
                                   <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.productCategoryLabel}</TableCell>
                                   <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.gCode}</TableCell>
                                   <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.pCode}</TableCell>
                                   <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate font-bold">{row.pName}</TableCell>
                                   <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplier}</TableCell>
                                   <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sItemCode}</TableCell>
                                   <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate">{row.publisher}</TableCell>
                                   <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.author}</TableCell>
                                   <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.artist}</TableCell>
                                   <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.status}</TableCell>
                                   <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-gray-800">{row.logisticsUnit}</TableCell>
                                   <TableCell className="text-right p-1 text-blue-600 font-bold pr-2">{row.stock}</TableCell>
                               </TableRow>
                             );
                         })}
                         {masterData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                             <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                               {Array.from({ length: 12 }).map((_, j) => (
                                 <TableCell key={j} className={j < 11 ? "border-r border-gray-200" : ""}></TableCell>
                               ))}
                             </TableRow>
                         ))}
                     </TableBody>
                 </Table>
               </div>
              </div>
          </div>

          <div className="erp-section-group min-h-0 flex flex-col" style={{flex: '35 0 0%'}}>
              <div className="erp-section-toolbar min-h-[28px]">
                 <span className="erp-section-title">출고지시 수량입력</span>
                 <div className="flex gap-1">
                     <Button variant="outline" className={actionBtnClass} onClick={handleDetailReset}>초기화</Button>
                     <Button variant="outline" className={actionBtnClass} onClick={handleDetailSave}>저장</Button>
                  </div>
              </div>
              <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1 overflow-auto">
                 <Table className="table-fixed w-full text-[11px]">
                     <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                         <TableRow className="h-8">
                             <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">구분</TableHead>
                             <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">재고</TableHead>
                             <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-100">물류사용단위<br/>출고지시수량</TableHead>
                             <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">물류사용단위</TableHead>
                             <TableHead className="w-[100px] text-center font-bold text-blue-600 bg-blue-50 p-1">출고지시수량</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         <TableRow className="h-8 bg-gray-100 font-bold border-b border-gray-300">
                             <TableCell className="text-center border-r border-gray-300">총합계</TableCell>
                             <TableCell className="text-right pr-2 border-r border-gray-300">-</TableCell>
                             <TableCell className="text-right pr-3 border-r border-gray-300 text-red-600">{sumUnitInput || ''}</TableCell>
                             <TableCell className="text-center border-r border-gray-300">{activeMasterItem ? activeMasterItem.logisticsUnit : '-'}</TableCell>
                             <TableCell className="text-right pr-3 text-blue-600">{sumTotalQty || ''}</TableCell>
                         </TableRow>
                         
                         {activeStores.map((row, idx) => (
                             <TableRow key={idx} className="h-8 border-b border-gray-200 hover:bg-blue-50/50 bg-white">
                                 <TableCell className="text-center p-1 border-r border-gray-200 text-gray-800 font-bold bg-gray-50">{row.storeName}</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.stock}</TableCell>
                                 
                                 <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                     <Input 
                                         className="h-full w-full border-none text-right px-3 text-[12px] font-bold text-red-600 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                         value={row.unitQtyInput} 
                                         onChange={(e) => handleDetailInputChange(row.storeName, e.target.value)} 
                                     />
                                 </TableCell>
                                 
                                 <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.logisticsUnit}</TableCell>
                                 <TableCell className="text-right p-1 font-bold text-blue-600 pr-3 bg-blue-50/30">{row.totalQty}</TableCell>
                             </TableRow>
                         ))}
                         {activeStores.length === 0 && (
                             <TableRow>
                                 <TableCell colSpan={5} className="h-24 text-center text-gray-500">상품을 선택해주세요.</TableCell>
                             </TableRow>
                         )}
                     </TableBody>
                 </Table>
              </div>
          </div>
      </div>

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productModalTarget === 'search' ? (searchProductName || searchProductCode) : (inputProductName || inputProductCode)} onSelect={(item) => {
          if (productModalTarget === 'search') {
              setSearchProductCode(item.productCode); setSearchProductName(item.productName);
          } else {
              setInputProductCode(item.productCode); setInputProductName(item.productName);
              addProductToMaster(item);
          }
      }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={searchSupplierName || searchSupplierCode} onSelect={(item) => { setSearchSupplierCode(item.code); setSearchSupplierName(item.name); }} />
      <SupplierItemSearchModal isOpen={isSupplierItemModalOpen} onClose={() => setIsSupplierItemModalOpen(false)} supplierCode={searchSupplierCode} initialSearchName={searchSupplierItemName || searchSupplierItemCode} onSelect={(item) => { setSearchSupplierItemCode(item.code); setSearchSupplierItemName(item.name); }} />
    </div>
  );
}