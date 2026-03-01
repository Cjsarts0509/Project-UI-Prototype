import React, { useState } from 'react';
import { Calendar, Search, Download, Save, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, addDays, differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

const STORE_CODES = [
  { code: "001", name: "광화문점" }, { code: "002", name: "대전점" }, { code: "003", name: "원그로브점" },
  { code: "004", name: "대구점" }, { code: "005", name: "부산점" }, { code: "013", name: "부천점" },
  { code: "015", name: "강남점" }, { code: "023", name: "건대스타시티점" }, { code: "024", name: "세종점" }
];

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const DateRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatDateString(e.target.value))} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 10 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={endVal} onChange={(e) => onEndChange(formatDateString(e.target.value))} placeholder="YYYY-MM-DD" />
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

type GridData = {
    id: string;
    suppCode: string;
    suppName: string;
    status: string;
    manager: string;
    contact: string;
    displayStart: string;
    displayEnd: string;
    sales1M: number;
    sales2M: number;
    sales3M: number;
    totalAmount3M: number;
    returnDate: string;
    dDayStr: string;
    modDate: string;
    note: string;
};

export default function StoreDisplayManagementPage() {
  const { suppliers } = useMockData();
  
  // ★ 특정매입(503) 매입처 필터링
  const specificSuppliers = suppliers.filter(s => s.purchaseTypeCode === 503);

  // 1. 조회 조건
  const [sStore, setSStore] = useState('001');
  const [sYear, setSYear] = useState('2026');

  // 2. 폼 입력 영역
  const initialForm = { suppCode: '', suppName: '', start: '', end: '', note: '' };
  const [form, setForm] = useState(initialForm);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // 3. 그리드 데이터
  const [gridData, setGridData] = useState<GridData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [searchSuppName, setSearchSuppName] = useState('');

  // -------------------------------------------------------------------
  // [조회 영역 핸들러]
  // -------------------------------------------------------------------
  const handleSearch = () => {
      // 선택된 년도에 맞는 모의 데이터 생성
      const mockData = specificSuppliers.slice(0, 10).map((s, i) => {
          // 모의 누적 판매량 산출
          const m1 = Math.floor(Math.random() * 50) + 10;
          const m2 = m1 + Math.floor(Math.random() * 40); // 1~2개월 누적
          const m3 = m2 + Math.floor(Math.random() * 30); // 1~3개월 누적
          const amt = m3 * (Math.floor(Math.random() * 5000) + 5000);

          const startD = `${sYear}-01-15`;
          const endD = `${sYear}-06-30`;
          
          const returnD = format(addDays(new Date(endD), 30), 'yyyy-MM-dd');
          const dDayNum = differenceInDays(new Date(returnD), new Date());
          const dDayStr = dDayNum >= 0 ? `D-${dDayNum}` : `D+${Math.abs(dDayNum)}`;

          return {
              id: `row-${i}`,
              suppCode: s.code,
              suppName: s.name,
              status: s.statusCode === '002' ? '정상' : '거래중지',
              manager: '김담당',
              contact: '010-1234-5678',
              displayStart: startD,
              displayEnd: endD,
              sales1M: m1,
              sales2M: m2,
              sales3M: m3,
              totalAmount3M: amt,
              returnDate: returnD,
              dDayStr,
              modDate: format(new Date(), 'yyyy-MM-dd'),
              note: ''
          };
      });

      setGridData(mockData);
      setSelectedRows([]);
      setForm(initialForm);
      setActiveRowId(null);
  };

  const handleReset = () => {
      setSStore('001'); setSYear('2026');
      setGridData([]); setSelectedRows([]);
      setForm(initialForm); setActiveRowId(null);
  };

  // -------------------------------------------------------------------
  // [입력 폼 핸들러]
  // -------------------------------------------------------------------
  const handleSupplierSearch = () => {
      const query = form.suppName.trim();
      if (!query) { setSearchSuppName(''); setIsSuppModalOpen(true); return; }
      const exactMatches = specificSuppliers.filter(s => s.name === query || s.code === query);
      if (exactMatches.length === 1) {
          setForm(p => ({ ...p, suppCode: exactMatches[0].code, suppName: exactMatches[0].name }));
      } else {
          setSearchSuppName(query); setIsSuppModalOpen(true);
      }
  };

  const handleFormSave = () => {
      if (!form.suppCode || !form.start || !form.end) return alert("매입처와 진열시작/종료일자는 필수 입력값입니다.");

      const s = suppliers.find(x => x.code === form.suppCode);
      if (!s || s.purchaseTypeCode !== 503) return alert("선택된 매입처가 특정매입 매입처가 아닙니다.");

      const returnD = format(addDays(new Date(form.end), 30), 'yyyy-MM-dd');
      const dDayNum = differenceInDays(new Date(returnD), new Date());
      const dDayStr = dDayNum >= 0 ? `D-${dDayNum}` : `D+${Math.abs(dDayNum)}`;
      const modD = format(new Date(), 'yyyy-MM-dd');

      if (activeRowId) {
          // 기존 행 ���데이트
          setGridData(prev => prev.map(r => r.id === activeRowId ? {
              ...r, suppCode: s.code, suppName: s.name, displayStart: form.start, displayEnd: form.end,
              returnDate: returnD, dDayStr, modDate: modD, note: form.note
          } : r));
          alert("진열 정보가 성공적으로 수정되었습니다.");
      } else {
          // 신규 행 추가 (판매량은 0으로 초기화)
          const newRow: GridData = {
              id: `row-${Date.now()}`, suppCode: s.code, suppName: s.name,
              status: s.statusCode === '002' ? '정상' : '거래중지', manager: '김담당', contact: '010-1234-5678',
              displayStart: form.start, displayEnd: form.end, sales1M: 0, sales2M: 0, sales3M: 0, totalAmount3M: 0,
              returnDate: returnD, dDayStr, modDate: modD, note: form.note
          };
          setGridData(prev => [newRow, ...prev]);
          alert("신규 점포진열 정보가 저장되었습니다.");
      }
      
      setForm(initialForm);
      setActiveRowId(null);
  };

  // -------------------------------------------------------------------
  // [그리드 제어 핸들러]
  // -------------------------------------------------------------------
  const handleGridRowClick = (row: GridData) => {
      setActiveRowId(row.id);
      setForm({
          suppCode: row.suppCode, suppName: row.suppName, start: row.displayStart, end: row.displayEnd, note: row.note
      });
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedRows(gridData.map(r => r.id));
      else setSelectedRows([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedRows(prev => [...prev, id]);
      else setSelectedRows(prev => prev.filter(rId => rId !== id));
  };

  const handleDelete = () => {
      if (selectedRows.length === 0) return alert("삭제할 대상을 선택해주세요.");
      setGridData(prev => prev.filter(r => !selectedRows.includes(r.id)));
      setSelectedRows([]);
      setForm(initialForm); setActiveRowId(null);
  };

  const handleExcelDownload = () => {
      if (gridData.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const ws = XLSX.utils.json_to_sheet(gridData.map(r => ({
          '매입처코드': r.suppCode, '매입처명': r.suppName, '상태': r.status, '담당자': r.manager, '연락처': r.contact,
          '진열시작일': r.displayStart, '진열종료일': r.displayEnd, 
          '1개월판매량': r.sales1M, '2개월판매량': r.sales2M, '3개월판매량': r.sales3M, '매출(3개월)': r.totalAmount3M,
          '반품예정일': r.returnDate, 'D-Day': r.dDayStr, '수정일시': r.modDate, '비고': r.note
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "점포진열조회");
      XLSX.writeFile(wb, `점포진열관리(특정매입)_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-4">
      {/* 페이지 타이틀 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">점포진열관리(특정매입)</h2>
      </div>

      {/* 1. 조회 영역 */}
      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[120px_1fr_120px_1fr]">
             <Label className="border-b border-gray-200">조회 점포</Label>
             <div className="p-1 border-b border-r border-gray-200">
                 <Select value={sStore} onValueChange={setSStore}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         {STORE_CODES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                     </SelectContent>
                 </Select>
             </div>
             
             <Label className="border-b border-gray-200">기준년도</Label>
             <div className="p-1 border-b border-gray-200">
                 <Select value={sYear} onValueChange={setSYear}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="2026">2026년</SelectItem>
                         <SelectItem value="2025">2025년</SelectItem>
                         <SelectItem value="2024">2024년</SelectItem>
                     </SelectContent>
                 </Select>
             </div>
          </div>
       </div>
       <div className="erp-search-actions">
              <Button variant="outline" className={headerBtnClass} onClick={handleReset}>초기화(F4)</Button>
              <Button className={headerBtnClass} onClick={handleSearch}>조회(F3)</Button>
       </div>
      </div>

      {/* 2. 등록/수정 영역 */}
      <div className="erp-section-group flex-shrink-0">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">점포 진열 관리 정보</span>
       </div>
       <div className="border border-gray-300 bg-[#fefefe]">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             <Label className="border-gray-200" required>매입처명</Label>
             <div className="flex items-center gap-1 p-1 border-r border-gray-200">
                 <Input className="h-6 w-[80px] text-[11px] bg-white font-bold" value={form.suppCode} readOnly tabIndex={-1} placeholder="매입처코드" />
                 <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0" onClick={handleSupplierSearch}><Search className="w-3.5 h-3.5 text-white" /></Button>
                 <Input className="h-6 flex-1 text-[11px] bg-white" placeholder="매입처명 입력/검색" value={form.suppName} onChange={e => setForm(p => ({...p, suppName: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleSupplierSearch()} />
             </div>

             <Label className="border-gray-200" required>진열시작/종료</Label>
             <div className="flex items-center p-1 border-r border-gray-200 px-3">
                 <DateRangeInput startVal={form.start} endVal={form.end} onStartChange={(v: string) => setForm(p => ({...p, start: v}))} onEndChange={(v: string) => setForm(p => ({...p, end: v}))} />
             </div>

             <Label className="border-gray-200">비고</Label>
             <div className="p-1 px-3 flex items-center">
                 <Input className="h-6 w-full text-[11px] bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" maxLength={50} placeholder="최대 50BYTE 입력" value={form.note} onChange={e => setForm(p => ({...p, note: e.target.value}))} />
             </div>
          </div>
       </div>
      </div>

      {/* 3. 그리드 영역 */}
      <div className="erp-section-group min-h-0 flex-1">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">점포 진열 기준 조회 리스트</span>
          <div className="flex gap-1">
              <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleDelete}>삭제</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleFormSave}>저장</Button>
          </div>
       </div>
       <div className="flex flex-col flex-1 border border-gray-300 bg-white overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
              <Table className="table-fixed min-w-[1600px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">
                              <Checkbox checked={gridData.length > 0 && selectedRows.length === gridData.length} onCheckedChange={handleSelectAll} className="rounded-[2px]" />
                          </TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">매입처코드</TableHead>
                          <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300">매입처명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">매입처상태</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">담당자</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">연락처</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">진열시작</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">진열종료</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 text-blue-700">1개월판매량</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 text-blue-700">2개월판매량</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 text-blue-700">3개월판매량</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">매출(3개월)</TableHead>
                          
                          {/* ★ 반품예정일과 D-Day 칼럼 하나로 병합 */}
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">반품예정일</TableHead>
                          
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">수정일시</TableHead>
                          <TableHead className="text-center font-bold text-gray-900">비고</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => {
                          const isSelected = selectedRows.includes(row.id);
                          return (
                              // ★ 두 줄 텍스트가 잘 보이도록 행 높이를 살짝 키움(h-10)
                              <TableRow 
                                  key={row.id} 
                                  className={cn("h-10 border-b border-gray-200 transition-colors cursor-pointer", isSelected ? "bg-blue-50/50" : activeRowId === row.id ? "bg-yellow-100/50" : "bg-white hover:bg-gray-50")}
                                  onClick={() => handleGridRowClick(row)}
                              >
                                  <TableCell className="text-center border-r border-gray-200 p-0" onClick={e => e.stopPropagation()}>
                                      <Checkbox checked={isSelected} onCheckedChange={(c) => handleSelectRow(row.id, c as boolean)} className="rounded-[2px]" />
                                  </TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.suppCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2 font-bold" title={row.suppName}>{row.suppName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.status}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.manager}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.contact}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.displayStart}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold text-red-600">{row.displayEnd}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 text-blue-700 font-bold">{row.sales1M.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 text-blue-700 font-bold">{row.sales2M.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 text-blue-700 font-bold">{row.sales3M.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 bg-yellow-50/30 font-bold">{row.totalAmount3M.toLocaleString()}</TableCell>
                                  
                                  {/* ★ 반품예정일과 D-Day 병합 표시 */}
                                  <TableCell className="text-center border-r border-gray-200 p-1">
                                      <div className="flex flex-col items-center justify-center gap-0.5">
                                          <span className="font-bold text-purple-700">{row.returnDate}</span>
                                          <span className="font-bold text-red-600">{row.dDayStr}</span>
                                      </div>
                                  </TableCell>
                                  
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.modDate}</TableCell>
                                  <TableCell className="text-left truncate pl-2 text-gray-500" title={row.note}>{row.note}</TableCell>
                              </TableRow>
                          );
                      })}
                      {gridData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 15 }).map((_, j) => (
                              <TableCell key={j} className={j < 14 ? "border-r border-gray-200" : ""}></TableCell>
                            ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
       </div>
      </div>

      <SupplierSearchModal 
          isOpen={isSuppModalOpen} 
          onClose={() => setIsSuppModalOpen(false)} 
          initialSearchName={searchSuppName}
          customData={specificSuppliers}
          onSelect={(item) => { setForm(p => ({ ...p, suppCode: item.code, suppName: item.name })); }} 
      />
    </div>
  );
}