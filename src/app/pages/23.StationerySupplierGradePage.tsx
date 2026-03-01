import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Save, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

const STORE_CODES = [
  "광화문점", "강남점", "잠실점", "영등포점", "분당점", "목동점", "일산점", 
  "평촌점", "인천점", "천안점", "대구점", "반월당점", "부산점", "센텀시티점", 
  "창원점", "전주점", "가든파이브점", "온라인"
];

const GENDERS = ['전체', '남성', '여성', '미상'];
const GRADES = ['전체', 'A등급', 'B등급', 'C등급', '기타등급'];
const AGES = ['전체', '10대미만', '10대', '20대', '30대', '40대', '50대', '60대', '70대이상'];

// 공통 라벨 컴포넌트
const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-blue-600 whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

// 다중 선택 드롭다운 (레이아웃 찌그러짐 방지 적용)
const MultiSelectDropdown = ({ options, selected, onChange, placeholder = '선택' }: { options: string[], selected: string[], onChange: (val: string) => void, placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const display = selected.length === 0 ? '선택 안됨' : selected.includes('전체') ? '전체' : selected.join(', ');

    return (
        <div className="relative h-full w-full flex items-center" ref={ref}>
             <div 
                className="flex items-center justify-between h-6 w-full px-2 border border-gray-300 bg-white cursor-pointer rounded-[2px] hover:border-gray-400"
                onClick={() => setIsOpen(!isOpen)}
             >
                 <span className="text-[11px] truncate text-gray-700 font-medium">{display}</span>
             </div>
             {isOpen && (
                 <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-gray-300 shadow-lg z-50 rounded-[2px] flex flex-col">
                     <div className="max-h-[200px] overflow-y-auto p-1 grid grid-cols-1 gap-1 custom-scrollbar">
                         <div className="flex items-center p-1 hover:bg-gray-50 cursor-pointer border-b border-gray-200 pb-1.5 mb-1" onClick={() => onChange('전체')}>
                             <Checkbox className="h-3.5 w-3.5 mr-2 rounded-[2px]" checked={selected.includes('전체')} />
                             <span className="font-bold text-gray-800 text-[11px]">전체</span>
                         </div>
                         {options.filter(o => o !== '전체').map((opt) => (
                             <div key={opt} className="flex items-center p-1 hover:bg-gray-50 cursor-pointer" onClick={() => onChange(opt)}>
                                 <Checkbox className="h-3.5 w-3.5 mr-2 rounded-[2px]" checked={selected.includes(opt) && !selected.includes('전체')} />
                                 <span className="text-gray-700 text-[11px]">{opt}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
        </div>
    );
};

export default function StationerySupplierGradePage() {
  const { suppliers } = useMockData();

  // 1. 조건 관리 State
  const initialCond = {
      aTypes: '1000', aQty: '50000', aAmt: '10000000',
      bTypes: '500', bQty: '10000', bAmt: '5000000',
      cTypes: '100', cQty: '1000', cAmt: '1000000',
  };
  const [isEditable, setIsEditable] = useState(false);
  const [cond, setCond] = useState(initialCond);
  const [savedCond, setSavedCond] = useState(initialCond); // ★ 등급조건복원을 위한 저장 상태 유지

  // 2. 조회 조건 State
  const [searchYear, setSearchYear] = useState('2025');
  const [selectedGenders, setSelectedGenders] = useState<string[]>(['전체']);
  const [selectedGrades, setSelectedGrades] = useState<string[]>(['전체']);
  const [selectedAges, setSelectedAges] = useState<string[]>(['전체']);
  const [suppCode, setSuppCode] = useState('');
  const [suppName, setSuppName] = useState('');
  
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [listData, setListData] = useState<any[]>([]);

  // ----------------------------------------------------
  // 상단: 등급 조건 관리 핸들러
  // ----------------------------------------------------
  const handleCondChange = (key: string, val: string) => {
      setCond(prev => ({ ...prev, [key]: val.replace(/[^0-9]/g, '') }));
  };

  const handleCondSearch = () => {
      // 조회 버튼: 저장된 조건을 화면에 반영 (비활성 상태)
      setCond(savedCond);
      setIsEditable(false);
  };

  const handleCondRestore = () => {
      // 복원 버튼: 입력/초기화 도중 이전 저장값으로 롤백 (수정 모드 유지)
      setCond(savedCond);
  };

  const handleCondReset = () => {
      // 초기화 버튼: 입력 필드 비우기 및 수정 모드 활성화
      setIsEditable(true);
      setCond({ aTypes: '', aQty: '', aAmt: '', bTypes: '', bQty: '', bAmt: '', cTypes: '', cQty: '', cAmt: '' });
  };

  const handleCondSave = () => {
      // 저장 버튼: 유효성 검사 후 저장
      if (!cond.aTypes || !cond.aQty || !cond.aAmt) return alert("등급 기준을 모두 입력해주세요.");
      setSavedCond(cond);
      setIsEditable(false);
      alert("매입처 등급 조건이 저장되었습니다. 해당 조건으로 등급기준이 재부여됩니다.");
  };

  // ----------------------------------------------------
  // 하단: 매입처 등급 조회 핸들러
  // ----------------------------------------------------
  const createToggleHandler = (state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => (val: string) => {
      if (val === '전체') setState(['전체']);
      else {
          let newSelected = state.filter(x => x !== '전체');
          if (newSelected.includes(val)) newSelected = newSelected.filter(x => x !== val);
          else newSelected.push(val);
          if (newSelected.length === 0) newSelected = ['전체'];
          setState(newSelected);
      }
  };

  const handleSearchReset = () => {
      setSearchYear('2025');
      setSelectedGenders(['전체']);
      setSelectedGrades(['전체']);
      setSelectedAges(['전체']);
      setSuppCode('');
      setSuppName('');
      setListData([]);
  };

  const handleSearch = () => {
      if (!searchYear) return alert("기준년도를 선택해주세요.");

      let targetSuppliers = suppliers.filter(s => s.purchaseTypeCode === 503);
      if (suppCode) targetSuppliers = targetSuppliers.filter(s => s.code === suppCode);

      const generated = targetSuppliers.map((s, idx) => {
          const storeSales: Record<string, number> = {};
          let totalStoreAmt = 0;
          let activeStores = 0;

          STORE_CODES.forEach(st => {
              const hasSales = Math.random() > 0.4; 
              const amt = hasSales ? Math.floor(Math.random() * 5000000) + 10000 : 0;
              storeSales[st] = amt;
              totalStoreAmt += amt;
              if (amt > 0) activeStores++;
          });

          const gradePool = ['A등급', 'B등급', 'C등급', '기타등급'];
          return {
              id: `row-${idx}`,
              year: searchYear,
              grade: gradePool[Math.floor(Math.random() * gradePool.length)],
              score: Math.floor(Math.random() * 100) + 10,
              suppCode: s.code,
              suppName: s.name,
              groupCode: s.category || '문구', 
              salesTypes: Math.floor(Math.random() * 300) + 10,
              salesQty: Math.floor(Math.random() * 5000) + 50,
              salesAmt: totalStoreAmt + Math.floor(Math.random() * 1000000), 
              storeCount: activeStores,
              storeSales
          };
      });

      setListData(generated);
  };

  const handleExcelDownload = () => {
      if (listData.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = listData.map((r, i) => {
          const base: any = {
              '순번': i + 1, '기준년': r.year, '매입처등급': r.grade, '등급점수': r.score,
              '매입처코드': r.suppCode, '매입처명': r.suppName, '조코드': r.groupCode,
              '매출종수': r.salesTypes, '매출수량': r.salesQty, '매출금액': r.salesAmt, '매출지점수': r.storeCount
          };
          STORE_CODES.forEach(st => { base[st] = r.storeSales[st]; });
          return base;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "매입처등급조회");
      XLSX.writeFile(wb, `매입처등급관리_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-2">
      {/* 1. 매입처 등급 조건 관리 영역 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">문구거래처등급</h2>
      </div>

      <div className="erp-section-group flex-shrink-0">
          <div className="erp-section-toolbar">
              <span className="erp-section-title">등급 조건 설정</span>
          </div>
          <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
              <div className="grid grid-cols-[120px_1fr]">
                 {/* A등급 */}
                 <Label className="border-b border-gray-200" required>A등급 기준</Label>
                 <div className="flex items-center gap-6 p-1 px-3 border-b border-gray-200">
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출종수</span>
                         <Input className={cn("h-6 w-[100px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.aTypes} onChange={e => handleCondChange('aTypes', e.target.value)} disabled={!isEditable} />
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출수량</span>
                         <Input className={cn("h-6 w-[100px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.aQty} onChange={e => handleCondChange('aQty', e.target.value)} disabled={!isEditable} />
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출금액</span>
                         <Input className={cn("h-6 w-[120px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.aAmt} onChange={e => handleCondChange('aAmt', e.target.value)} disabled={!isEditable} />
                         <span className="text-gray-500 ml-1">원 이상</span>
                     </div>
                 </div>

                 {/* B등급 */}
                 <Label className="border-b border-gray-200" required>B등급 기준</Label>
                 <div className="flex items-center gap-6 p-1 px-3 border-b border-gray-200">
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출종수</span>
                         <Input className={cn("h-6 w-[100px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.bTypes} onChange={e => handleCondChange('bTypes', e.target.value)} disabled={!isEditable} />
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출수량</span>
                         <Input className={cn("h-6 w-[100px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.bQty} onChange={e => handleCondChange('bQty', e.target.value)} disabled={!isEditable} />
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출금액</span>
                         <Input className={cn("h-6 w-[120px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.bAmt} onChange={e => handleCondChange('bAmt', e.target.value)} disabled={!isEditable} />
                         <span className="text-gray-500 ml-1">원 이상</span>
                     </div>
                 </div>

                 {/* C등급 */}
                 <Label className="border-gray-200" required>C등급 기준</Label>
                 <div className="flex items-center gap-6 p-1 px-3">
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출종수</span>
                         <Input className={cn("h-6 w-[100px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.cTypes} onChange={e => handleCondChange('cTypes', e.target.value)} disabled={!isEditable} />
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출수량</span>
                         <Input className={cn("h-6 w-[100px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.cQty} onChange={e => handleCondChange('cQty', e.target.value)} disabled={!isEditable} />
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-gray-600 font-bold w-14">매출금액</span>
                         <Input className={cn("h-6 w-[120px] text-[11px] text-right font-bold", isEditable ? "bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" : "bg-gray-100 text-gray-500")} value={cond.cAmt} onChange={e => handleCondChange('cAmt', e.target.value)} disabled={!isEditable} />
                         <span className="text-gray-500 ml-1">원 이상</span>
                     </div>
                 </div>
              </div>
          </div>
          <div className="flex justify-end gap-1 mt-1 mb-2">
               <Button className="erp-btn-header" onClick={handleCondSearch}>조회(F4)</Button>
               <Button className="erp-btn-header" onClick={handleCondRestore}>
                    등급조건복원
               </Button>
               <Button className="erp-btn-header" onClick={handleCondReset}>초기화(F3)</Button>
               <Button className="erp-btn-header" onClick={handleCondSave}>저장(F6)</Button>
          </div>
      </div>

      {/* 2. 매입처 등급 조회 영역 */}
      <div className="erp-section-group flex-shrink-0">
          <div className="erp-section-toolbar">
              <span className="erp-section-title">매입처 등급 조회</span>
              <div className="flex gap-1">
                  <Button className="erp-btn-action" onClick={handleSearch}>
                       조회(F4)
                  </Button>
                  <Button className="erp-btn-action" onClick={handleSearchReset}>초기화(F3)</Button>
              </div>
          </div>
          <div className="erp-section-content">
              <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
                 <Label className="border-b border-gray-200" required>기준년도</Label>
                 <div className="p-1 px-2 border-b border-r border-gray-200 flex items-center">
                     <Select value={searchYear} onValueChange={setSearchYear}>
                         <SelectTrigger className="h-6 w-[120px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="2026">2026년</SelectItem>
                             <SelectItem value="2025">2025년</SelectItem>
                             <SelectItem value="2024">2024년</SelectItem>
                         </SelectContent>
                     </Select>
                 </div>
                 
                 <Label className="border-b border-gray-200">성별</Label>
                 <div className="p-1 px-2 border-b border-r border-gray-200">
                    <MultiSelectDropdown options={GENDERS} selected={selectedGenders} onChange={createToggleHandler(selectedGenders, setSelectedGenders)} />
                 </div>

                 <Label className="border-b border-gray-200">매입처 등급</Label>
                 <div className="p-1 px-2 border-b border-gray-200">
                    <MultiSelectDropdown options={GRADES} selected={selectedGrades} onChange={createToggleHandler(selectedGrades, setSelectedGrades)} />
                 </div>

                 <Label className="border-gray-200">연령</Label>
                 <div className="p-1 px-2 border-r border-gray-200">
                    <MultiSelectDropdown options={AGES} selected={selectedAges} onChange={createToggleHandler(selectedAges, setSelectedAges)} />
                 </div>

                 <Label className="border-gray-200">매입처</Label>
                 <div className="flex items-center gap-1 p-1 px-2 col-span-3">
                     <Input className="h-6 w-[100px] text-[11px] bg-white font-bold" value={suppCode} onChange={e => setSuppCode(e.target.value)} placeholder="매입처코드" />
                     <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0" onClick={() => setIsSuppModalOpen(true)}>
                         <Search className="w-3.5 h-3.5 text-white" />
                     </Button>
                     <Input className="h-6 w-[200px] text-[11px] bg-white" placeholder="매입처명" value={suppName} onChange={e => setSuppName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setIsSuppModalOpen(true)} />
                 </div>
              </div>
          </div>
      </div>

      {/* 3. 그리드 영역 */}
      <div className="erp-section-group flex-1 flex flex-col overflow-hidden">
          <div className="erp-section-toolbar">
              <span className="erp-section-title">매입처 등급 조회 리스트</span>
              <Button className="erp-btn-action" onClick={handleExcelDownload}>
                   엑셀다운
              </Button>
          </div>
      <div className="flex-1 border border-gray-300 bg-white overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
              <Table className="table-fixed border-collapse text-[11px]" style={{ minWidth: `${1000 + (STORE_CODES.length * 80)}px` }}>
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300">순번</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">기준년도</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 bg-blue-50">매입처등급</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">등급점수</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">매입처코드</TableHead>
                          <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300">매입처명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">조코드</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">매출종수</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">매출수량</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-blue-700 border-r border-gray-300 bg-yellow-50">매출금액</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-red-600 border-r border-gray-300">매출지점수</TableHead>
                          
                          {STORE_CODES.map(store => (
                              <TableHead key={store} className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">{store}</TableHead>
                          ))}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {listData.map((row, idx) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 hover:bg-gray-50 transition-colors bg-white">
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{idx + 1}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.year}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold text-blue-700 bg-blue-50/30">{row.grade}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.score}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-medium">{row.suppCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2 font-bold text-gray-800" title={row.suppName}>{row.suppName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.groupCode}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2">{row.salesTypes.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold">{row.salesQty.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-blue-700 bg-yellow-50/30">{row.salesAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold text-red-600">{row.storeCount}</TableCell>
                              
                              {STORE_CODES.map(store => (
                                  <TableCell key={store} className="text-right border-r border-gray-200 pr-2 text-gray-600">
                                      {row.storeSales[store] > 0 ? row.storeSales[store].toLocaleString() : '-'}
                                  </TableCell>
                              ))}
                          </TableRow>
                      ))}

                      {listData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 8 + STORE_CODES.length }).map((_, j) => (
                              <TableCell key={j} className={j < 7 + STORE_CODES.length ? "border-r border-gray-200" : ""}></TableCell>
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
          initialSearchName={suppName || suppCode} 
          onSelect={(item) => { setSuppCode(item.code); setSuppName(item.name); }} 
      />
    </div>
  );
}