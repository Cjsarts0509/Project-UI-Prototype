import React, { useState, useEffect, useCallback } from 'react';
import { Search, Save, RotateCcw, Plus, Trash2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

type GroupData = { code: string; name: string };
type RowData = {
    id: string;
    category: string;
    g1: GroupData;
    g2: GroupData;
    g3: GroupData;
    modDate: string;
    modEmp: string;
};

export default function AltSupplierGroupManagePage() {
  const { suppliers } = useMockData();
  
  // ★ 특정매입(503) 매입처만 필터링한 데이터셋 구축
  const specificSuppliers = suppliers.filter(s => s.purchaseTypeCode === 503);

  const [listData, setListData] = useState<RowData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // 팝업 관련 State
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [searchSuppName, setSearchSuppName] = useState('');
  const [modalTarget, setModalTarget] = useState<{rowId: string, groupKey: 'g1' | 'g2' | 'g3'} | null>(null);

  // 단축키 (F3, F4, F7) 이벤트 바인딩
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (e.key === 'F3') { e.preventDefault(); handleReset(); }
      if (e.key === 'F4') { e.preventDefault(); handleSearch(); }
      if (e.key === 'F7') { e.preventDefault(); handleSave(); }
  }, [listData]);

  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 1. 버튼 액션 핸들러
  const handleReset = () => {
      setListData([]);
      setSelectedRows([]);
  };

  const handleSearch = () => {
      // 조회 시 임의의 모의 데이터 생성
      setListData([
          {
              id: 'init-1',
              category: '쥬얼리(수도권)',
              g1: { code: '0812565', name: '리앤주' },
              g2: { code: '0815147', name: '블룸마켓' },
              g3: { code: '', name: '' },
              modDate: '20250616',
              modEmp: '12951'
          },
          {
              id: 'init-2',
              category: '슬라임',
              g1: { code: '', name: '' },
              g2: { code: '', name: '' },
              g3: { code: '', name: '' },
              modDate: '',
              modEmp: ''
          }
      ]);
      setSelectedRows([]);
  };

  const handleSave = () => {
      if (listData.length === 0) return alert("저장할 데이터가 없습니다.");
      alert("대체매입처군(특정매입) 정보가 성공적으로 저장되었습니다.");
  };

  const handleAddRow = () => {
      if (listData.length >= 1000) return alert("최대 1,000행까지만 추가할 수 있습니다.");
      const newRow: RowData = {
          id: `new-${Date.now()}`,
          category: '',
          g1: { code: '', name: '' },
          g2: { code: '', name: '' },
          g3: { code: '', name: '' },
          modDate: '',
          modEmp: ''
      };
      setListData(prev => [...prev, newRow]);
  };

  const handleDeleteRow = () => {
      if (selectedRows.length === 0) return alert("삭제할 행을 선택해주세요.");
      setListData(prev => prev.filter(r => !selectedRows.includes(r.id)));
      setSelectedRows([]);
  };

  // 2. 그리드 데이터 변경 핸들러
  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedRows(listData.map(r => r.id));
      else setSelectedRows([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedRows(prev => [...prev, id]);
      else setSelectedRows(prev => prev.filter(rId => rId !== id));
  };

  const handleCategoryChange = (id: string, val: string) => {
      // 구분은 최대 10자까지만 입력 허용
      if (val.length > 10) return;
      setListData(prev => prev.map(r => r.id === id ? { ...r, category: val } : r));
  };

  const handleGroupInputChange = (rowId: string, groupKey: 'g1'|'g2'|'g3', field: 'code'|'name', val: string) => {
      setListData(prev => prev.map(r => {
          if (r.id === rowId) {
              return { ...r, [groupKey]: { ...r[groupKey], [field]: val } };
          }
          return r;
      }));
  };

  // ★ 3. 매입처 스마트 검색 로직 수정 (입력값이 없어도 팝업 호출)
  const handleSupplierSearch = (rowId: string, groupKey: 'g1'|'g2'|'g3', searchValue: string) => {
      const query = searchValue.trim();
      
      // 검색어가 없으면 바로 전체 리스트 팝업 오픈
      if (!query) {
          setModalTarget({ rowId, groupKey });
          setSearchSuppName('');
          setIsSuppModalOpen(true);
          return;
      }

      // 특정매입(503) 목록 중에서 코드나 이름이 완벽하게 일치하는 건 추출
      const exactMatches = specificSuppliers.filter(s => s.name === query || s.code === query);

      if (exactMatches.length === 1) {
          // 동명이인 없고 정확히 1건일 경우 팝업 없이 즉시 적용
          setListData(prev => prev.map(r => {
              if (r.id === rowId) {
                  return { ...r, [groupKey]: { code: exactMatches[0].code, name: exactMatches[0].name } };
              }
              return r;
          }));
      } else {
          // 일치하는 건이 없거나 여러 개일 경우 팝업 오픈 (검색어 유지)
          setModalTarget({ rowId, groupKey });
          setSearchSuppName(query);
          setIsSuppModalOpen(true);
      }
  };

  const handleSupplierModalSelect = (item: any) => {
      if (!modalTarget) return;
      setListData(prev => prev.map(r => {
          if (r.id === modalTarget.rowId) {
              return { ...r, [modalTarget.groupKey]: { code: item.code, name: item.name } };
          }
          return r;
      }));
      setModalTarget(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">대체매입처군 관리(특정매입)</h2>
      </div>

      {/* 상단 액션 바 */}
      <div className="erp-section-group flex-1 min-h-0 flex flex-col">
       <div className="erp-section-toolbar">
              <span className="erp-section-title">대체매입처군 관리</span>
              <div className="flex gap-1.5">
                   <Button className="erp-btn-header" onClick={() => alert('엑셀 다운로드')}>
                       <Download className="w-3 h-3 mr-1"/> 엑셀다운
                   </Button>
                   <div className="w-[1px] h-4 bg-gray-300 self-center"></div>
                   <Button className="erp-btn-header" onClick={handleReset}>
                       초기화(F3)
                   </Button>
                   <Button className="erp-btn-header" onClick={handleSearch}>
                        조회(F4)
                   </Button>
                   <Button className="erp-btn-header" onClick={handleSave}> 저장(F6)</Button>
                   <div className="w-[1px] h-4 bg-gray-300 self-center"></div>
                   <Button className="erp-btn-danger" onClick={handleAddRow}>
                       <Plus className="w-3 h-3 mr-1"/> 행 추가
                   </Button>
                   <Button className="erp-btn-danger" onClick={handleDeleteRow}>
                       <Trash2 className="w-3 h-3 mr-1"/> 행 삭제
                   </Button>
              </div>
       </div>
      {/* 화면 전체를 꽉 채우는 단일 그리드 컨테이너 */}
      <div className="flex flex-col flex-1 border border-gray-300 bg-white overflow-hidden">
           {/* 에디터블 그리드 영역 */}
           <div className="flex-1 overflow-auto custom-scrollbar">
               <Table className="table-fixed min-w-[1200px] border-collapse text-[11px]">
                   <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                       <TableRow className="h-7 border-b border-gray-300">
                           <TableHead rowSpan={2} className="w-[40px] text-center border-r border-gray-300 p-0 align-middle bg-[#f4f4f4]">
                               <Checkbox checked={listData.length > 0 && selectedRows.length === listData.length} onCheckedChange={handleSelectAll} className="rounded-[2px]" />
                           </TableHead>
                           <TableHead rowSpan={2} className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300 align-middle bg-[#f4f4f4]">구분</TableHead>
                           <TableHead colSpan={2} className="text-center font-bold text-gray-900 border-r border-gray-300 border-b border-gray-300 bg-[#eef3f8]">1군</TableHead>
                           <TableHead colSpan={2} className="text-center font-bold text-gray-900 border-r border-gray-300 border-b border-gray-300 bg-[#eef3f8]">2군</TableHead>
                           <TableHead colSpan={2} className="text-center font-bold text-gray-900 border-r border-gray-300 border-b border-gray-300 bg-[#eef3f8]">3군</TableHead>
                           <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 align-middle bg-[#f4f4f4]">수정일자</TableHead>
                           <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 align-middle bg-[#f4f4f4]">변경사원</TableHead>
                       </TableRow>
                       <TableRow className="h-8">
                           {/* 1군 서브 헤더 */}
                           <TableHead className="w-[100px] text-center font-bold text-gray-700 border-r border-gray-300 bg-[#f4f4f4]">코드</TableHead>
                           <TableHead className="w-[150px] text-center font-bold text-gray-700 border-r border-gray-300 bg-[#f4f4f4]">매입처명</TableHead>
                           {/* 2군 서브 헤더 */}
                           <TableHead className="w-[100px] text-center font-bold text-gray-700 border-r border-gray-300 bg-[#f4f4f4]">코드</TableHead>
                           <TableHead className="w-[150px] text-center font-bold text-gray-700 border-r border-gray-300 bg-[#f4f4f4]">매입처명</TableHead>
                           {/* 3군 서브 헤더 */}
                           <TableHead className="w-[100px] text-center font-bold text-gray-700 border-r border-gray-300 bg-[#f4f4f4]">코드</TableHead>
                           <TableHead className="w-[150px] text-center font-bold text-gray-700 border-r border-gray-300 bg-[#f4f4f4]">매입처명</TableHead>
                       </TableRow>
                   </TableHeader>
                   <TableBody>
                       {listData.map((row) => {
                           const isSelected = selectedRows.includes(row.id);
                           return (
                               <TableRow key={row.id} className={cn("h-8 border-b border-gray-200 transition-colors", isSelected ? "bg-blue-50/50" : "bg-white hover:bg-gray-50")}>
                                   <TableCell className="text-center border-r border-gray-200 p-0">
                                       <Checkbox checked={isSelected} onCheckedChange={(c) => handleSelectRow(row.id, c as boolean)} className="rounded-[2px]" />
                                   </TableCell>
                                   
                                   {/* 구분 (최대 10자) */}
                                   <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/20">
                                       <Input 
                                           className="h-full w-full border-none text-center px-2 text-[11px] font-bold text-gray-800 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                           maxLength={10}
                                           placeholder="텍스트 10자"
                                           value={row.category} 
                                           onChange={e => handleCategoryChange(row.id, e.target.value)} 
                                       />
                                   </TableCell>

                                   {/* 1군 */}
                                   <TableCell className="p-0 border-r border-gray-200 text-center text-gray-600 font-medium">
                                       {row.g1.code}
                                   </TableCell>
                                   <TableCell className="p-0 border-r border-gray-200">
                                       <div className="flex h-full w-full relative">
                                           <Input 
                                               className="h-full w-full border-none px-2 text-[11px] bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500 pr-6" 
                                               value={row.g1.name}
                                               onChange={e => handleGroupInputChange(row.id, 'g1', 'name', e.target.value)}
                                               onKeyDown={e => e.key === 'Enter' && handleSupplierSearch(row.id, 'g1', row.g1.name)}
                                           />
                                           <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-blue-500" onClick={() => handleSupplierSearch(row.id, 'g1', row.g1.name)} />
                                       </div>
                                   </TableCell>

                                   {/* 2군 */}
                                   <TableCell className="p-0 border-r border-gray-200 text-center text-gray-600 font-medium">
                                       {row.g2.code}
                                   </TableCell>
                                   <TableCell className="p-0 border-r border-gray-200">
                                       <div className="flex h-full w-full relative">
                                           <Input 
                                               className="h-full w-full border-none px-2 text-[11px] bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500 pr-6" 
                                               value={row.g2.name}
                                               onChange={e => handleGroupInputChange(row.id, 'g2', 'name', e.target.value)}
                                               onKeyDown={e => e.key === 'Enter' && handleSupplierSearch(row.id, 'g2', row.g2.name)}
                                           />
                                           <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-blue-500" onClick={() => handleSupplierSearch(row.id, 'g2', row.g2.name)} />
                                       </div>
                                   </TableCell>

                                   {/* 3군 */}
                                   <TableCell className="p-0 border-r border-gray-200 text-center text-gray-600 font-medium">
                                       {row.g3.code}
                                   </TableCell>
                                   <TableCell className="p-0 border-r border-gray-200">
                                       <div className="flex h-full w-full relative">
                                           <Input 
                                               className="h-full w-full border-none px-2 text-[11px] bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500 pr-6" 
                                               value={row.g3.name}
                                               onChange={e => handleGroupInputChange(row.id, 'g3', 'name', e.target.value)}
                                               onKeyDown={e => e.key === 'Enter' && handleSupplierSearch(row.id, 'g3', row.g3.name)}
                                           />
                                           <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-blue-500" onClick={() => handleSupplierSearch(row.id, 'g3', row.g3.name)} />
                                       </div>
                                   </TableCell>

                                   <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.modDate}</TableCell>
                                   <TableCell className="text-center text-gray-500">{row.modEmp}</TableCell>
                               </TableRow>
                           );
                       })}
                       
                       {listData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                              {Array.from({ length: 10 }).map((_, j) => (
                                <TableCell key={j} className={j < 9 ? "border-r border-gray-200" : ""}></TableCell>
                              ))}
                            </TableRow>
                        ))}
                   </TableBody>
               </Table>
           </div>
       </div>
      </div> {/* close erp-section-group */}

       {/* ★ 특정매입(503) 전용으로 필터링된 커스텀 데이터를 팝업에 주입 */}
       <SupplierSearchModal 
           isOpen={isSuppModalOpen} 
           onClose={() => setIsSuppModalOpen(false)} 
           initialSearchName={searchSuppName} 
           customData={specificSuppliers}
           onSelect={handleSupplierModalSelect} 
       />
    </div>
  );
}