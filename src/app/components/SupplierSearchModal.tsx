import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';

interface SupplierSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchName?: string;
  onSelect: (item: any) => void;
  allowedCodes?: string[]; 
  excludedCategoryCodes?: string[];
  allowedCategoryCodes?: string[];
  excludedCodes?: string[];
  customData?: { code: string, name: string }[]; 
}

export function SupplierSearchModal({ isOpen, onClose, initialSearchName, onSelect, allowedCodes, excludedCategoryCodes, allowedCategoryCodes, excludedCodes, customData }: SupplierSearchModalProps) {
  const { suppliers } = useMockData();
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  
  const [results, setResults] = useState<any[]>([]);
  const [selectedPopupItem, setSelectedPopupItem] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchName(initialSearchName || '');
      setSearchCode('');
      setSelectedPopupItem(null);
      handleSearch('', initialSearchName || '');
    }
  }, [isOpen, initialSearchName]);

  const handleSearch = (code: string, name: string) => {
    let dataSource = customData || suppliers || [];

    if (!customData && allowedCodes && allowedCodes.length > 0) {
        dataSource = dataSource.filter((s: any) => allowedCodes.includes(s.code));
    }

    if (!customData && excludedCategoryCodes && excludedCategoryCodes.length > 0) {
        dataSource = dataSource.filter((s: any) => !excludedCategoryCodes.includes(s.categoryCode));
    }

    if (!customData && allowedCategoryCodes && allowedCategoryCodes.length > 0) {
        dataSource = dataSource.filter((s: any) => allowedCategoryCodes.includes(s.categoryCode));
    }

    if (!customData && excludedCodes && excludedCodes.length > 0) {
        dataSource = dataSource.filter((s: any) => !excludedCodes.includes(s.code));
    }

    const filtered = dataSource.filter((s: any) => 
      (code ? s.code.includes(code) : true) && 
      (name ? s.name.includes(name) : true)
    );

    setResults(filtered);
    setSelectedPopupItem(null);
  };

  const handleConfirm = () => {
    if (selectedPopupItem) {
      onSelect(selectedPopupItem);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      {/* ProductSearchModal과 동일한 레이아웃 크기 및 구조 적용 */}
      <div className="bg-white border border-gray-400 shadow-2xl w-[600px] flex flex-col h-[550px]">
        
        {/* 다크 그레이 헤더 */}
        <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
          <span className="font-bold text-[13px]">매입처 조회 및 선택</span>
          <button onClick={onClose} className="hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        
        {/* 검색 조건 영역 */}
        <div className="p-3 bg-white flex-shrink-0">
          <div className="border border-gray-300 grid grid-cols-[100px_1fr] bg-white text-[12px] mb-1">
            <div className="bg-[#f9f9fa] border-r border-b border-gray-200 px-3 py-1 flex items-center font-medium text-gray-700">매입처코드</div>
            <div className="border-b border-gray-200 p-1 flex items-center">
               <Input className="h-6 w-full text-[11px] rounded-[2px]" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchCode, searchName)} />
            </div>
            
            <div className="bg-[#f9f9fa] border-r border-gray-200 px-3 py-1 flex items-center font-medium text-gray-700">매입처명</div>
            <div className="p-1 flex items-center">
               <Input className="h-6 w-full text-[11px] rounded-[2px]" value={searchName} onChange={(e) => setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchCode, searchName)} />
            </div>
          </div>
          
          <div className="flex justify-end mt-2 gap-1">
            <Button className="h-6 px-3 text-[11px] bg-[#888888] text-white hover:bg-[#666] rounded-[2px]" onClick={() => {setSearchCode(''); setSearchName(''); handleSearch('','');}}>초기화</Button>
            <Button className="h-6 px-3 text-[11px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px]" onClick={() => handleSearch(searchCode, searchName)}>조회</Button>
          </div>
        </div>

        {/* 결과 그리드 영역 */}
        <div className="flex-1 overflow-auto px-3 pb-3">
           <Table className="table-fixed border border-gray-300 w-full text-[12px]">
             <TableHeader className="sticky top-0 bg-[#e0e0e0] z-10 shadow-[0_1px_0_0_#d1d5db]">
                 <TableRow className="h-8 hover:bg-[#e0e0e0]">
                     <TableHead className="text-center py-1 font-bold text-gray-900 w-[150px] border-r border-gray-300">매입처코드</TableHead>
                     <TableHead className="text-center py-1 font-bold text-gray-900">매입처명</TableHead>
                 </TableRow>
             </TableHeader>
             <TableBody>
               {results.length > 0 ? results.map((item, idx) => {
                 const isSelected = selectedPopupItem?.code === item.code;
                 return (
                   <TableRow 
                      key={idx} 
                      className={cn("h-7 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")}
                      onClick={() => setSelectedPopupItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                   >
                     <TableCell className="text-center py-1 font-medium text-gray-900 border-r border-gray-200">{item.code}</TableCell>
                     <TableCell className="text-left py-1 text-gray-900 font-bold pl-4">{item.name}</TableCell>
                   </TableRow>
                 )
               }) : (
                 <TableRow className="h-8"><TableCell colSpan={2} className="text-center text-gray-500 py-4 bg-white">조회된 매입처가 없습니다.</TableCell></TableRow>
               )}
             </TableBody>
           </Table>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="erp-modal-footer">
          <Button className="h-7 px-4 text-[12px] bg-[#00a9ce] text-white hover:bg-[#0098ba] rounded-[2px]" onClick={handleConfirm} disabled={!selectedPopupItem}>확인</Button>
          <Button className="h-7 px-4 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px]" onClick={onClose}>닫기</Button>
        </div>

      </div>
    </div>
  );
}