import React, { useState } from 'react';
import { Calendar, Search, Download, FileUp, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';

import { ProductCodeSearchField } from '../components/ProductCodeSearchField';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';

const STORE_CODES = [
  { code: "001", name: "광화문점" }, { code: "002", name: "대전점" }, { code: "003", name: "원그로브점" },
  { code: "004", name: "대구점" }, { code: "005", name: "부산점" }, { code: "013", name: "부천점" },
  { code: "015", name: "강남점" }, { code: "023", name: "건대스타시티점" }, { code: "024", name: "세종점" }
];

const PRODUCT_CATEGORIES = [
  { code: '00', name: '전체' }, { code: '01', name: '도서' }, { code: '02', name: '음반/영상' }, 
  { code: '03', name: '문구' }, { code: '04', name: '해외문구' }
];

// ★ 1. 조코드 하드코딩 리스트 (요청하신 항목들만 노출)
const ALLOWED_GROUP_CODES = [
  { code: '00', name: '전체' },
  { code: 'M1', name: '음반/영상' }, { code: 'S1', name: '학용품' },
  { code: 'S2', name: '미술전문용품' }, { code: 'S3', name: '사무용품' },
  { code: 'S4', name: '고급다이어리' }, { code: 'S5', name: '고급필기구' },
  { code: 'S6', name: '필기구' }, { code: 'S7', name: '디자인문구' },
  { code: 'T1', name: '디지털' }, { code: 'T2', name: '디자인상품' },
  { code: 'T3', name: '일상소품' }, { code: 'U1', name: '식품' }
];

const OVERSEAS_STATIONERY_SUPPLIERS = ['0900216', '0900252', '0900224'];

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const DateRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 10 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
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

const headerBtnClass = "erp-btn-header";
const actionBtnClass = "erp-btn-action";

export default function PeriodicalSalesInquiryPage() {
  const { products, suppliers, supplierItems = [] } = useMockData();

  // 조회 조건 State
  const [store, setStore] = useState('001');
  const [dateStart, setDateStart] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [dateEnd, setDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [groupCode, setGroupCode] = useState('00'); 
  const [prodCategory, setProdCategory] = useState('00'); 
  
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [centerOrderYn, setCenterOrderYn] = useState('전체');
  
  const [suppCode, setSuppCode] = useState('');
  const [suppName, setSuppName] = useState(''); 
  const [suppItemCode, setSuppItemCode] = useState('');
  const [suppItemName, setSuppItemName] = useState('');
  const [suppPurchaseType, setSuppPurchaseType] = useState('전체'); 
  
  const [subCategoryCode, setSubCategoryCode] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');

  // 모달 및 데이터 State
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [isSuppItemModalOpen, setIsSuppItemModalOpen] = useState(false);
  
  const [salesData, setSalesData] = useState<any[]>([]);
  // ★ 체크박스 선택된 Row ID 관리
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // 매입처 검색 핸들러
  const handleSuppCodeSearch = () => {
    if (!suppCode.trim()) { setIsSuppModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.code === suppCode.trim());
    if (exactMatches.length === 1) { setSuppCode(exactMatches[0].code); setSuppName(exactMatches[0].name); setSuppItemCode(''); setSuppItemName(''); }
    else { setIsSuppModalOpen(true); }
  };

  const handleSuppNameSearch = () => {
    if (!suppName.trim()) { setIsSuppModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.name === suppName.trim());
    if (exactMatches.length === 1) { setSuppCode(exactMatches[0].code); setSuppName(exactMatches[0].name); setSuppItemCode(''); setSuppItemName(''); }
    else { setIsSuppModalOpen(true); }
  };

  // 매입처품목 검색 핸들러
  const handleSuppItemCodeSearch = () => {
    if (!suppCode.trim()) { alert('매입처코드값을 먼저 입력해주세요'); return; }
    if (!suppItemCode.trim()) { setIsSuppItemModalOpen(true); return; }
    const formatted = suppItemCode.trim().padStart(3, '0');
    setSuppItemCode(formatted);
    const exactMatches = (supplierItems || []).filter(si => si.supplierCode === suppCode.trim() && String(si.itemCode).padStart(3, '0') === formatted);
    if (exactMatches.length === 1) setSuppItemName(exactMatches[0].itemName);
    else setIsSuppItemModalOpen(true);
  };

  const handleSuppItemNameSearch = () => {
    if (!suppCode.trim()) { alert('매입처코드값을 먼저 입력해주세요'); return; }
    if (!suppItemName.trim()) { setIsSuppItemModalOpen(true); return; }
    const exactMatches = (supplierItems || []).filter(si => si.supplierCode === suppCode.trim() && si.itemName === suppItemName.trim());
    if (exactMatches.length === 1) {
      setSuppItemCode(String(exactMatches[0].itemCode).padStart(3, '0')); setSuppItemName(exactMatches[0].itemName);
    } else { setIsSuppItemModalOpen(true); }
  };

  // MDM 상품 자동 조회
  const handleProductCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          const matched = products.find(p => p.productCode === prodCode.trim());
          if (matched) setProdName(matched.productName);
          else { setProdName(''); alert("해당 상품을 찾을 수 없습니다."); }
      }
  };

  const handleSearch = () => {
      if (!dateStart || !dateEnd) return alert("판매일자를 입력해주세요.");

      // ★ 2. 데이터 slice 제거: 등록된 전체 상품(products)을 대상으로 필터링
      let filtered = [...products];

      if (prodCode) filtered = filtered.filter(p => p.productCode.includes(prodCode));
      if (centerOrderYn !== '전체') filtered = filtered.filter(p => p.centerOrderYn === centerOrderYn);
      if (suppCode) filtered = filtered.filter(p => p.supplierCode === suppCode);
      if (suppItemCode) filtered = filtered.filter(p => p.supplierItemCode === suppItemCode);
      
      // 조코드(조분류) 필터 적용 
      if (groupCode !== '00') {
          const tGroup = ALLOWED_GROUP_CODES.find(c => c.code === groupCode);
          if (tGroup) filtered = filtered.filter(p => p.groupCategory === tGroup.name);
      }

      // 상품구분 필터링 로직
      if (prodCategory !== '00') {
          filtered = filtered.filter(p => {
              const sInfo = suppliers.find(s => s.code === p.supplierCode);
              if (!sInfo) return false;
              
              const isOverseas = OVERSEAS_STATIONERY_SUPPLIERS.includes(sInfo.code);
              
              if (prodCategory === '04') return isOverseas; 
              if (prodCategory === '02') return sInfo.categoryCode === 'B' && !isOverseas; 
              if (prodCategory === '03') return (sInfo.categoryCode === '6' || sInfo.categoryCode === '8') && !isOverseas; 
              if (prodCategory === '01') return false; 
              return true;
          });
      }

      const generated = filtered.map((p, idx) => {
          const supplierInfo = suppliers.find(s => s.code === p.supplierCode);
          
          const purchaseTypeStr = (supplierInfo?.purchaseTypeCode === 503 || supplierInfo?.purchaseType === '특정매입') ? '특정매입' : '직매입';
          if (suppPurchaseType !== '전체' && purchaseTypeStr !== suppPurchaseType) return null;

          const baseSales = Math.floor(Math.random() * 150) + 10;
          const luUnit = p.logisticsUnit || 'EA';
          const luQty = p.logisticsUnitQty || 1;

          return {
              id: `row-${idx}`,
              storeName: STORE_CODES.find(s => s.code === store)?.name || '광화문점',
              pCode: p.productCode,
              pName: p.productName,
              groupCategory: p.groupCategory,
              brand: p.brand || '-',
              listPrice: p.listPrice || 1000,
              
              // 매입처 정보
              suppCode: p.supplierCode,
              suppName: p.supplierName,
              suppItemCode: p.supplierItemCode || `ITM-${p.productCode.slice(-3)}`,
              suppItemName: p.supplierItemName || '일반상품',
              purchaseType: purchaseTypeStr,
              
              salesQty: baseSales,
              logisticsUnit: luUnit !== 'EA' ? `${luUnit}/${luQty}` : 'EA/1', 
              unitQty: luQty, 
              
              latestOrderDate: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd'),
              latestOrderQty: Math.floor(Math.random() * 50) + 10,
              availStock: Math.floor(Math.random() * 100),
              actualStock: Math.floor(Math.random() * 100) + 20,
              
              logisticsOrderQty: '',
              orderQty: 0
          };
      }).filter(Boolean);

      setSalesData(generated);
      setSelectedRows([]); // 조회 시 체크박스 초기화
  };

  const handleReset = () => {
      setStore('001'); setDateStart(format(subDays(new Date(), 6), 'yyyy-MM-dd')); setDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setGroupCode('00'); setProdCategory('00');
      setProdCode(''); setProdName(''); setCenterOrderYn('전체');
      setSuppCode(''); setSuppName(''); setSuppItemCode(''); setSuppItemName(''); setSuppPurchaseType('전체');
      setSubCategoryCode(''); setSubCategoryName('');
      setSalesData([]);
      setSelectedRows([]);
  };

  // 체크박스 핸들러
  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedRows(salesData.map(r => r.id));
      else setSelectedRows([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedRows(prev => [...prev, id]);
      else setSelectedRows(prev => prev.filter(rId => rId !== id));
  };

  const handleLogisticsOrderQtyChange = (id: string, val: string) => {
      const numVal = val.replace(/[^0-9]/g, ''); 
      setSalesData(prev => prev.map(row => {
          if (row.id === id) {
              const qtyNumber = numVal ? Number(numVal) : 0;
              return { ...row, logisticsOrderQty: numVal, orderQty: qtyNumber * row.unitQty };
          }
          return row;
      }));
  };

  // ★ 발주의뢰 버튼 클릭 로직
  const handleOrderRequest = () => {
      if (selectedRows.length === 0) return alert("발주의뢰를 진행할 대상 항목을 체크해주세요.");
      
      const targetItems = salesData.filter(r => selectedRows.includes(r.id));
      const validItems = targetItems.filter(r => r.orderQty > 0);
      
      if (validItems.length === 0) {
          return alert("선택된 항목 중 발주의뢰수량이 1 이상인 데이터가 없습니다.\n물류사용단위발주수량을 입력해주세요.");
      }

      alert(`총 ${validItems.length}건의 상품코드와 발주의뢰수량만큼 발주의뢰등록으로 데이터 IF 완료`);
  };

  // 엑셀 다운로드 (추가된 칼럼 모두 포함)
  const handleExcelDownload = () => {
      if (salesData.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = salesData.map(r => ({
          '점포': r.storeName, '조': r.groupCategory, '매입처코드': r.suppCode, '매입처명': r.suppName, 
          '매입처품목코드': r.suppItemCode, '매입처품목명': r.suppItemName, '매입처구분': r.purchaseType,
          '상품코드': r.pCode, '상품명': r.pName, '브랜드': r.brand, '정가': r.listPrice,
          '판매수량': r.salesQty, '물류사용단위': r.logisticsUnit, '최근발주의뢰일': r.latestOrderDate, 
          '최근의뢰수량': r.latestOrderQty, '가용재고': r.availStock, '실재고': r.actualStock, 
          '물류사용단위발주수량': r.logisticsOrderQty, '발주의뢰수량': r.orderQty
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "기간별판매조회");
      XLSX.writeFile(wb, `기간별판매조회_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-2">
      {/* 1. 조회 영역 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">기간별 판매조회</h2>
      </div>

      <div className="erp-search-area">
      <div className="flex flex-col border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             <Label className="border-b border-gray-200">점포</Label>
             <div className="p-1 border-b border-r border-gray-200">
                 <Select value={store} onValueChange={setStore}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         {STORE_CODES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                     </SelectContent>
                 </Select>
             </div>
             
             <Label className="border-b border-gray-200" required>판매일자</Label>
             <div className="flex items-center p-1 border-b border-r border-gray-200 px-3">
                 <DateRangeInput startVal={dateStart} endVal={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} />
             </div>

             <Label className="border-b border-gray-200">조코드</Label>
             <div className="p-1 border-b border-gray-200">
                 <Select value={groupCode} onValueChange={setGroupCode}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         {ALLOWED_GROUP_CODES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-b border-gray-200">상품구분</Label>
             <div className="p-1 border-b border-r border-gray-200">
                 <Select value={prodCategory} onValueChange={setProdCategory}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         {PRODUCT_CATEGORIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-b border-gray-200">상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-b border-r border-gray-200">
                 <ProductCodeSearchField
                   productCode={prodCode}
                   setProductCode={setProdCode}
                   productName={prodName}
                   setProductName={setProdName}
                 />
             </div>

             <Label className="border-b border-gray-200">센터발주여부</Label>
             <div className="p-1 border-b border-gray-200">
                 <Select value={centerOrderYn} onValueChange={setCenterOrderYn}>
                     <SelectTrigger className="h-6 w-[100px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-b border-gray-200">매입처</Label>
             <div className="flex items-center gap-1 p-1 border-b border-r border-gray-200">
                 <Input className="h-6 w-[80px] text-[11px] bg-white font-bold" placeholder="매입처코드" value={suppCode} onChange={e => setSuppCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSuppCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={suppName} onChange={e => setSuppName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSuppNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSuppModalOpen(true)} />
                 </div>
             </div>

             <Label className="border-b border-gray-200">매입처품목</Label>
             <div className="flex items-center gap-1 p-1 border-b border-r border-gray-200">
                 <Input className={cn("h-6 w-[80px] text-[11px] bg-white font-bold", !suppCode.trim() && "bg-gray-100 cursor-not-allowed")} placeholder="매입처품목코드" value={suppItemCode} onChange={e => setSuppItemCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSuppItemCodeSearch()} disabled={!suppCode.trim()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className={cn("h-6 w-full text-[11px] rounded-[2px] border-gray-300 pr-6", !suppCode.trim() ? "bg-gray-100 cursor-not-allowed" : "bg-[#fefefe]")} placeholder="매입처품목명" value={suppItemName} onChange={e => setSuppItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSuppItemNameSearch()} disabled={!suppCode.trim()} />
                    <Search className={cn("absolute right-1.5 h-3.5 w-3.5", suppCode.trim() ? "text-gray-400 cursor-pointer hover:text-gray-800" : "text-gray-300 cursor-not-allowed")} onClick={() => { if (suppCode.trim()) setIsSuppItemModalOpen(true); }} />
                 </div>
             </div>

             <Label className="border-b border-gray-200">매입처매입구분</Label>
             <div className="p-1 border-b border-gray-200">
                 <Select value={suppPurchaseType} onValueChange={setSuppPurchaseType}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem><SelectItem value="직매입">직매입</SelectItem><SelectItem value="특정매입">특정매입</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-b-0 border-gray-200">부가분류</Label>
             <div className="flex items-center gap-1 p-1 border-r border-gray-200 col-span-5 bg-white">
                 <Input className="h-6 w-[80px] text-[11px] bg-white font-bold" placeholder="조코드" value={subCategoryCode} onChange={e => setSubCategoryCode(e.target.value)} />
                 <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0" onClick={() => alert('부가분류 검색 팝업 (모의)')}><Search className="w-3.5 h-3.5 text-white" /></Button>
                 <Input className="h-6 w-[150px] text-[11px] bg-gray-100" readOnly tabIndex={-1} placeholder="분류명" value={subCategoryName} />
             </div>
          </div>
          
      </div>
      <div className="erp-search-actions">
             <Button variant="outline" className={headerBtnClass} onClick={handleReset}>초기화(F3)</Button>
             <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>

      {/* 2. 데이터 그리드 */}
      <div className="erp-section-group min-h-0 flex-1">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">판매 내역 및 발주산출</span>
          <div className="flex gap-1.5">
              <Button className="erp-btn-action" onClick={() => alert('파일 열기 창 호출 (엑셀 업로드)')}>
                  <FileUp className="w-3 h-3 mr-1"/> 엑셀업로드
              </Button>
              <Button className="erp-btn-action" onClick={handleOrderRequest}>
                  <Send className="w-3 h-3 mr-1"/> 발주의뢰
              </Button>
              <Button variant="outline" className="erp-btn-action" onClick={handleExcelDownload}>
                  <Download className="w-3 h-3 mr-1"/> 엑셀다운
              </Button>
          </div>
       </div>
       <div className="flex flex-col flex-1 border border-gray-300 bg-white overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
              <Table className="table-fixed min-w-[2100px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          {/* ★ 3. 좌측 체크박스 헤더 추가 */}
                          <TableHead className="w-[40px] text-center border-r border-gray-300">
                              <Checkbox 
                                  checked={salesData.length > 0 && selectedRows.length === salesData.length}
                                  onCheckedChange={handleSelectAll}
                                  className="rounded-[2px]"
                              />
                          </TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">점포</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">조코드</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">매입처코드</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">매입처명</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목코드</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">매입처구분</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">브랜드</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">정가</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">판매수량</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">물류사용단위</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">최근발주의뢰일</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">최근의뢰수량</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">가용재고</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">실재고</TableHead>
                          <TableHead className="w-[130px] text-center font-bold text-blue-700 border-r border-gray-300 bg-yellow-50">물류사용단위발주수량</TableHead>
                          {/* ★ 3. 발주수량 -> 발주의뢰수량 명칭 변경 */}
                          <TableHead className="w-[100px] text-center font-bold text-white bg-red-500">발주의뢰수량</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {salesData.map((row) => {
                          const isSelected = selectedRows.includes(row.id);
                          return (
                              <TableRow key={row.id} className={cn("h-8 border-b border-gray-200 transition-colors", isSelected ? "bg-blue-50/50" : "bg-white hover:bg-gray-50")}>
                                  {/* 체크박스 셀 */}
                                  <TableCell className="text-center border-r border-gray-200">
                                      <Checkbox 
                                          checked={isSelected}
                                          onCheckedChange={(c) => handleSelectRow(row.id, c as boolean)}
                                          className="rounded-[2px]"
                                      />
                                  </TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-medium">{row.storeName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.groupCategory}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-medium">{row.suppCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.suppName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-medium text-gray-600">{row.suppItemCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.suppItemName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.purchaseType}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 font-bold truncate pl-2" title={row.pName}>{row.pName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.brand}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.listPrice.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold">{row.salesQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold text-blue-600">{row.logisticsUnit}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.latestOrderDate}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.latestOrderQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.availStock.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-gray-800">{row.actualStock.toLocaleString()}</TableCell>
                                  
                                  <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/20">
                                      <Input 
                                          className="h-full w-full border-none text-right pr-2 text-[12px] font-bold text-blue-700 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                          value={row.logisticsOrderQty} 
                                          onChange={e => handleLogisticsOrderQtyChange(row.id, e.target.value)}
                                          placeholder="수량입력"
                                      />
                                  </TableCell>
                                  
                                  <TableCell className="text-right pr-2 bg-red-50 font-bold text-red-600 text-[13px]">
                                      {row.orderQty > 0 ? row.orderQty.toLocaleString() : ''}
                                  </TableCell>
                              </TableRow>
                          );
                      })}
                      
                      {salesData.length > 0 && (
                          <TableRow className="h-9 bg-[#eef3f8] border-t-2 border-gray-300 font-bold sticky bottom-0 z-10 shadow-[0_-1px_0_0_#d1d5db]">
                              <TableCell colSpan={20} className="text-center text-[12px] text-gray-800">
                                  Total Count: <span className="text-blue-700 ml-1">{salesData.length}</span>
                              </TableCell>
                          </TableRow>
                      )}

                      {salesData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 20 }).map((_, j) => (
                              <TableCell key={j} className={j < 19 ? "border-r border-gray-200" : ""}></TableCell>
                            ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
       </div>
      </div>

      {/* ProductSearchModal은 ProductCodeSearchField 내부에서 관리 */}
      <SupplierSearchModal isOpen={isSuppModalOpen} onClose={() => setIsSuppModalOpen(false)} initialSearchName={suppName || suppCode} onSelect={(item) => { setSuppCode(item.code); setSuppName(item.name); }} />
      <SupplierItemSearchModal isOpen={isSuppItemModalOpen} onClose={() => setIsSuppItemModalOpen(false)} supplierCode={suppCode} initialSearchName={suppItemName || suppItemCode} onSelect={(item) => { setSuppItemCode(item.code); setSuppItemName(item.name); }} />
    </div>
  );
}