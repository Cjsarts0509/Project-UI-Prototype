import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';

import { SupplierSearchModal } from './SupplierSearchModal';
import { SupplierItemSearchModal } from './SupplierItemSearchModal';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  initialSearchName?: string; // ★ 추가
}

export function ProductSearchModal({ isOpen, onClose, onSelect, initialSearchName = '' }: ProductSearchModalProps) {
  const { products = [], suppliers = [], supplierItems = [] } = useMockData();
  
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  const [searchSupplierItemCode, setSearchSupplierItemCode] = useState('');
  const [searchSupplierItemName, setSearchSupplierItemName] = useState('');

  const [popupItems, setPopupItems] = useState<any[]>([]);
  const [selectedPopupItem, setSelectedPopupItem] = useState<any>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchCode('');
      setSearchName(initialSearchName);
      setSearchSupplierCode(''); setSearchSupplierName('');
      setSearchSupplierItemCode(''); setSearchSupplierItemName('');
      setSelectedPopupItem(null);
      
      if (initialSearchName.trim()) {
        const filtered = products.filter(item => item.productName.includes(initialSearchName));
        setPopupItems(filtered);
      } else {
        setPopupItems([]);
      }
    }
  }, [isOpen, initialSearchName, products]);

  const handleSupplierCodeSearch = () => {
    if (!searchSupplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = suppliers.filter(s => s.code === searchSupplierCode.trim());
    if (exactMatches.length === 1) {
      setSearchSupplierName(exactMatches[0].name);
      setSearchSupplierItemCode(''); setSearchSupplierItemName(''); 
    } else {
      setIsSupplierModalOpen(true); 
    }
  };

  const handleSupplierItemCodeSearch = () => {
    if (!searchSupplierCode.trim()) { alert('매입처코드값을 먼저 입력해주세요'); return; }
    if (!searchSupplierItemCode.trim()) { setIsSupplierItemModalOpen(true); return; }
    
    const formatted = searchSupplierItemCode.trim().padStart(3, '0');
    setSearchSupplierItemCode(formatted); 
    const exactMatches = supplierItems.filter(si => si.supplierCode === searchSupplierCode.trim() && String(si.itemCode).padStart(3, '0') === formatted);
    
    if (exactMatches.length === 1) setSearchSupplierItemName(exactMatches[0].itemName);
    else setIsSupplierItemModalOpen(true);
  };

  const handlePopupSearch = () => {
    const filtered = products.filter(item => {
      if (searchCode && !item.productCode.includes(searchCode)) return false;
      if (searchName && !item.productName.includes(searchName)) return false;
      if (searchSupplierCode && !item.supplierCode.includes(searchSupplierCode)) return false;
      if (searchSupplierItemCode && !item.supplierItemCode.includes(searchSupplierItemCode)) return false;
      return true;
    });
    setPopupItems(filtered);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-gray-400 shadow-2xl w-[800px] flex flex-col h-[550px]">
        <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
          <span className="font-bold text-[13px]">상품조회 및 선택</span>
          <button onClick={onClose} className="hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-3 bg-white flex-shrink-0">
          <div className="border border-gray-300 grid grid-cols-[100px_1fr_100px_1fr] bg-white text-[12px] mb-1">
            <div className="bg-[#f9f9fa] border-r border-b border-gray-200 px-3 py-1 flex items-center font-medium text-gray-700">상품코드</div>
            <div className="border-r border-b border-gray-200 p-1 flex items-center">
               <Input className="h-6 w-full text-[11px] rounded-[2px]" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePopupSearch()} />
            </div>
            
            <div className="bg-[#f9f9fa] border-r border-b border-gray-200 px-3 py-1 flex items-center font-medium text-gray-700">상품명</div>
            <div className="border-b border-gray-200 p-1 flex items-center">
               <Input className="h-6 w-full text-[11px] rounded-[2px]" value={searchName} onChange={(e) => setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePopupSearch()} />
            </div>

            <div className="bg-[#f9f9fa] border-r border-b border-gray-200 px-3 py-1 flex items-center font-medium text-gray-700">매입처코드</div>
            <div className="border-r border-b border-gray-200 p-1 flex items-center gap-1">
               <Input className="h-6 w-24 text-[11px] rounded-[2px] border-gray-300" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierCodeSearch(); }} />
               <div className="flex-1 relative flex items-center">
                  <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} />
                  <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSupplierModalOpen(true)} />
               </div>
            </div>

            <div className="bg-[#f9f9fa] border-r border-b border-gray-200 px-3 py-1 flex items-center font-medium text-gray-700">매입처품목코드</div>
            <div className="border-b border-gray-200 p-1 flex items-center gap-1">
               <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" value={searchSupplierItemCode} onChange={(e) => setSearchSupplierItemCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemCodeSearch(); }} />
               <div className="flex-1 relative flex items-center">
                  <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" value={searchSupplierItemName} onChange={(e) => setSearchSupplierItemName(e.target.value)} />
                  <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSupplierItemModalOpen(true)} />
               </div>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button className="h-6 px-3 text-[11px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px]" onClick={handlePopupSearch}>조회</Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-3 pb-3">
           <Table className="table-fixed border border-gray-300 w-full text-[12px]">
             <TableHeader className="sticky top-0 bg-[#e0e0e0] z-10 shadow-[0_1px_0_0_#d1d5db]">
               <TableRow className="h-8 hover:bg-[#e0e0e0]">
                 <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                 <TableHead className="w-[220px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                 <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                 <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처품목명</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 p-1">정가</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {popupItems.length > 0 ? popupItems.map((item, idx) => {
                 const isSelected = selectedPopupItem?.productCode === item.productCode;
                 const sItem = supplierItems.find(si => si.supplierCode === item.supplierCode && String(si.itemCode).padStart(3,'0') === item.supplierItemCode);
                 return (
                   <TableRow 
                      key={idx} 
                      className={cn("h-7 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50")}
                      onClick={() => setSelectedPopupItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                   >
                     <TableCell className="text-center border-r border-gray-200 p-1 font-medium">{item.productCode}</TableCell>
                     <TableCell className="text-left border-r border-gray-200 p-1 pl-2 truncate" title={item.productName}>{item.productName}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1 truncate">{item.supplierName}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1 truncate">{sItem ? sItem.itemName : ''}</TableCell>
                     <TableCell className="text-right p-1 pr-2">{Number(item.currentPrice).toLocaleString()}</TableCell>
                   </TableRow>
                 )
               }) : (
                 <TableRow className="h-8"><TableCell colSpan={5} className="text-center text-gray-500 py-4">조회된 데이터가 없습니다.</TableCell></TableRow>
               )}
             </TableBody>
           </Table>
        </div>

        <div className="erp-modal-footer">
          <Button className="h-7 px-4 text-[12px] bg-[#00a9ce] text-white hover:bg-[#0098ba] rounded-[2px]" onClick={handleConfirm} disabled={!selectedPopupItem}>확인</Button>
          <Button className="h-7 px-4 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px]" onClick={onClose}>닫기</Button>
        </div>
      </div>

      <SupplierSearchModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        initialSearchName={searchSupplierName}
        onSelect={(item) => {
          setSearchSupplierCode(item.code);
          setSearchSupplierName(item.name);
          setSearchSupplierItemCode('');
          setSearchSupplierItemName('');
        }}
      />
      <SupplierItemSearchModal
        isOpen={isSupplierItemModalOpen}
        onClose={() => setIsSupplierItemModalOpen(false)}
        supplierCode={searchSupplierCode}
        initialSearchName={searchSupplierItemName}
        onSelect={(item) => {
          setSearchSupplierItemCode(String(item.itemCode).padStart(3, '0'));
          setSearchSupplierItemName(item.itemName);
        }}
      />
    </div>
  );
}