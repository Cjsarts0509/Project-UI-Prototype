import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];

const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-blue-600 whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

const headerBtnClass = "erp-btn-header";
const actionBtnClass = "erp-btn-action";

// ★ 데이터베이스 역할을 할 전체 더미 데이터
const dummyDatabase = [
    { id: '1', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', degree: '1차', gayo: true, pop: true, classic: false, dvd: false, useYn: 'Y' },
    { id: '2', supplierCode: '01B0478', supplierName: 'YG PLUS', degree: '2차', gayo: true, pop: false, classic: false, dvd: true, useYn: 'Y' },
    { id: '3', supplierCode: '01B0479', supplierName: '유니버설뮤직', degree: 'FREE', gayo: false, pop: true, classic: true, dvd: false, useYn: 'Y' },
    { id: '4', supplierCode: '01B0504', supplierName: '지니뮤직', degree: '1차', gayo: true, pop: true, classic: false, dvd: false, useYn: 'N' },
    { id: '5', supplierCode: '01B0509', supplierName: '카카오엔터테인먼트', degree: '2차', gayo: true, pop: false, classic: false, dvd: false, useYn: 'Y' },
];

export default function AlbumSupplierDegreePage() {
  const { suppliers } = useMockData();

  // 조회 영역 상태
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  const [searchDegree, setSearchDegree] = useState('all');
  const [searchUseYn, setSearchUseYn] = useState('all');

  // 매입처정보(수정 폼) 영역 상태
  const [editSupplierCode, setEditSupplierCode] = useState('');
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editDegree, setEditDegree] = useState('1차');
  const [editUseYn, setEditUseYn] = useState('Y');
  const [editGenres, setEditGenres] = useState({ gayo: false, pop: false, classic: false, dvd: false });

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierModalTarget, setSupplierModalTarget] = useState<'search' | 'edit'>('search');

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // ★ 초기 화면은 빈 배열로 시작 (조회 전까지 데이터 안 나옴)
  const [data, setData] = useState<any[]>([]);

  const handleSupplierCodeSearch = (target: 'search' | 'edit') => {
    setSupplierModalTarget(target);
    const codeVal = target === 'search' ? searchSupplierCode : editSupplierCode;
    if (!codeVal.trim()) { setIsSupplierModalOpen(true); return; }
    
    const exactMatches = (suppliers || []).filter(s => ALBUM_SUPPLIERS.includes(s.code) && s.code === codeVal.trim());
    if (exactMatches.length === 1) { 
        if (target === 'search') setSearchSupplierName(exactMatches[0].name); 
        else setEditSupplierName(exactMatches[0].name);
    } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = (target: 'search' | 'edit') => {
    setSupplierModalTarget(target);
    const nameVal = target === 'search' ? searchSupplierName : editSupplierName;
    if (!nameVal.trim()) { setIsSupplierModalOpen(true); return; }

    const exactMatches = (suppliers || []).filter(s => ALBUM_SUPPLIERS.includes(s.code) && s.name.includes(nameVal.trim()));
    if (exactMatches.length === 1) { 
        if (target === 'search') { setSearchSupplierCode(exactMatches[0].code); setSearchSupplierName(exactMatches[0].name); }
        else { setEditSupplierCode(exactMatches[0].code); setEditSupplierName(exactMatches[0].name); }
    } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSearchReset = () => {
    setSearchSupplierCode('');
    setSearchSupplierName('');
    setSearchDegree('all');
    setSearchUseYn('all');
    setData([]); // ★ 초기화 시 그리드 비우기
    handleClearEdit();
  };

  const handleSearch = () => {
    // ★ dummyDatabase(전체 데이터)에서 필터링해서 그리드에 세팅
    const filtered = dummyDatabase.filter(item => {
        if (searchSupplierCode && item.supplierCode !== searchSupplierCode) return false;
        if (searchDegree !== 'all' && item.degree !== searchDegree) return false;
        if (searchUseYn !== 'all' && item.useYn !== searchUseYn) return false;
        return true;
    });
    
    setData(filtered);
    
    if (filtered.length > 0) {
        handleRowClick(filtered[0]); // 조회 시 첫 번째 행 자동 선택
    } else {
        handleClearEdit();
    }
  };

  const handleClearEdit = () => {
      setSelectedRowId(null);
      setEditSupplierCode('');
      setEditSupplierName('');
      setEditDegree('1차');
      setEditUseYn('Y');
      setEditGenres({ gayo: false, pop: false, classic: false, dvd: false });
  };

  const handleRowClick = (row: any) => {
      setSelectedRowId(row.id);
      setEditSupplierCode(row.supplierCode);
      setEditSupplierName(row.supplierName);
      setEditDegree(row.degree);
      setEditUseYn(row.useYn);
      setEditGenres({ gayo: row.gayo, pop: row.pop, classic: row.classic, dvd: row.dvd });
  };

  const handleSave = () => {
      if (!editSupplierCode) return alert("매입처를 선택해주세요.");

      if (selectedRowId) {
          setData(prev => prev.map(item => item.id === selectedRowId ? {
              ...item,
              supplierCode: editSupplierCode,
              supplierName: editSupplierName,
              degree: editDegree,
              useYn: editUseYn,
              ...editGenres
          } : item));
          alert("수정사항이 저장되었습니다.");
      } else {
          const newRow = {
              id: `new-${Date.now()}`,
              supplierCode: editSupplierCode,
              supplierName: editSupplierName,
              degree: editDegree,
              useYn: editUseYn,
              ...editGenres
          };
          setData(prev => [newRow, ...prev]);
          alert("신규 매입처 정보가 추가되었습니다.");
      }
      handleClearEdit();
  };

  const handleExcelDownload = () => {
      if (data.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = data.map(row => ({
          '매입처코드': row.supplierCode,
          '매입처명': row.supplierName,
          '차수': row.degree,
          '가요': row.gayo ? 'Y' : 'N',
          'POP': row.pop ? 'Y' : 'N',
          '클래식': row.classic ? 'Y' : 'N',
          'DVD': row.dvd ? 'Y' : 'N',
          '사용여부': row.useYn === 'Y' ? '사용' : '미사용'
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "음반차수별매입처관리");
      XLSX.writeFile(wb, "음반차수별매입처관리.xlsx");
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">음반 차수별 매입처관리</h2>
      </div>

      {/* 1. 조회 영역 */}
      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1.5fr]">
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch('search')} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch('search')} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => handleSupplierCodeSearch('search')} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">차수</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={searchDegree} onValueChange={setSearchDegree}>
                    <SelectTrigger className="h-6 w-[100px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="1차">1차</SelectItem>
                        <SelectItem value="2차">2차</SelectItem>
                        <SelectItem value="FREE">FREE</SelectItem>
                    </SelectContent>
                 </Select>
                 <span className="text-gray-500 ml-2 font-medium">(1차: 10시, 2차: 11시, Free: 상시)</span>
             </div>
             
             <Label className="border-r border-gray-200">사용여부</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={searchUseYn} onValueChange={setSearchUseYn}>
                    <SelectTrigger className="h-6 w-[100px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="Y">사용</SelectItem>
                        <SelectItem value="N">미사용</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
               <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
               <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
       </div>
       </div>
       
       <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          {/* 2. 매입처정보 (수정 영역) */}
          <div className="erp-section-group flex-shrink-0">
             <div className="erp-section-toolbar">
                <span className="erp-section-title">매입처정보</span>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={handleClearEdit}>추가(F5)</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장(F6)</Button>
                </div>
             </div>
             <div className="flex flex-col flex-shrink-0 border border-gray-300 bg-white">
                 <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr] border-b border-gray-200">
                     <Label required className="border-r border-gray-200">매입처</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                         <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={editSupplierCode} onChange={(e) => setEditSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch('edit')} />
                         <div className="flex-1 relative flex items-center">
                            <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={editSupplierName} onChange={(e) => setEditSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch('edit')} />
                            <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => handleSupplierCodeSearch('edit')} />
                         </div>
                     </div>
                     
                     <Label className="border-r border-gray-200">차수</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                         <Select value={editDegree} onValueChange={setEditDegree}>
                            <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1차">1차</SelectItem>
                                <SelectItem value="2차">2차</SelectItem>
                                <SelectItem value="FREE">FREE</SelectItem>
                            </SelectContent>
                         </Select>
                     </div>
                     
                     <Label className="border-r border-gray-200">사용여부</Label>
                     <div className="flex items-center p-1 gap-1">
                         <Select value={editUseYn} onValueChange={setEditUseYn}>
                            <SelectTrigger className="h-6 w-[100px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Y">사용</SelectItem>
                                <SelectItem value="N">미사용</SelectItem>
                            </SelectContent>
                         </Select>
                     </div>
                 </div>
                 <div className="grid grid-cols-[100px_1fr]">
                     <Label className="border-r border-gray-200">장르사용구분</Label>
                     <div className="flex items-center p-1 px-4 gap-8">
                         <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-800 text-[14px]">
                             <Checkbox className="h-4 w-4 rounded-[2px]" checked={editGenres.gayo} onCheckedChange={(c) => setEditGenres(p => ({...p, gayo: !!c}))} /> 가요
                         </label>
                         <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-800 text-[14px]">
                             <Checkbox className="h-4 w-4 rounded-[2px]" checked={editGenres.pop} onCheckedChange={(c) => setEditGenres(p => ({...p, pop: !!c}))} /> POP
                         </label>
                         <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-800 text-[14px]">
                             <Checkbox className="h-4 w-4 rounded-[2px]" checked={editGenres.classic} onCheckedChange={(c) => setEditGenres(p => ({...p, classic: !!c}))} /> 클래식
                         </label>
                         <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-800 text-[14px]">
                             <Checkbox className="h-4 w-4 rounded-[2px]" checked={editGenres.dvd} onCheckedChange={(c) => setEditGenres(p => ({...p, dvd: !!c}))} /> DVD
                         </label>
                     </div>
                 </div>
             </div>
          </div>

          {/* 3. 매입처별 발주시간 (그리드 영역) */}
          <div className="erp-section-group min-h-0 flex-1">
             <div className="erp-section-toolbar">
                <span className="erp-section-title">매입처별 발주시간</span>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운(F1)</Button>
                </div>
             </div>
             <div className="flex-1 overflow-auto relative">
                <Table className="table-fixed min-w-[1000px] border-collapse text-[11px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="h-8">
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처코드</TableHead>
                            <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">차수</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">가요</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">POP</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">클래식</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">DVD</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 p-1">사용여부</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => {
                            const isSelected = selectedRowId === row.id;
                            return (
                              <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleRowClick(row)}>
                                  <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.supplierCode}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-2">{row.supplierName}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.degree}</TableCell>
                                  
                                  <TableCell className="text-center p-0 border-r border-gray-200">
                                      <div className="flex justify-center w-full"><Checkbox checked={row.gayo} disabled className="h-3.5 w-3.5 border-gray-400 rounded-[2px]" /></div>
                                  </TableCell>
                                  <TableCell className="text-center p-0 border-r border-gray-200">
                                      <div className="flex justify-center w-full"><Checkbox checked={row.pop} disabled className="h-3.5 w-3.5 border-gray-400 rounded-[2px]" /></div>
                                  </TableCell>
                                  <TableCell className="text-center p-0 border-r border-gray-200">
                                      <div className="flex justify-center w-full"><Checkbox checked={row.classic} disabled className="h-3.5 w-3.5 border-gray-400 rounded-[2px]" /></div>
                                  </TableCell>
                                  <TableCell className="text-center p-0 border-r border-gray-200">
                                      <div className="flex justify-center w-full"><Checkbox checked={row.dvd} disabled className="h-3.5 w-3.5 border-gray-400 rounded-[2px]" /></div>
                                  </TableCell>
                                  
                                  <TableCell className="text-center p-1 text-gray-800 font-bold">{row.useYn === 'Y' ? '사용' : '미사용'}</TableCell>
                              </TableRow>
                            );
                        })}
                        {data.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                              {Array.from({ length: 8 }).map((_, j) => (
                                <TableCell key={j} className={j < 7 ? "border-r border-gray-200" : ""}></TableCell>
                              ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </div>
      </div>

      <SupplierSearchModal 
          isOpen={isSupplierModalOpen} 
          onClose={() => setIsSupplierModalOpen(false)} 
          initialSearchName={supplierModalTarget === 'search' ? (searchSupplierName || searchSupplierCode) : (editSupplierName || editSupplierCode)} 
          allowedCodes={ALBUM_SUPPLIERS}
          onSelect={(item) => { 
              if (supplierModalTarget === 'search') {
                  setSearchSupplierCode(item.code); 
                  setSearchSupplierName(item.name); 
              } else {
                  setEditSupplierCode(item.code); 
                  setEditSupplierName(item.name); 
              }
          }} 
      />
    </div>
  );
}