import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { SupplierSearchModal } from './SupplierSearchModal';

interface SupplierItemSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierCode: string;
  initialSearchName?: string; // 부모 컴포넌트 호환성을 위해 남겨둠
  onSelect: (item: any) => void;
}

export function SupplierItemSearchModal({ isOpen, onClose, supplierCode, onSelect }: SupplierItemSearchModalProps) {
  const { suppliers = [], supplierItems = [] } = useMockData();
  
  // 모달 내 조회 조건 State
  const [searchSupCode, setSearchSupCode] = useState('');
  const [searchSupName, setSearchSupName] = useState('');
  const [status, setStatus] = useState('all');

  const [popupItems, setPopupItems] = useState<any[]>([]);
  const [selectedPopupItem, setSelectedPopupItem] = useState<any>(null);
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);

  // ★ 기획서 1번: 팝업 오픈 시 자동 세팅 및 자동 조회 로직
  useEffect(() => {
    if (isOpen) {
      const foundSup = suppliers.find(s => s.code === supplierCode.trim());
      const initCode = supplierCode.trim();
      const initName = foundSup ? foundSup.name : '';

      setSearchSupCode(initCode);
      setSearchSupName(initName);
      setStatus('all');
      setSelectedPopupItem(null);
      
      // 이전 화면에서 매입처가 입력된 상태면 "자동 조회"
      if (initCode) {
        const filtered = supplierItems.filter(item => item.supplierCode === initCode);
        setPopupItems(filtered);
      } else {
        // 공란일 시 빈 목록 (조회내용 없음)
        setPopupItems([]);
      }
    }
  }, [isOpen, supplierCode, suppliers, supplierItems]);

  const handlePopupSearch = () => {
    if (!searchSupCode.trim()) {
      alert('매입처 코드를 입력해주세요.');
      return;
    }
    const filtered = supplierItems.filter(item => item.supplierCode === searchSupCode.trim());
    setPopupItems(filtered);
    setSelectedPopupItem(null);
  };

  // ★ 매입처명 Enter 시: 매입처명으로 매입처를 먼저 조회 → 매칭 후 품목 자동 조회
  const handleSupplierNameEnter = () => {
    const name = searchSupName.trim();
    if (!name) {
      // 매입처명 비어있으면 매입처 팝업 열기
      setIsSupplierSearchOpen(true);
      return;
    }
    const matches = suppliers.filter(s => s.name.includes(name));
    if (matches.length === 1) {
      // 정확히 1건 매칭: 코드 세팅 + 품목 자동 조회
      setSearchSupCode(matches[0].code);
      setSearchSupName(matches[0].name);
      const filtered = supplierItems.filter(item => item.supplierCode === matches[0].code);
      setPopupItems(filtered);
      setSelectedPopupItem(null);
    } else {
      // 0건 또는 다건: 매입처 조회 팝업으로 이동
      setIsSupplierSearchOpen(true);
    }
  };

  const handleReset = () => {
    setSearchSupCode('');
    setSearchSupName('');
    setStatus('all');
    setPopupItems([]);
    setSelectedPopupItem(null);
  };

  const handleApply = () => {
    if (selectedPopupItem) {
      onSelect(selectedPopupItem);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-gray-400 shadow-2xl w-[650px] flex flex-col h-[500px]">
        
        {/* --- Header --- */}
        <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
          <span className="font-bold text-[13px]">매입처품목 조회</span>
          <button onClick={onClose} className="hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        
        {/* --- Search Area (기획서 1번 영역) --- */}
        <div className="p-3 bg-white flex-shrink-0">
          <div className="border border-gray-300 flex items-center justify-between bg-white text-[12px] p-1">
            <div className="flex items-center gap-1">
                <div className="bg-[#eef3f8] px-3 py-1 flex items-center justify-end font-bold text-blue-600 h-6 w-[80px]">
                   매입처<span className="text-red-500 ml-1">*</span>
                </div>
                <div className="flex items-center gap-1 ml-1">
                   <Input 
                     className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" 
                     value={searchSupCode} 
                     onChange={(e) => setSearchSupCode(e.target.value)} 
                     onKeyDown={(e) => e.key === 'Enter' && handlePopupSearch()} 
                   />
                   <div className="relative flex items-center w-[150px]">
                      <Input 
                        className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" 
                        value={searchSupName} 
                        onChange={(e) => setSearchSupName(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameEnter()} 
                      />
                      <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSupplierSearchOpen(true)} />
                   </div>
                   <Select value={status} onValueChange={setStatus}>
                     <SelectTrigger className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300 ml-1">
                        <SelectValue placeholder="전체" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
            </div>
            
            {/* 우측 상단 조회 및 초기화 버튼 */}
            <div className="flex items-center gap-1 pr-1">
                <Button variant="outline" className="h-6 w-16 bg-[#888888] text-white hover:bg-[#666] border-none text-[11px] font-bold rounded-[2px]" onClick={handleReset}>초기화</Button>
                <Button variant="outline" className="h-6 w-16 bg-[#888888] text-white hover:bg-[#666] border-none text-[11px] font-bold rounded-[2px]" onClick={handlePopupSearch}>조회</Button>
            </div>
          </div>
        </div>

        {/* --- List Area (기획서 2번 영역) --- */}
        <div className="flex-1 overflow-auto px-3 pb-3">
           <Table className="table-fixed border border-gray-300 w-full text-[12px]">
             <TableHeader className="sticky top-0 bg-[#f4f4f4] z-10 shadow-[0_1px_0_0_#d1d5db]">
               <TableRow className="h-8 hover:bg-[#f4f4f4]">
                 <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처품목코드</TableHead>
                 <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처품목명</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 p-1">코드설명</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {popupItems.length > 0 ? popupItems.map((item, idx) => {
                 const isSelected = selectedPopupItem?.itemCode === item.itemCode;
                 return (
                   <TableRow 
                      key={idx} 
                      className={cn("h-7 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")}
                      onClick={() => setSelectedPopupItem(item)}
                      // ★ 기획서 2번: 더블클릭 시 "적용" 버튼과 같은 기능
                      onDoubleClick={() => { onSelect(item); onClose(); }} 
                   >
                     <TableCell className="text-center border-r border-gray-200 p-1 font-medium">{String(item.itemCode).padStart(3, '0')}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1 text-gray-800">{item.itemName}</TableCell>
                     <TableCell className="text-left p-1 pl-3 text-gray-700">{item.itemDescription || ''}</TableCell>
                   </TableRow>
                 )
               }) : (
                 <TableRow className="h-8">
                   <TableCell colSpan={3} className="text-center text-gray-500 py-4 bg-white">조회된 내용이 없습니다.</TableCell>
                 </TableRow>
               )}
             </TableBody>
           </Table>
        </div>

        {/* --- Footer --- */}
        <div className="erp-modal-footer">
          {/* ★ 기획서 2번: '확인' 버튼을 '적용' 버튼으로 명칭 변경 */}
          <Button className="h-7 px-4 text-[12px] bg-[#00a9ce] text-white hover:bg-[#0098ba] border-none font-bold rounded-[2px]" onClick={handleApply} disabled={!selectedPopupItem}>적용</Button>
          <Button className="h-7 px-4 text-[12px] bg-[#555555] text-white hover:bg-[#444444] border-none font-bold rounded-[2px]" onClick={onClose}>닫기</Button>
        </div>
      </div>

      {/* 매입처 조회 공통팝업 */}
      <SupplierSearchModal
        isOpen={isSupplierSearchOpen}
        onClose={() => setIsSupplierSearchOpen(false)}
        initialSearchName={searchSupName}
        onSelect={(item) => {
          setSearchSupCode(item.code);
          setSearchSupName(item.name);
          // 매입처 선택 후 자동 조회
          const filtered = supplierItems.filter(si => si.supplierCode === item.code);
          setPopupItems(filtered);
          setSelectedPopupItem(null);
        }}
      />
    </div>
  );
}