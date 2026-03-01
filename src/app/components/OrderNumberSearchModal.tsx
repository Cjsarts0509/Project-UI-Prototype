import React, { useState } from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '../../lib/utils';
import { format, subMonths } from 'date-fns';

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

interface OrderNumberSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (orderNo: string) => void;
}

export function OrderNumberSearchModal({ isOpen, onClose, onSelect }: OrderNumberSearchModalProps) {
  const [orderType, setOrderType] = useState('all');
  const [receiveLocation, setReceiveLocation] = useState('all');
  const [orderLimitYn, setOrderLimitYn] = useState('all');
  const [dateStart, setDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [dateEnd, setDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orderNo, setOrderNo] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');

  const [popupItems, setPopupItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleSearch = () => {
    // 임시 더미 데이터
    const data = [
      { id: 1, location: '파주센터', orderDate: '2025-01-22', confirmDate: '2025-01-22', orderType: '일반', type: '정상', orderNo: '00008', supplier: '드림어스컴퍼니', status: '발주확정' },
      { id: 2, location: '파주센터', orderDate: '2025-01-22', confirmDate: '2025-01-22', orderType: 'M2M', type: '정상', orderNo: '00005', supplier: '지니뮤직(씨제이-엠투엠)', status: '발주확정' },
      { id: 3, location: '북시티', orderDate: '2025-01-21', confirmDate: '', orderType: '일반', type: '정상', orderNo: '00009', supplier: 'YG엔터테인먼트', status: '의뢰' },
    ];
    setPopupItems(data);
    setSelectedItem(null);
  };

  const handleReset = () => {
    setOrderType('all'); setReceiveLocation('all'); setOrderLimitYn('all');
    setDateStart(format(subMonths(new Date(), 1), 'yyyy-MM-dd')); setDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setOrderNo(''); setSupplierCode(''); setSupplierName('');
    setPopupItems([]); setSelectedItem(null);
  };

  const handleApply = () => {
    if (selectedItem) {
      onSelect(selectedItem.orderNo);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-gray-400 shadow-2xl w-[850px] flex flex-col h-[550px]">
        {/* Header */}
        <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
          <span className="font-bold text-[13px]">통합발주조회 [SCR_PM_PLOR_M_1055_P2]</span>
          <button onClick={onClose} className="hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        
        {/* Search Area */}
        <div className="p-3 bg-white flex-shrink-0 border-b border-gray-300">
          <div className="border border-gray-300 bg-[#fefefe] flex flex-col text-[12px]">
             <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1.5fr_80px_1fr] border-b border-gray-200">
                <div className="bg-[#eef3f8] px-2 py-1 flex items-center justify-end font-bold text-blue-600 border-r border-gray-200">발주구분</div>
                <div className="p-1 border-r border-gray-200"><Select value={orderType} onValueChange={setOrderType}><SelectTrigger className="h-6 w-full text-[11px]"><SelectValue placeholder="전체" /></SelectTrigger><SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="일반">일반</SelectItem><SelectItem value="M2M">M2M</SelectItem></SelectContent></Select></div>
                <div className="bg-[#eef3f8] px-2 py-1 flex items-center justify-end font-bold text-blue-600 border-r border-gray-200">발주처</div>
                <div className="p-1 border-r border-gray-200"><Select value={receiveLocation} onValueChange={setReceiveLocation}><SelectTrigger className="h-6 w-full text-[11px]"><SelectValue placeholder="선택" /></SelectTrigger><SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="파주센터">파주센터</SelectItem><SelectItem value="북시티">북시티</SelectItem></SelectContent></Select></div>
                <div className="bg-[#eef3f8] px-2 py-1 flex items-center justify-end font-bold text-blue-600 border-r border-gray-200">발주기간</div>
                <div className="p-1 flex items-center gap-1 border-r border-gray-200">
                    <Input className="h-6 w-20 text-[11px] text-center" value={dateStart} onChange={(e) => setDateStart(formatDateString(e.target.value))} placeholder="YYYY-MM-DD" />
                    <span>~</span>
                    <Input className="h-6 w-20 text-[11px] text-center" value={dateEnd} onChange={(e) => setDateEnd(formatDateString(e.target.value))} placeholder="YYYY-MM-DD" />
                </div>
                <div className="bg-[#eef3f8] px-2 py-1 flex items-center justify-end font-bold text-blue-600 border-r border-gray-200">발주제한여부</div>
                <div className="p-1"><Select value={orderLimitYn} onValueChange={setOrderLimitYn}><SelectTrigger className="h-6 w-full text-[11px]"><SelectValue placeholder="전체" /></SelectTrigger><SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent></Select></div>
             </div>
             <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr_80px_1fr]">
                <div className="bg-[#eef3f8] px-2 py-1 flex items-center justify-end font-bold text-blue-600 border-r border-gray-200">발주번호</div>
                <div className="p-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px]" value={orderNo} onChange={e => setOrderNo(e.target.value)} /></div>
                <div className="bg-[#eef3f8] px-2 py-1 flex items-center justify-end font-bold text-blue-600 border-r border-gray-200">매입처</div>
                <div className="p-1 border-r border-gray-200 flex items-center gap-1 col-span-3">
                    <Input className="h-6 w-20 text-[11px]" value={supplierCode} onChange={e => setSupplierCode(e.target.value)} />
                    <Input className="h-6 flex-1 text-[11px]" value={supplierName} onChange={e => setSupplierName(e.target.value)} />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1 pr-2">
                    <Button variant="outline" className="h-6 px-3 bg-[#888888] text-white hover:bg-[#666] border-none text-[11px] font-bold" onClick={handleSearch}>조회(F4)</Button>
                    <Button variant="outline" className="h-6 px-3 bg-[#888888] text-white hover:bg-[#666] border-none text-[11px] font-bold" onClick={handleReset}>초기화(F3)</Button>
                </div>
             </div>
          </div>
        </div>

        {/* List Area */}
        <div className="flex items-center gap-1 mt-2 mb-1 px-3">
           <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-red-600 border-b-[5px] border-b-transparent"></div>
           <h3 className="text-[13px] font-bold text-gray-900">발주번호목록</h3>
        </div>
        <div className="flex-1 overflow-auto px-3 pb-3">
           <Table className="table-fixed border border-gray-300 w-full text-[12px]">
             <TableHeader className="sticky top-0 bg-[#f4f4f4] z-10 shadow-[0_1px_0_0_#d1d5db]">
               <TableRow className="h-8 hover:bg-[#f4f4f4]">
                 <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주처</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주일자</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1">확정일자</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주구분</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주유형</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주번호</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1 w-[180px]">매입처</TableHead>
                 <TableHead className="text-center font-bold text-gray-900 p-1">진행상태</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {popupItems.map((item, idx) => {
                 const isSelected = selectedItem?.id === item.id;
                 return (
                   <TableRow 
                      key={idx} 
                      className={cn("h-7 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item.orderNo); onClose(); }} 
                   >
                     <TableCell className="text-center border-r border-gray-200 p-1">{item.location}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1">{item.orderDate}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1">{item.confirmDate}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1">{item.orderType}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1">{item.type}</TableCell>
                     <TableCell className="text-center border-r border-gray-200 p-1 font-bold text-blue-600">{item.orderNo}</TableCell>
                     <TableCell className="text-left border-r border-gray-200 p-1 truncate" title={item.supplier}>{item.supplier}</TableCell>
                     <TableCell className="text-center p-1">{item.status}</TableCell>
                   </TableRow>
                 )
               })}
             </TableBody>
           </Table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 p-2 flex justify-center gap-1 flex-shrink-0 bg-[#0f284e]">
          <Button className="h-7 px-6 text-[12px] bg-[#1d4175] text-white hover:bg-[#153159] border border-gray-500 font-bold rounded-[2px]" onClick={handleApply} disabled={!selectedItem}>선택</Button>
          <Button className="h-7 px-6 text-[12px] bg-[#1d4175] text-white hover:bg-[#153159] border border-gray-500 font-bold rounded-[2px]" onClick={onClose}>X 닫기</Button>
        </div>
      </div>
    </div>
  );
}