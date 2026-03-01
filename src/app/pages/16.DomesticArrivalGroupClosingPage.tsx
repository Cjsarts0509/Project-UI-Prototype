import React, { useState, useEffect } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';

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

// ★ 매입율 역계산 팝업 컴포넌트
function RateCalcPopup({ 
    isOpen, 
    onClose, 
    ea, 
    listPrice, 
    currentRate, 
    onApply 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    ea: number, 
    listPrice: number, 
    currentRate: string, 
    onApply: (rate: string, costTotal: number) => void 
}) {
    const [inputCostTotal, setInputCostTotal] = useState('');
    const [calcRate, setCalcRate] = useState('0.00');
    const [calcUnitCost, setCalcUnitCost] = useState('0');

    useEffect(() => {
        if (isOpen) {
            setInputCostTotal('');
            setCalcRate('0.00');
            setCalcUnitCost('0');
        }
    }, [isOpen]);

    const handleCalculate = () => {
        const numCost = Number(inputCostTotal.replace(/[^0-9]/g, '')) || 0;
        if (ea > 0 && listPrice > 0 && numCost > 0) {
            const calculatedRate = (numCost / (ea * listPrice)) * 100;
            const unitCost = numCost / ea;
            
            setCalcRate(calculatedRate.toFixed(2));
            setCalcUnitCost(Math.round(unitCost).toLocaleString());
        } else {
            setCalcRate('0.00');
            setCalcUnitCost('0');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-[4px] shadow-2xl w-[350px] flex flex-col overflow-hidden text-[12px] font-sans border border-gray-400">
                <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
                    <span className="font-bold text-[13px]">매입율 계산</span>
                    <button onClick={onClose} className="hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="p-4 flex flex-col gap-2 bg-[#fefefe]">
                    <div className="flex items-center gap-2">
                        <span className="w-20 font-bold text-gray-700">수량(EA)</span>
                        <Input className="h-7 flex-1 text-right bg-gray-100 border-gray-300" value={ea.toLocaleString()} readOnly disabled />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-20 font-bold text-gray-700">정가</span>
                        <Input className="h-7 flex-1 text-right bg-gray-100 border-gray-300" value={listPrice.toLocaleString()} readOnly disabled />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-20 font-bold text-gray-700">현재 매입율</span>
                        <Input className="h-7 flex-1 text-right bg-gray-100 border-gray-300" value={currentRate ? `${currentRate}%` : ''} readOnly disabled />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-20 font-bold text-blue-700">원가합계 입력</span>
                        <Input 
                            className="h-7 flex-1 text-right font-bold focus-visible:ring-2 focus-visible:ring-blue-500 border-blue-400" 
                            value={inputCostTotal ? Number(inputCostTotal).toLocaleString() : ''} 
                            onChange={(e) => setInputCostTotal(e.target.value.replace(/[^0-9]/g, ''))} 
                            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                            placeholder="0" 
                            autoFocus 
                        />
                    </div>
                    
                    <div className="flex justify-end mt-1 mb-2">
                        <Button className="erp-btn-action" onClick={handleCalculate}>계산실행</Button>
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-24 font-bold text-gray-700">1개당 상품원가</span>
                            <Input className="h-7 flex-1 text-right font-bold text-red-600 bg-red-50 border-red-200" value={calcUnitCost} readOnly disabled />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-24 font-bold text-gray-700">계산된 매입율</span>
                            <div className="relative flex-1">
                                <Input className="h-7 w-full text-right font-bold text-blue-700 bg-blue-50 border-blue-200 pr-5" value={calcRate} readOnly disabled />
                                <span className="absolute right-2 top-1.5 text-blue-700 font-bold text-[11px]">%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="erp-modal-footer">
                    <Button className="erp-btn-action" onClick={() => { 
                        if (Number(calcRate) === 0) return alert("먼저 계산을 실행해주세요.");
                        onApply(calcRate, Number(inputCostTotal)); 
                        onClose(); 
                    }}>적용</Button>
                    <Button className="erp-btn-header" onClick={onClose}>취소</Button>
                </div>
            </div>
        </div>
    );
}

export default function DomesticArrivalGroupClosingPage() {
  const { products, suppliers } = useMockData();

  // 조회 필드 상태
  const [searchDateStart, setSearchDateStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchDateEnd, setSearchDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState('02'); 
  const [productType, setProductType] = useState('album'); 
  const [groupCode, setGroupCode] = useState('all');
  const [errorYn, setErrorYn] = useState('all');
  const [confirmYn, setConfirmYn] = useState('all');

  const [searchProductCode, setSearchProductCode] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');

  // 체크박스 및 일괄적용 상태
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchPurType, setBatchPurType] = useState('일시');
  const [batchRate, setBatchRate] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  
  // 계산 팝업 상태
  const [calcPopupState, setCalcPopupState] = useState<{isOpen: boolean, rowId: string, ea: number, listPrice: number, currentRate: string}>({ 
      isOpen: false, rowId: '', ea: 0, listPrice: 0, currentRate: '' 
  });

  const [data, setData] = useState<any[]>([]);

  const generateMockData = () => {
      if (!products || products.length === 0) return [];
      
      const isStationery = productType === 'stationery';
      let baseProducts = products.filter(p => isStationery ? p.groupCategory?.includes('문구') : p.groupCategory?.includes('음반'));
      
      if (baseProducts.length === 0) baseProducts = products.slice(0, 30);

      const shuffled = baseProducts.sort(() => 0.5 - Math.random()).slice(0, 15);
      const validPurTypes = ['일시', '한도', '위탁']; 

      return shuffled.map((p, idx) => {
          const isError = Math.random() > 0.8;
          const ea = Math.floor(Math.random() * 50) + 1;
          const price = parseInt(String(p.listPrice).replace(/[^0-9]/g, '')) || 15000;
          const listTotal = ea * price;
          const rate = Math.floor(Math.random() * 20) + 60; 
          const costTotal = Math.floor(listTotal * (rate / 100));

          const stmtRate = isError ? rate + 5 : rate;
          const stmtCostTotal = isError ? Math.floor(listTotal * (stmtRate / 100)) : costTotal;
          
          const randomPurType = validPurTypes[Math.floor(Math.random() * validPurTypes.length)];
          
          return {
              id: `arr-${idx}`,
              no: idx + 1,
              arrivalDate: format(new Date(), 'yyyy-MM-dd'),
              receiptNo: `RC${format(new Date(), 'yyyyMMdd')}${String(idx+1).padStart(3, '0')}`,
              pCode: p.productCode,
              pName: p.productName,
              group: p.groupCategory || (isStationery ? '문구' : '가요'),
              sCode: p.supplierCode || 'S001',
              sName: p.supplierName || '테스트매입처',
              companyName: p.supplierName || '테스트매입처',
              sPurType: randomPurType,
              orderApplyType: '기본',
              ea: ea,
              listPrice: price,
              
              ordRate: rate,
              ordListTotal: listTotal,
              ordCostTotal: costTotal,
              
              stmtPurType: randomPurType,
              stmtRate: stmtRate,
              stmtListTotal: listTotal,
              stmtCostTotal: stmtCostTotal,
              
              arrPurType: randomPurType,
              arrRate: String(stmtRate), 
              arrListTotal: listTotal, // 입하(수정) 정가합계
              arrCostTotal: stmtCostTotal, // 입하(수정) 원가합계
              
              edit: isError ? 'Y' : '',
              error: isError ? 'Y' : 'N',
              exception: 'N',
              transactionStmt: `TS${format(new Date(), 'yyyyMMdd')}${String(idx+1).padStart(3, '0')}`,
              manager: p.registrant || '시스템'
          };
      });
  };

  const handleSearch = () => {
      const mockResult = generateMockData().filter(item => {
          if (errorYn !== 'all' && item.error !== errorYn) return false;
          if (searchProductCode && !item.pCode.includes(searchProductCode)) return false;
          if (searchSupplierCode && !item.sCode.includes(searchSupplierCode)) return false;
          return true;
      });
      setData(mockResult);
      setSelectedIds([]); 
  };

  const handleSearchReset = () => {
      setSearchDateStart(format(new Date(), 'yyyy-MM-dd'));
      setSearchDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setLocation('02');
      setProductType('album');
      setGroupCode('all');
      setErrorYn('all');
      setConfirmYn('all');
      setSearchProductCode(''); setSearchProductName('');
      setSearchSupplierCode(''); setSearchSupplierName('');
      setData([]);
      setSelectedIds([]);
  };

  const handleProductCodeSearch = () => {
      if (!searchProductCode.trim()) { setIsProductModalOpen(true); return; }
      const exactMatches = (products || []).filter(p => p.productCode === searchProductCode.trim());
      if (exactMatches.length === 1) setSearchProductName(exactMatches[0].productName);
      else setIsProductModalOpen(true);
  };

  const handleProductNameSearch = () => {
      if (!searchProductName.trim()) { setIsProductModalOpen(true); return; }
      const exactMatches = (products || []).filter(p => p.productName.includes(searchProductName.trim()));
      if (exactMatches.length === 1) { setSearchProductCode(exactMatches[0].productCode); setSearchProductName(exactMatches[0].productName); }
      else setIsProductModalOpen(true);
  };

  const handleSupplierCodeSearch = () => {
      if (!searchSupplierCode.trim()) { setIsSupplierModalOpen(true); return; }
      const exactMatches = (suppliers || []).filter(s => s.code === searchSupplierCode.trim());
      if (exactMatches.length === 1) setSearchSupplierName(exactMatches[0].name);
      else setIsSupplierModalOpen(true);
  };

  const handleSupplierNameSearch = () => {
      if (!searchSupplierName.trim()) { setIsSupplierModalOpen(true); return; }
      const exactMatches = (suppliers || []).filter(s => s.name.includes(searchSupplierName.trim()));
      if (exactMatches.length === 1) { setSearchSupplierCode(exactMatches[0].code); setSearchSupplierName(exactMatches[0].name); }
      else setIsSupplierModalOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedIds(data.map(item => item.id));
      else setSelectedIds([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedIds(prev => [...prev, id]);
      else setSelectedIds(prev => prev.filter(vid => vid !== id));
  };

  const handleRowChange = (id: string, field: string, val: string) => {
      setData(prev => prev.map(item => {
          if (item.id === id) {
              const updated = { ...item, [field]: val };
              // 매입율을 직접 수정했을 경우 원가합계 자동 재계산
              if (field === 'arrRate') {
                  const newRate = Number(val) || 0;
                  updated.arrCostTotal = Math.round(item.ea * item.listPrice * (newRate / 100));
              }
              return updated;
          }
          return item;
      }));
  };

  const handleApplyCalc = (id: string, rate: string, costTotal: number) => {
      setData(prev => prev.map(item => item.id === id ? { ...item, arrRate: rate, arrCostTotal: costTotal } : item));
  };

  const handleApplyBatchPurType = () => {
      if (selectedIds.length === 0) return alert('항목을 먼저 체크박스로 선택해주세요.');
      setData(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, arrPurType: batchPurType } : item));
  };

  const handleApplyBatchRate = () => {
      if (selectedIds.length === 0) return alert('항목을 먼저 체크박스로 선택해주세요.');
      if (!batchRate) return alert('매입율을 입력해주세요.');
      setData(prev => prev.map(item => {
          if (selectedIds.includes(item.id)) {
              const newRate = Number(batchRate) || 0;
              const newCost = Math.round(item.ea * item.listPrice * (newRate / 100));
              return { ...item, arrRate: batchRate, arrCostTotal: newCost };
          }
          return item;
      }));
  };

  const handleExcelDownload = () => {
      if (data.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = data.map(r => ({
          'No': r.no, '입하일자': r.arrivalDate, '인수번호': r.receiptNo, '상품코드': r.pCode, '상품명': r.pName,
          '조': r.group, '매입처코드': r.sCode, '매입처명': r.sName, '업체명': r.companyName, 
          '매입처 매입구분': r.sPurType, '발주기준 적용구분': r.orderApplyType, 'EA': r.ea, '정가': r.listPrice,
          '발주 매입율': r.ordRate, '발주 정가합계': r.ordListTotal, '발주 원가합계': r.ordCostTotal,
          '명세서 매입구분': r.stmtPurType, '명세서 매입율': r.stmtRate, '명세서 정가합계': r.stmtListTotal, '명세서 원가합계': r.stmtCostTotal,
          '입하 매입구분': r.arrPurType, '입하 매입율': r.arrRate, '입하 정가합계': r.arrListTotal, '입하 원가합계': r.arrCostTotal,
          '수정': r.edit, '오차': r.error, '담당자': r.manager
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "국내입하조별마감");
      XLSX.writeFile(wb, "국내입하조별마감내역.xlsx");
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">국내입하조별마감 (문구/음반)</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1.5fr] border-b border-gray-200">
             <Label required className="border-r border-gray-200">입하기간</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={searchDateStart} endVal={searchDateEnd} onStartChange={setSearchDateStart} onEndChange={setSearchDateEnd} />
             </div>
             
             <Label className="border-r border-gray-200">입하처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="02">파주물류센터(02)</SelectItem>
                        <SelectItem value="50">[본사]매장전체(50)</SelectItem>
                    </SelectContent>
                 </Select>
             </div>

             <Label required className="border-r border-gray-200">상품구분</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={productType} onValueChange={(val) => { setProductType(val); setGroupCode('all'); }}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="album">음반/영상(국내)</SelectItem>
                        <SelectItem value="stationery">문구/GIFT(국내)</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">조코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={groupCode} onValueChange={setGroupCode}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {productType === 'album' && (
                            <SelectItem value="M1">음반/영상</SelectItem>
                        )}
                        {productType === 'stationery' && (
                            <>
                                <SelectItem value="S1">학용품</SelectItem>
                                <SelectItem value="S2">미술전문용품</SelectItem>
                                <SelectItem value="S3">사무용품</SelectItem>
                                <SelectItem value="S4">고급다이어리</SelectItem>
                                <SelectItem value="S5">고급필기구</SelectItem>
                                <SelectItem value="S6">필기구</SelectItem>
                                <SelectItem value="S7">디자인문구</SelectItem>
                                <SelectItem value="T1">디지털</SelectItem>
                                <SelectItem value="T2">디자인상품</SelectItem>
                                <SelectItem value="T3">일상소품</SelectItem>
                                <SelectItem value="U1">식품</SelectItem>
                            </>
                        )}
                    </SelectContent>
                 </Select>
             </div>
             
             <Label className="border-r border-gray-200">오차여부</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={errorYn} onValueChange={setErrorYn}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                 </Select>
             </div>

             <Label className="border-r border-gray-200">구매확인여부</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={confirmYn} onValueChange={setConfirmYn}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1.5fr]">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-24 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={searchProductCode}
                 onChange={(e) => setSearchProductCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">인수번호</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
             
             <div className="col-span-2 bg-white"></div>
          </div>
       </div>
       <div className="erp-search-actions">
                <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
                <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
       </div>
       </div>
       
       <div className="erp-section-group flex-1 min-h-0 flex flex-col">
       <div className="erp-section-toolbar">
           <div className="erp-section-title">국내입하 내역</div>
           <div className="flex gap-1">
              <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운로드</Button>
           </div>
       </div>
       <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
         <div className="flex items-center p-2 border-b border-gray-300 flex-shrink-0">
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <Select value={batchPurType} onValueChange={setBatchPurType}>
                        <SelectTrigger className="h-6 w-[80px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="일시">일시</SelectItem>
                            <SelectItem value="한도">한도</SelectItem>
                            <SelectItem value="위탁">위탁</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-6 px-3 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={handleApplyBatchPurType}>매입구분일괄적용</Button>
                </div>
                
                <span className="text-gray-300 ml-2 mr-2">|</span>
                
                <Input 
                    className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300 text-right focus-visible:ring-1 focus-visible:ring-blue-500" 
                    placeholder="0.00" 
                    value={batchRate} 
                    onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = val.split('.');
                        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                        if (parts[0].length > 2) parts[0] = parts[0].slice(0, 2);
                        if (parts.length > 1 && parts[1].length > 2) parts[1] = parts[1].slice(0, 2);
                        val = parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
                        setBatchRate(val);
                    }} 
                />
                <span className="text-gray-600 font-bold text-[11px]">%</span>
                <Button variant="outline" className="h-6 px-3 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={handleApplyBatchRate}>매입율일괄적용</Button>
             </div>
          </div>
         <div className="flex-1 overflow-auto relative">
            {/* ★ 컬럼 추가(정가합계/원가합계)로 인해 최소 넓이 3200px로 확대 */}
            <Table className="table-fixed min-w-[3200px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead className="w-[40px] text-center border-r border-b border-gray-300 p-1" rowSpan={2}>
                            <div className="flex justify-center items-center w-full h-full">
                                <Checkbox className="h-4 w-4 rounded-[2px]" checked={isAllSelected} onCheckedChange={(c) => handleSelectAll(!!c)} />
                            </div>
                        </TableHead>
                        <TableHead rowSpan={2} className="w-[50px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">No</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">입하일자</TableHead>
                        <TableHead rowSpan={2} className="w-[120px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">인수번호</TableHead>
                        <TableHead rowSpan={2} className="w-[120px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품코드</TableHead>
                        <TableHead rowSpan={2} className="w-[200px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품명</TableHead>
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">조코드</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처<br/>코드</TableHead>
                        <TableHead rowSpan={2} className="w-[150px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처명</TableHead>
                        <TableHead rowSpan={2} className="w-[150px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">업체명</TableHead>
                        <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처<br/>매입구분</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">발주기준<br/>적용구분</TableHead>
                        <TableHead rowSpan={2} className="w-[60px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">EA</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">정가</TableHead>
                        
                        <TableHead colSpan={3} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-yellow-50">발주</TableHead>
                        <TableHead colSpan={4} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-blue-50">명세서</TableHead>
                        
                        {/* ★ 입하(수정) 컬럼 확장: 매입구분, 매입율, 정가합계, 원가합계 */}
                        <TableHead colSpan={4} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-green-50">입하(수정)</TableHead>
                        
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입율계산</TableHead>
                        <TableHead rowSpan={2} className="w-[60px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">수정</TableHead>
                        <TableHead rowSpan={2} className="w-[60px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">오차</TableHead>
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">예외상품</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">거래명세서</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-b border-gray-300 p-1">담당자</TableHead>
                    </TableRow>
                    <TableRow className="bg-[#f4f4f4] h-8 shadow-[0_1px_0_0_#d1d5db]">
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">매입율</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">정가합계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">원가합계</TableHead>

                        <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">매입구분</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">매입율</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">정가합계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">원가합계</TableHead>

                        <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">매입구분</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">매입율</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">정가합계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">원가합계</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => {
                        const isChecked = selectedIds.includes(row.id);
                        return (
                            <TableRow key={row.id} className={cn("h-8 border-b border-gray-200 hover:bg-blue-50/50 bg-white", isChecked && "bg-blue-50")}>
                                <TableCell className="text-center p-0 border-r border-gray-200">
                                    <div className="flex justify-center items-center w-full h-full" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox className="h-4 w-4 rounded-[2px]" checked={isChecked} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} />
                                    </div>
                                </TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.no}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 font-bold">{row.arrivalDate}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.receiptNo}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.pCode}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-2">{row.pName}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.group}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sCode}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate pl-2">{row.sName}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate pl-2">{row.companyName}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sPurType}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.orderApplyType}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 pr-2 font-bold">{row.ea}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{Number(row.listPrice).toLocaleString()}</TableCell>
                                
                                {/* 발주 */}
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-yellow-50/20">{row.ordRate}%</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-yellow-50/20">{Number(row.ordListTotal).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-yellow-50/20">{Number(row.ordCostTotal).toLocaleString()}</TableCell>

                                {/* 명세서 */}
                                <TableCell className="text-center p-1 border-r border-gray-200 bg-blue-50/20">{row.stmtPurType}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-blue-50/20">{row.stmtRate}%</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-blue-50/20">{Number(row.stmtListTotal).toLocaleString()}</TableCell>
                                <TableCell className={cn("text-right p-1 border-r border-gray-200 pr-2 font-bold", row.error === 'Y' ? 'text-red-600 bg-red-50/20' : 'text-gray-800 bg-blue-50/20')}>{Number(row.stmtCostTotal).toLocaleString()}</TableCell>

                                {/* 입하(수정) 영역 */}
                                <TableCell className="text-center p-0 border-r border-gray-200 bg-green-50/30">
                                    <Select value={row.arrPurType} onValueChange={(val) => handleRowChange(row.id, 'arrPurType', val)}>
                                        <SelectTrigger className="h-full w-full border-none shadow-none text-center bg-transparent rounded-none focus:ring-1 focus:ring-blue-500 h-8 px-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="일시">일시</SelectItem>
                                            <SelectItem value="한도">한도</SelectItem>
                                            <SelectItem value="위탁">위탁</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right p-0 border-r border-gray-200 bg-green-50/30">
                                    <div className="relative flex items-center h-full">
                                        <Input 
                                            className="h-full w-full border-none text-right pr-4 text-[12px] font-bold text-blue-600 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                            value={row.arrRate} 
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = val.split('.');
                                                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                                                if (parts[0].length > 2) parts[0] = parts[0].slice(0, 2);
                                                if (parts.length > 1 && parts[1].length > 2) parts[1] = parts[1].slice(0, 2);
                                                val = parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
                                                handleRowChange(row.id, 'arrRate', val);
                                            }} 
                                        />
                                        <span className="absolute right-1 text-[10px] text-blue-600 font-bold">%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-green-50/20">{Number(row.arrListTotal).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-blue-700 bg-green-50/20">{Number(row.arrCostTotal).toLocaleString()}</TableCell>

                                {/* 기능 버튼 영역 */}
                                <TableCell className="text-center p-1 border-r border-gray-200">
                                    <Button variant="outline" className="h-6 px-2 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={() => setCalcPopupState({ isOpen: true, rowId: row.id, ea: row.ea, listPrice: row.listPrice, currentRate: row.arrRate })}>계산</Button>
                                </TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-blue-600">{row.edit}</TableCell>
                                <TableCell className={cn("text-center p-1 border-r border-gray-200 font-bold", row.error === 'Y' ? 'text-red-600' : 'text-gray-400')}>{row.error}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200">
                                    <Button variant="outline" className="h-6 px-2 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={() => alert('상품매입율관리 페이지로 이동합니다.')}>예외상품</Button>
                                </TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">
                                    <Button variant="outline" className="h-6 px-2 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={() => alert(`${row.transactionStmt} 거래명세서 팝업을 띄웁니다.`)}>명세서</Button>
                                </TableCell>
                                <TableCell className="text-center p-1 text-gray-500">{row.manager}</TableCell>
                            </TableRow>
                        );
                    })}
                    {data.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                          {Array.from({ length: 29 }).map((_, j) => (
                            <TableCell key={j} className={j < 28 ? "border-r border-gray-200" : ""}></TableCell>
                          ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
         </div>
      </div>
      </div>

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={searchProductName || searchProductCode} onSelect={(item) => { setSearchProductCode(item.productCode); setSearchProductName(item.productName); }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={searchSupplierName || searchSupplierCode} onSelect={(item) => { setSearchSupplierCode(item.code); setSearchSupplierName(item.name); }} />
      
      <RateCalcPopup 
          isOpen={calcPopupState.isOpen} 
          onClose={() => setCalcPopupState(p => ({ ...p, isOpen: false }))} 
          ea={calcPopupState.ea}
          listPrice={calcPopupState.listPrice}
          currentRate={calcPopupState.currentRate}
          onApply={(rate, costTotal) => handleApplyCalc(calcPopupState.rowId, rate, costTotal)}
      />
    </div>
  );
}