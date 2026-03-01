import React, { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, subMonths } from 'date-fns';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];

// YYYY-MM 포맷팅 함수
const formatMonthString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
};

const MonthRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={7} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatMonthString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="month" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 7 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={7} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={endVal} onChange={(e) => onEndChange(formatMonthString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="month" className="absolute inset-0 opacity-0 cursor-pointer" value={endVal.length === 7 ? endVal : ''} onChange={(e) => onEndChange(e.target.value)} />
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

export default function AlbumSupplierReturnLimitInquiryPage() {
  const { suppliers } = useMockData();

  // 조회 영역 상태
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  const [searchMonthStart, setSearchMonthStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [searchMonthEnd, setSearchMonthEnd] = useState(format(new Date(), 'yyyy-MM'));

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // 그리드 데이터 및 상태 관리
  const [mockDB, setMockDB] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  // 초기 렌더링 시 가상의 월별 데이터베이스 구축
  useEffect(() => {
     if (suppliers && suppliers.length > 0 && mockDB.length === 0) {
         const allMonths: string[] = [];
         for(let y=2024; y<=2026; y++) {
             for(let m=1; m<=12; m++) {
                 allMonths.push(`${y}-${String(m).padStart(2, '0')}`);
             }
         }

         const initialDB: any[] = [];
         suppliers.filter(s => ALBUM_SUPPLIERS.includes(s.code)).forEach(s => {
             allMonths.forEach(month => {
                 // 가상 로직: (직전달 매입처 원가 합산) - (직전달 반품불가 상품 원가 합산) = 전월매입금액
                 const prevMonthPurchase = Math.floor(Math.random() * 40000000) + 10000000;
                 const returnRate = Math.floor(Math.random() * 10) + 5; // 5% ~ 14%
                 const calculatedLimit = Math.floor(prevMonthPurchase * (returnRate / 100));
                 const actualReturn = Math.floor(Math.random() * calculatedLimit);

                 initialDB.push({
                     id: `${month}-${s.code}`,
                     baseMonth: month,
                     supplierCode: s.code,
                     supplierName: s.name,
                     label: s.name.includes('카카오') ? '카카오M' : s.name.includes('YG') ? 'YG Ent.' : '공통레이블',
                     prevMonthPurchase: String(prevMonthPurchase),
                     returnLimit: String(calculatedLimit), // 자동계산된 반품한도금액
                     changeReason: '', // 변경사유 (30자 제한)
                     returnRate: String(returnRate), // 반품한도율
                     supplierReturn: String(calculatedLimit), // 업체제공 반품금액
                     actualReturn: String(actualReturn), // DW 연동 가상 반품실적
                 });
             });
         });
         setMockDB(initialDB);
     }
  }, [suppliers]);

  const handleSupplierCodeSearch = () => {
    if (!searchSupplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => ALBUM_SUPPLIERS.includes(s.code) && s.code === searchSupplierCode.trim());
    if (exactMatches.length === 1) setSearchSupplierName(exactMatches[0].name);
    else setIsSupplierModalOpen(true);
  };

  const handleSupplierNameSearch = () => {
    if (!searchSupplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => ALBUM_SUPPLIERS.includes(s.code) && s.name.includes(searchSupplierName.trim()));
    if (exactMatches.length === 1) { setSearchSupplierCode(exactMatches[0].code); setSearchSupplierName(exactMatches[0].name); }
    else setIsSupplierModalOpen(true);
  };

  const handleSearchReset = () => {
    setSearchSupplierCode('');
    setSearchSupplierName('');
    setSearchMonthStart(format(subMonths(new Date(), 1), 'yyyy-MM'));
    setSearchMonthEnd(format(new Date(), 'yyyy-MM'));
    setData([]);
  };

  const handleSearch = () => {
    const filtered = mockDB.filter(item => {
        if (searchSupplierCode && item.supplierCode !== searchSupplierCode) return false;
        if (searchSupplierName && !item.supplierName.includes(searchSupplierName)) return false;
        if (searchMonthStart && item.baseMonth < searchMonthStart) return false;
        if (searchMonthEnd && item.baseMonth > searchMonthEnd) return false;
        return true;
    });

    // 정렬: 기준년월 내림차순 -> 매입처코드 오름차순
    filtered.sort((a, b) => {
        if (a.baseMonth === b.baseMonth) return a.supplierCode.localeCompare(b.supplierCode);
        return b.baseMonth.localeCompare(a.baseMonth);
    });
    
    setData(JSON.parse(JSON.stringify(filtered)));
  };

  // 테이블 인풋값 변경 처리
  const handleChange = (id: string, field: string, val: string) => {
      setData(prev => prev.map(item => {
          if (item.id === id) {
              return { ...item, [field]: val };
          }
          return item;
      }));
  };

  const handleSave = () => {
      let hasChanges = false;
      
      const updatedData = data.map(item => {
          const original = mockDB.find(m => m.id === item.id);
          if (original && (original.returnLimit !== item.returnLimit || original.changeReason !== item.changeReason || original.supplierReturn !== item.supplierReturn)) {
              hasChanges = true;
          }
          return item;
      });
      
      if (!hasChanges) {
          alert("변경된 내용이 없습니다.");
          return;
      }

      setMockDB(prev => prev.map(m => {
          const updated = updatedData.find(u => u.id === m.id);
          return updated ? updated : m;
      }));
      
      setData(updatedData);
      alert("반품한도 정보가 성공적으로 저장되었습니다.");
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">음반 매입처별반품한도조회</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_2fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
             
             <Label required className="border-r border-gray-200">조회기간</Label>
             <div className="flex items-center p-1 gap-1">
                 <MonthRangeInput startVal={searchMonthStart} endVal={searchMonthEnd} onStartChange={setSearchMonthStart} onEndChange={setSearchMonthEnd} />
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
              <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
              <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>
      
      <div className="flex flex-col min-h-0 flex-1">
         <div className="erp-section-group min-h-0 flex-1">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">매입처정보</span>
             <div className="flex gap-1">
                 <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장(F6)</Button>
              </div>
          </div>
          <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
             <div className="flex-1 overflow-auto relative">
             <Table className="table-fixed min-w-[1500px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">기준년월</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처코드</TableHead>
                        <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">레이블</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">전월 매입금액</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-100">반품한도금액</TableHead>
                        <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-100">변경사유</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">반품한도율(%)</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-100">업체제공 반품금액</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">반품실적</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">반품등록차액</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 p-1">반품율(%)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => {
                      // 자동계산: 반품등록차액 = 반품한도금액 - 반품실적
                      const limitNum = Number(row.returnLimit) || 0;
                      const actualNum = Number(row.actualReturn) || 0;
                      const diffAmount = limitNum - actualNum;
                      
                      // 자동계산: 반품율(%) = 반품실적 / 반품한도금액 * 100
                      const actualReturnRate = limitNum === 0 ? 0 : ((actualNum / limitNum) * 100).toFixed(2);

                      return (
                        <TableRow key={row.id} className="h-8 hover:bg-blue-50/50 bg-white border-b border-gray-200">
                            <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-blue-700 bg-blue-50/20">{row.baseMonth}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.supplierCode}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-2">{row.supplierName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.label}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{Number(row.prevMonthPurchase).toLocaleString()}</TableCell>
                            
                            {/* 입력 가능 - 반품한도금액 */}
                            <TableCell className="text-center p-0 border-r border-gray-200 bg-yellow-50/30">
                                <Input 
                                    className="h-full w-full border-none text-right px-2 text-[12px] font-bold text-red-600 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                    value={row.returnLimit} 
                                    onChange={(e) => handleChange(row.id, 'returnLimit', e.target.value.replace(/[^0-9]/g, ''))} 
                                />
                            </TableCell>

                            {/* 입력 가능 - 변경사유 (최대 30자) */}
                            <TableCell className="text-center p-0 border-r border-gray-200 bg-yellow-50/30">
                                <Input 
                                    className="h-full w-full border-none text-left px-2 text-[12px] text-gray-900 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                    maxLength={30}
                                    value={row.changeReason} 
                                    onChange={(e) => handleChange(row.id, 'changeReason', e.target.value)} 
                                />
                            </TableCell>

                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.returnRate}</TableCell>
                            
                            {/* 입력 가능 - 업체제공 반품금액 */}
                            <TableCell className="text-center p-0 border-r border-gray-200 bg-yellow-50/30">
                                <Input 
                                    className="h-full w-full border-none text-right px-2 text-[12px] font-bold text-blue-600 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                    value={row.supplierReturn} 
                                    onChange={(e) => handleChange(row.id, 'supplierReturn', e.target.value.replace(/[^0-9]/g, ''))} 
                                />
                            </TableCell>

                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2 bg-gray-50">{actualNum.toLocaleString()}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-gray-800 pr-2 bg-gray-50">{diffAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right p-1 font-bold text-gray-800 pr-2 bg-gray-50">{actualReturnRate}</TableCell>
                        </TableRow>
                      );
                    })}
                    {data.length === 0 && Array.from({ length: 10 }).map((_, i) => (
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
      </div>

      <SupplierSearchModal 
          isOpen={isSupplierModalOpen} 
          onClose={() => setIsSupplierModalOpen(false)} 
          initialSearchName={searchSupplierName || searchSupplierCode} 
          allowedCodes={ALBUM_SUPPLIERS}
          onSelect={(item) => { 
              setSearchSupplierCode(item.code); 
              setSearchSupplierName(item.name); 
          }} 
      />
    </div>
  );
}