import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];

// ★ 이전 버전으로 롤백된 직관적인 월 단위(Month) 선택 컴포넌트
const MonthRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[120px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden px-1">
        <input type="month" className="h-full flex-1 border-none outline-none text-[11px] text-center bg-transparent cursor-pointer" value={startVal} onChange={(e) => onStartChange(e.target.value)} onFocus={(e) => e.target.select()} />
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[120px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden px-1">
        <input type="month" className="h-full flex-1 border-none outline-none text-[11px] text-center bg-transparent cursor-pointer" value={endVal} onChange={(e) => onEndChange(e.target.value)} onFocus={(e) => e.target.select()} />
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

export default function AlbumSupplierReturnRatePage() {
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
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

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
                 initialDB.push({
                     id: `${month}-${s.code}`,
                     baseMonth: month,
                     supplierCode: s.code,
                     supplierName: s.name,
                     returnRate: Math.floor(Math.random() * 10) + 5,
                     modifier: '12951',
                     modDate: `${month.replace('-', '.')}.01`
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
    setSelectedIds([]);
    setIsEditMode(false);
  };

  const handleSearch = () => {
    const filtered = mockDB.filter(item => {
        if (searchSupplierCode && item.supplierCode !== searchSupplierCode) return false;
        if (searchSupplierName && !item.supplierName.includes(searchSupplierName)) return false;
        if (searchMonthStart && item.baseMonth < searchMonthStart) return false;
        if (searchMonthEnd && item.baseMonth > searchMonthEnd) return false;
        return true;
    });

    filtered.sort((a, b) => {
        if (a.baseMonth === b.baseMonth) return a.supplierCode.localeCompare(b.supplierCode);
        return b.baseMonth.localeCompare(a.baseMonth);
    });
    
    setData(JSON.parse(JSON.stringify(filtered)));
    setSelectedIds([]);
    setIsEditMode(false);
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedIds(data.map(item => item.id));
      else setSelectedIds([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedIds(prev => [...prev, id]);
      else setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  // ★ [변경] 버튼 클릭 로직
  const handleEditMode = () => {
      if (selectedIds.length === 0) {
          alert("변경할 항목을 먼저 체크박스로 선택해주세요.");
          return;
      }
      setIsEditMode(true);
  };

  const handleEditChange = (id: string, val: string) => {
      setData(prev => prev.map(item => item.id === id ? { ...item, returnRate: val.replace(/[^0-9]/g, '') } : item));
  };

  // ★ [저장] 로직: 선택된 항목만 엎어치기
  const handleSave = () => {
      if (!isEditMode) return;
      if (selectedIds.length === 0) return alert("저장할 항목이 선택되지 않았습니다.");
      
      const today = format(new Date(), 'yyyy.MM.dd'); 
      let hasChanges = false;
      
      const updatedData = data.map(item => {
          if (selectedIds.includes(item.id)) {
              const original = mockDB.find(m => m.id === item.id);
              if (original && String(original.returnRate) !== String(item.returnRate)) {
                  hasChanges = true;
                  return { ...item, modifier: '12951', modDate: today };
              }
          }
          return item;
      });
      
      if (!hasChanges) {
          alert("변경된 내용이 없습니다.");
          setIsEditMode(false);
          return;
      }

      setMockDB(prev => prev.map(m => {
          const updated = updatedData.find(u => u.id === m.id);
          return updated ? updated : m;
      }));
      
      setData(updatedData);
      setIsEditMode(false);
      setSelectedIds([]); // 저장 후 체크 해제
      alert("선택된 항목의 반품한도율이 성공적으로 저장되었습니다.");
  };

  const handleExcelDownload = () => {
      if (data.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = data.map(row => ({
          '기준년월': row.baseMonth,
          '매입처코드': row.supplierCode,
          '매입처명': row.supplierName,
          '반품한도(%)': row.returnRate,
          '최종변경사번': row.modifier,
          '최종변경일': row.modDate
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "매입처별반품율");
      XLSX.writeFile(wb, "음반매입처별_반품율관리.xlsx");
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">음반 매입처별 반품율 관리</h2>
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
                 <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운로드</Button>
                 <Button variant="outline" className={actionBtnClass} onClick={handleEditMode}>변경</Button>
                 <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장</Button>
              </div>
          </div>
          <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
            <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[1000px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead className="w-[40px] text-center border-r border-gray-300 p-1">
                            <div className="flex justify-center items-center w-full h-full">
                                <Checkbox className="h-4 w-4 rounded-[2px]" checked={isAllSelected} onCheckedChange={(c) => handleSelectAll(!!c)} />
                            </div>
                        </TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">기준년월</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처코드</TableHead>
                        <TableHead className="w-[280px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">반품한도(%)</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">최종변경사번</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 p-1">최종변경일</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => {
                      const isSelected = selectedIds.includes(row.id);
                      return (
                        <TableRow key={row.id} className={cn("h-8 hover:bg-blue-50/50 bg-white border-b border-gray-200", isSelected && "bg-blue-50")}>
                            <TableCell className="text-center p-0 border-r border-gray-200">
                                <div className="flex justify-center items-center w-full h-full">
                                    <Checkbox className="h-4 w-4 rounded-[2px]" checked={isSelected} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} />
                                </div>
                            </TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-blue-700 bg-blue-50/20">{row.baseMonth}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.supplierCode}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-4">{row.supplierName}</TableCell>
                            
                            {/* ★ 편집 모드일 때 선택된 행만 Input으로 바뀜 */}
                            <TableCell className="text-center p-0 border-r border-gray-200 bg-yellow-50/30">
                                {isEditMode && isSelected ? (
                                    <Input 
                                        className="h-full w-full border-none text-center px-2 text-[12px] font-bold text-red-600 bg-white focus-visible:ring-1 focus-visible:ring-blue-500 shadow-[inset_0_0_0_1px_#3b82f6]" 
                                        value={row.returnRate} 
                                        onChange={(e) => handleEditChange(row.id, e.target.value)} 
                                    />
                                ) : (
                                    <span className="font-bold text-gray-900">{row.returnRate}</span>
                                )}
                            </TableCell>
                            
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.modifier}</TableCell>
                            <TableCell className="text-center p-1 text-gray-500">{row.modDate}</TableCell>
                        </TableRow>
                      );
                    })}
                    {data.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j} className={j < 6 ? "border-r border-gray-200" : ""}></TableCell>
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