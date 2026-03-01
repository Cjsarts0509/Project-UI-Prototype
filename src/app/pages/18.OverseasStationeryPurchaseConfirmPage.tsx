import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

// ★ 해외문구 전용 매입처 코드 제한
const OVERSEAS_STATIONERY_SUPPLIERS = ['0900216', '0900224', '0900252'];

const INVOICE_PROCESS_TYPE_CODES = [
  { code: '001', name: '외상매입(정상)' }, { code: '002', name: '외상매입(가입고)' }, { code: '003', name: '선급' },
  { code: '004', name: 'SAMPLE' }, { code: '005', name: 'CHARGE' }, { code: '006', name: '카드선급' },
  { code: '007', name: '매입 CREDIT' }, { code: '008', name: '매입할인 CREDIT' }, { code: '009', name: '매입정정' },
  { code: '010', name: '매입취소' }, { code: '011', name: '법인샘플' }, { code: '012', name: '반품 CREDIT' },
  { code: '999', name: '관련인보이스이행' },
];

// ★ 누락되었던 전체 화폐단위 코드 추가
const CURRENCY_UNIT_CODES = [
  { code: '001', name: 'SGD' }, { code: '002', name: 'BEF' }, { code: '003', name: 'CAD' }, { code: '004', name: 'NLG' },
  { code: '005', name: 'SEK' }, { code: '006', name: 'FRF' }, { code: '007', name: 'BRL' }, { code: '008', name: 'HKD' },
  { code: '009', name: 'ITL' }, { code: '010', name: 'CNY' }, { code: '011', name: '￦' }, { code: '012', name: '￡' },
  { code: '013', name: 'DEM' }, { code: '014', name: 'TWD' }, { code: '015', name: 'ATS' }, { code: '016', name: 'ADP' },
  { code: '017', name: 'AUD' }, { code: '018', name: 'INR' }, { code: '019', name: 'CHF' }, { code: '020', name: 'EURO' },
  { code: '021', name: '＄' }, { code: '022', name: '￥' }, { code: '023', name: 'DKK' }, { code: '024', name: 'NOK' },
  { code: '025', name: 'NZD' }, { code: '026', name: 'MYR' }, { code: '027', name: 'TRY' }, { code: '028', name: 'SAR' },
  { code: '029', name: 'KWD' }, { code: '030', name: 'BHD' }, { code: '031', name: 'AED' }, { code: '032', name: 'THB' },
  { code: '033', name: 'BDT' }, { code: '034', name: 'BND' }, { code: '035', name: 'CZK' }, { code: '036', name: 'HUF' },
  { code: '037', name: 'IDR' }, { code: '038', name: 'KZT' }, { code: '039', name: 'PLN' }, { code: '040', name: 'QAR' },
  { code: '041', name: 'RUB' }, { code: '042', name: 'ZAR' }, { code: '043', name: 'EGP' }, { code: '044', name: 'MXN' },
  { code: '045', name: 'PHP' }, { code: '046', name: 'PKR' }, { code: '047', name: 'VND' }, { code: '048', name: 'ILS' },
  { code: '049', name: 'JOD' },
];

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

const headerBtnClass = "erp-btn-header";
const actionBtnClass = "erp-btn-action";

export default function OverseasStationeryPurchaseConfirmPage() {
  // ★ products 데이터 추가 호출
  const { suppliers, products } = useMockData();

  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  const [invoiceType, setInvoiceType] = useState('003'); // 선급
  const [progressStatus, setProgressStatus] = useState('전체');
  const [orderNo, setOrderNo] = useState('');
  const [orderDateStart, setOrderDateStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [orderDateEnd, setOrderDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [arrivalDateStart, setArrivalDateStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [arrivalDateEnd, setArrivalDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [productType, setProductType] = useState('해외문구');
  const [invoiceNo, setInvoiceNo] = useState('');

  const [currencyUnit, setCurrencyUnit] = useState('020'); // EURO 기본값
  const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('1500'); 
  const [totalAddCost, setTotalAddCost] = useState(''); 
  const [diffCost, setDiffCost] = useState('0'); 

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  
  const [data, setData] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ★ 실제 해외문구 상품 매핑 로직
  const generateMockData = () => {
      if (!products || products.length === 0) return [];

      // 1. 해외문구 매입처에 해당하는 상품만 필터링
      let osProducts = products.filter(p => OVERSEAS_STATIONERY_SUPPLIERS.includes(p.supplierCode));
      
      // 만약 목업 데이터에 해당 매입처 상품이 없다면 (안전장치)
      if (osProducts.length === 0) {
          osProducts = products.slice(0, 5); 
      }

      // 화면에 보여줄 갯수만큼 랜덤 셔플
      const shuffled = osProducts.sort(() => 0.5 - Math.random()).slice(0, 5);

      const mock = shuffled.map((p, idx) => {
          const qty = Math.floor(Math.random() * 50) + 10;
          
          // 외화단가(문자열일 수 있으므로 숫자 변환)
          const fCostStr = String(p.foreignCurrencyPrice || '1.00').replace(/[^0-9.]/g, '');
          const foreignCost = Number(fCostStr) || 1.00;
          
          // 원화정가
          const krwListStr = String(p.listPrice || '1000').replace(/[^0-9]/g, '');
          const krwList = Number(krwListStr) || 15000;
          
          const subtotal = qty * foreignCost;
          
          return {
              id: `row-${idx}`,
              pType: '해외문구',
              invNo: `INV-2025-${idx+100}`, // 가상 인보이스
              itemNo: `ITM-${p.productCode.substring(p.productCode.length - 4)}`,
              arrDate: format(new Date(), 'yyyy-MM-dd'),
              pCode: p.productCode,
              pName: p.productName,
              ordQty: qty,
              unit: 'EA',
              unitQty: 1,
              ordTotalQty: qty,
              arrQty: qty,
              degree: '230002',
              foreignList: foreignCost * 1.5, // 가상 외화정가
              discount: 0,
              foreignCost: foreignCost,
              foreignCostSubtotal: subtotal,
              addCost: '', 
              krwList: krwList,
              ordDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
              ordNo: `HM${format(new Date(), 'MMdd')}00${idx}`,
              ordSeq: 1,
              ordNote: '',
              invoice: ''
          };
      });
      return mock;
  };

  const handleSearch = () => {
      setData(generateMockData());
      setSelectedIds([]);
  };

  const handleSearchReset = () => {
      setSearchSupplierCode(''); setSearchSupplierName('');
      setInvoiceType('003'); setProgressStatus('전체');
      setOrderNo(''); setInvoiceNo('');
      setOrderDateStart(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
      setOrderDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setArrivalDateStart(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
      setArrivalDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setExchangeRate('1500'); setTotalAddCost(''); setDiffCost('0');
      setData([]); setSelectedIds([]);
  };

  // ★ 해외문구 매입처 전용 검색 로직 적용
  const handleSupplierCodeSearch = () => {
      if (!searchSupplierCode.trim()) { setIsSupplierModalOpen(true); return; }
      const exactMatches = (suppliers || []).filter(s => OVERSEAS_STATIONERY_SUPPLIERS.includes(s.code) && s.code === searchSupplierCode.trim());
      if (exactMatches.length === 1) setSearchSupplierName(exactMatches[0].name);
      else setIsSupplierModalOpen(true);
  };

  const handleSupplierNameSearch = () => {
      if (!searchSupplierName.trim()) { setIsSupplierModalOpen(true); return; }
      const exactMatches = (suppliers || []).filter(s => OVERSEAS_STATIONERY_SUPPLIERS.includes(s.code) && s.name.includes(searchSupplierName.trim()));
      if (exactMatches.length === 1) { setSearchSupplierCode(exactMatches[0].code); setSearchSupplierName(exactMatches[0].name); }
      else setIsSupplierModalOpen(true);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedIds(data.map(item => item.id));
      else setSelectedIds([]);
  };
  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedIds(prev => [...prev, id]);
      else setSelectedIds(prev => prev.filter(vid => vid !== id));
  };

  const handleRowChange = (id: string, val: string) => {
      setData(prev => prev.map(item => item.id === id ? { ...item, addCost: val } : item));
  };

  // 배분예상 로직
  const handleCalculateDistribution = () => {
      const addCostTotalNum = Number(totalAddCost.replace(/[^0-9]/g, '')) || 0;
      if (addCostTotalNum === 0) return alert("전체부대비용을 입력해주세요.");
      if (selectedIds.length === 0) return alert("부대비용을 분배할 항목을 체크해주세요.");

      let checkedForeignTotal = 0;
      data.forEach(item => {
          if (selectedIds.includes(item.id)) {
              checkedForeignTotal += item.foreignCostSubtotal;
          }
      });

      if (checkedForeignTotal === 0) return alert("선택된 항목의 외화원가소계 합이 0입니다.");

      let allocatedSum = 0;
      const updatedData = data.map(item => {
          if (selectedIds.includes(item.id)) {
              const allocated = Math.round((item.foreignCostSubtotal / checkedForeignTotal) * addCostTotalNum);
              allocatedSum += allocated;
              return { ...item, addCost: String(allocated) };
          }
          return item;
      });

      setDiffCost(String(addCostTotalNum - allocatedSum)); 
      setData(updatedData);
  };

  const totalForeignCostSum = data.reduce((acc, curr) => acc + curr.foreignCostSubtotal, 0);
  
  let totalKrwCostSum = 0;
  let currentAddCostSum = 0;
  data.forEach(item => {
      totalKrwCostSum += Math.round(item.foreignCostSubtotal * (Number(exchangeRate.replace(/[^0-9]/g, '')) || 0));
      currentAddCostSum += Number(item.addCost.replace(/[^0-9]/g, '')) || 0;
  });
  const grandTotal = totalKrwCostSum + currentAddCostSum;

  const handleExcelDownload = () => {
      if (data.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = data.map(r => {
          const exRate = Number(exchangeRate.replace(/[^0-9]/g, '')) || 0;
          const krwCost = Math.round(r.foreignCost * exRate);
          const addCost = Number(r.addCost.replace(/[^0-9]/g, '')) || 0;
          const appliedCost = krwCost + (r.arrQty > 0 ? addCost / r.arrQty : 0);
          const actualPurAmount = appliedCost * r.arrQty;
          const margin = r.krwList > 0 ? (1 - (appliedCost / (r.krwList / 1.1))) * 100 : 0;

          return {
              '상품구분': r.pType, 'Invoice No.': r.invNo, 'Item No.': r.itemNo, '입하일자': r.arrDate,
              '상품코드': r.pCode, '상품명': r.pName, '발주수량': r.ordQty, '단위': r.unit, '단위수량': r.unitQty,
              '발주 총수량': r.ordTotalQty, '입하수량': r.arrQty, '차수': r.degree, '외화정가': r.foreignList.toFixed(2),
              '할인율': r.discount, '외화원가': r.foreignCost.toFixed(4), '외화원가소계': r.foreignCostSubtotal.toFixed(2),
              '원화원가': krwCost, '부대비용': addCost, '적용원가': appliedCost.toFixed(2), '원화정가': r.krwList,
              '실매입금액': actualPurAmount.toFixed(0), '마진(%)': margin.toFixed(2), '발주일자': r.ordDate,
              '발주번호': r.ordNo, '발주순번': r.ordSeq, '발주비고': r.ordNote, '인보이스': r.invoice
          };
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "해외문구매입확정");
      XLSX.writeFile(wb, "해외문구매입_부대비용확정.xlsx");
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">해외문구 매입 및 부대비용 확정</h2>
      </div>

      <div className="flex items-center px-1 mb-1 flex-shrink-0">
         <span className="erp-section-title">입하정보 조회 [해외문구]</span>
      </div>
      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">인보이스 구분</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={invoiceType} onValueChange={setInvoiceType}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        {INVOICE_PROCESS_TYPE_CODES.map(code => (
                            <SelectItem key={code.code} value={code.code}>{code.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
             </div>

             <Label className="border-r border-gray-200">진행상태</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={progressStatus} onValueChange={setProgressStatus}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="전체">전체</SelectItem>
                        <SelectItem value="발주등록">발주등록</SelectItem>
                        <SelectItem value="발주확정">발주확정</SelectItem>
                        <SelectItem value="납품확인">납품확인</SelectItem>
                        <SelectItem value="검수">검수</SelectItem>
                        <SelectItem value="검수확정">검수확정</SelectItem>
                        <SelectItem value="입하확정">입하확정</SelectItem>
                        <SelectItem value="취소">취소</SelectItem>
                    </SelectContent>
                 </Select>
             </div>

             <Label className="border-r border-gray-200">발주번호</Label>
             <div className="flex items-center p-1 gap-1 relative">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr]">
             <Label className="border-r border-gray-200">발주기간</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={orderDateStart} endVal={orderDateEnd} onStartChange={setOrderDateStart} onEndChange={setOrderDateEnd} />
             </div>
             
             <Label className="border-r border-gray-200">입하기간</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={arrivalDateStart} endVal={arrivalDateEnd} onStartChange={setArrivalDateStart} onEndChange={setArrivalDateEnd} />
             </div>
             
             <Label className="border-r border-gray-200">상품구분</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={productType} onValueChange={setProductType}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-gray-100"><SelectValue placeholder="해외문구" /></SelectTrigger>
                    <SelectContent><SelectItem value="해외문구">해외문구</SelectItem></SelectContent>
                 </Select>
             </div>

             <Label className="border-r border-gray-200">인보이스번호</Label>
             <div className="flex items-center p-1 gap-1 relative">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
             </div>
             <div className="col-span-2 bg-white"></div>
          </div>
      </div>
      <div className="erp-search-actions">
                  <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
                  <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>
      
      <div className="erp-section-group flex-shrink-0">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">부대비용 분배</span>
             <Button variant="outline" className={actionBtnClass} onClick={handleCalculateDistribution}>배분예상</Button>
          </div>
       <div className="flex flex-col border border-gray-300 bg-[#fefefe]">
         <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr] border-b border-gray-200 bg-blue-50/10">
             <Label className="border-r border-gray-200 bg-blue-50/40">인보이스</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 text-gray-600 font-bold px-3">
                 {data.length > 0 ? data[0].invNo : '-'}
             </div>
             
             <Label className="border-r border-gray-200 bg-blue-50/40">적용화폐</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Popover open={currencyPopoverOpen} onOpenChange={setCurrencyPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="h-6 w-full flex items-center justify-between text-[11px] rounded-[2px] border border-gray-300 bg-white px-2 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <span className="truncate">{CURRENCY_UNIT_CODES.find(c => c.code === currencyUnit)?.name || '선택'}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[480px] p-2" align="start" sideOffset={4}>
                      <div className="text-[11px] text-gray-500 mb-1.5 px-1 font-bold">화폐단위 선택 (49개)</div>
                      <div className="grid grid-cols-5 gap-0.5 max-h-[320px] overflow-y-auto">
                        {CURRENCY_UNIT_CODES.map(code => (
                          <button
                            key={code.code}
                            className={cn(
                              "text-[11px] px-2 py-1.5 rounded-[2px] text-left hover:bg-blue-50 transition-colors whitespace-nowrap",
                              currencyUnit === code.code 
                                ? "bg-blue-100 text-blue-800 font-bold border border-blue-300" 
                                : "text-gray-700 border border-transparent hover:border-gray-200"
                            )}
                            onClick={() => { setCurrencyUnit(code.code); setCurrencyPopoverOpen(false); }}
                          >
                            <span className="text-gray-400 mr-0.5">{code.code}</span> {code.name}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                 </Popover>
             </div>

             <Label className="border-r border-gray-200 bg-blue-50/40">외화원가합계</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 px-3 font-bold text-gray-900 justify-end w-full">
                 {totalForeignCostSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
             </div>

             <Label className="border-r border-gray-200 bg-blue-50/40">환율</Label>
             <div className="flex items-center p-1 gap-1">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 text-right font-bold focus-visible:ring-1 focus-visible:ring-blue-500" value={exchangeRate ? Number(exchangeRate).toLocaleString() : ''} onChange={(e) => setExchangeRate(e.target.value.replace(/[^0-9]/g, ''))} />
             </div>
         </div>
         <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr] bg-blue-50/10">
             <Label className="border-r border-gray-200 bg-blue-50/40">전체부대비용</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 text-right font-bold focus-visible:ring-1 focus-visible:ring-blue-500 pr-5" value={totalAddCost ? Number(totalAddCost).toLocaleString() : ''} onChange={(e) => setTotalAddCost(e.target.value.replace(/[^0-9]/g, ''))} />
                 <span className="absolute right-2 text-gray-500 font-bold">원</span>
             </div>
             
             <Label className="border-r border-gray-200 bg-blue-50/40">단수차액(원화)</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 text-right font-bold text-red-600 pr-5" value={Number(diffCost).toLocaleString()} readOnly disabled />
                 <span className="absolute right-2 text-gray-500 font-bold">원</span>
             </div>
             
             <Label className="border-r border-gray-200 bg-blue-50/40">총입하금액</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 px-3 font-bold text-blue-700 justify-end w-full">
                 {grandTotal.toLocaleString()}
             </div>
             <div className="col-span-2"></div>
         </div>
       </div>
      </div>

      <div className="erp-section-group min-h-0 flex-1">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">입하내역</span>
             <div className="flex gap-1">
                <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
                <Button variant="outline" className={actionBtnClass} onClick={() => alert('입하 확정 처리되었습니다.')}>입하확정</Button>
                <Button variant="outline" className="erp-btn-action" onClick={() => alert('매입 확정 처리되었습니다.')}>매입확정</Button>
                <Button variant="outline" className={actionBtnClass} onClick={() => alert('매입대장 오즈뷰어 팝업 띄우기')}>매입대장</Button>
             </div>
          </div>
       <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
         <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[2800px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead className="w-[40px] text-center border-r border-gray-300 p-1">
                            <div className="flex justify-center items-center w-full h-full">
                                <Checkbox className="h-4 w-4 rounded-[2px]" checked={isAllSelected} onCheckedChange={(c) => handleSelectAll(!!c)} />
                            </div>
                        </TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품구분</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">Invoice No.</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">Item No.</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">입하일자</TableHead>
                        <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                        <TableHead className="w-[250px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주수량</TableHead>
                        <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">단위</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">단위수량</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주 총수량</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">입하수량</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">차수</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">외화정가</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">할인율</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">외화원가</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-gray-200">외화원가소계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">원화원가</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">부대비용</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">적용원가</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">원화정가</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-purple-50">실매입금액</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">마진(%)</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주일자</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주번호</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주순번</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주비고</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 p-1">인보이스</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => {
                        const isChecked = selectedIds.includes(row.id);
                        
                        const exRate = Number(exchangeRate.replace(/[^0-9]/g, '')) || 0;
                        const krwCost = Math.round(row.foreignCost * exRate);
                        const addCostNum = Number(row.addCost.replace(/[^0-9]/g, '')) || 0;
                        
                        const appliedCost = krwCost + (row.arrQty > 0 ? addCostNum / row.arrQty : 0);
                        const actualPurAmount = Math.round(appliedCost * row.arrQty);
                        const margin = row.krwList > 0 ? (1 - (appliedCost / (row.krwList / 1.1))) * 100 : 0;

                        return (
                            <TableRow key={row.id} className={cn("h-8 border-b border-gray-200 hover:bg-blue-50/50 bg-white", isChecked && "bg-blue-50")}>
                                <TableCell className="text-center p-0 border-r border-gray-200">
                                    <div className="flex justify-center items-center w-full h-full">
                                        <Checkbox className="h-4 w-4 rounded-[2px]" checked={isChecked} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} />
                                    </div>
                                </TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.pType}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-800 font-bold">{row.invNo}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.itemNo}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.arrDate}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.pCode}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-2" title={row.pName}>{row.pName}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.ordQty}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.unit}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.unitQty}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.ordTotalQty}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-blue-700 pr-2">{row.arrQty}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.degree}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.foreignList.toFixed(2)}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.discount}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 pr-2 font-bold">{row.foreignCost.toFixed(4)}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-gray-800 pr-2 bg-gray-200/50">{row.foreignCostSubtotal.toFixed(2)}</TableCell>
                                
                                <TableCell className="text-right p-1 border-r border-gray-200 text-blue-700 font-bold pr-2 bg-blue-50/30">{krwCost.toLocaleString()}</TableCell>
                                
                                <TableCell className="text-center p-0 border-r border-gray-200 bg-yellow-50/50">
                                    <Input 
                                        className="h-full w-full border-none text-right px-2 text-[12px] font-bold text-red-600 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                        value={row.addCost ? Number(row.addCost).toLocaleString() : ''} 
                                        onChange={(e) => handleRowChange(row.id, e.target.value.replace(/[^0-9]/g, ''))} 
                                    />
                                </TableCell>
                                
                                <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-green-700 pr-2 bg-green-50/30">{appliedCost.toLocaleString(undefined, {maximumFractionDigits: 2})}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.krwList.toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-purple-700 pr-2 bg-purple-50/50">{actualPurAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{margin.toFixed(2)}</TableCell>
                                
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.ordDate}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.ordNo}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.ordSeq}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-500 truncate pl-2">{row.ordNote}</TableCell>
                                <TableCell className="text-left p-1 text-gray-500 truncate pl-2">{row.invoice}</TableCell>
                            </TableRow>
                        );
                    })}
                    {data.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                          {Array.from({ length: 28 }).map((_, j) => (
                            <TableCell key={j} className={j < 27 ? "border-r border-gray-200" : ""}></TableCell>
                          ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
         </div>
      </div>
       </div>

      {/* ★ 해외문구 매입처 전용 팝업 연동 */}
      <SupplierSearchModal 
          isOpen={isSupplierModalOpen} 
          onClose={() => setIsSupplierModalOpen(false)} 
          initialSearchName={searchSupplierName || searchSupplierCode} 
          allowedCodes={OVERSEAS_STATIONERY_SUPPLIERS}
          onSelect={(item) => { setSearchSupplierCode(item.code); setSearchSupplierName(item.name); }} 
      />
    </div>
  );
}