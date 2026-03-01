import React, { useState } from 'react';
import { Calendar, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format, subMonths } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';

import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { OrderNumberSearchModal } from '../components/OrderNumberSearchModal';

const ALLOWED_CATEGORY_CODES = ['M1', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'T1', 'T2', 'U1'];

// ★ 음반 전용 매입처 (하드코딩 필터용)
const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const parseExcelDate = (val: any) => {
  if (!val || val === '#') return '';
  if (typeof val === 'string' && val.includes('-')) return val.split(' ')[0];
  let raw = String(val).replace(/[^0-9]/g, '');
  if (raw.length >= 8) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  const numVal = Number(val);
  if (!isNaN(numVal) && numVal > 25569 && numVal < 99999) {
      const date = new Date((numVal - 25569) * 86400 * 1000);
      return format(date, 'yyyy-MM-dd');
  }
  return String(val);
};

const safeText = (val: any) => val && val !== '#' ? val : '';

const DateRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 10 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={endVal} onChange={(e) => onEndChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
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

const actionBtnClass = "erp-btn-action";
const headerBtnClass = "erp-btn-header";

export default function AlbumOrderConfirmPage() {
  const { suppliers, products, categories } = useMockData();
  const displayCategories = (categories || []).filter(c => ALLOWED_CATEGORY_CODES.includes(c.code));

  const [receiveLocation, setReceiveLocation] = useState('파주센터');
  const [orderDateStart, setOrderDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [orderDateEnd, setOrderDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orderNo, setOrderNo] = useState('');
  
  const [confirmYn, setConfirmYn] = useState('all'); 
  const [searchType, setSearchType] = useState('M2M');
  const [category, setCategory] = useState('all');

  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isOrderNoModalOpen, setIsOrderNoModalOpen] = useState(false);

  const [masterData, setMasterData] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
  const [activeMasterRowId, setActiveMasterRowId] = useState<string | null>(null);

  const handleSearchReset = () => {
    setReceiveLocation('파주센터'); setOrderDateStart(format(subMonths(new Date(), 1), 'yyyy-MM-dd')); setOrderDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setOrderNo(''); setConfirmYn('all'); setSearchType('M2M'); setCategory('all');
    setSupplierCode(''); setSupplierName('');
    setMasterData([]); setDetailData([]); setSelectedMasterIds([]); setActiveMasterRowId(null);
  };

  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => ALBUM_SUPPLIERS.includes(s.code) && s.code === supplierCode.trim());
    if (exactMatches.length === 1) { setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => ALBUM_SUPPLIERS.includes(s.code) && s.name === supplierName.trim());
    if (exactMatches.length === 1) { setSupplierCode(exactMatches[0].code); setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSearch = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // ★ M2M 12개, 일반 24개 더미 마스터 데이터 생성 (매입처 섞어서)
    const baseMasterData = [
      // M2M (HR00001) - 12개
      { id: '1', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'M0001', status: '발주확정', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', customsCode: 'HR00001' },
      { id: '2', confirm: '미확정', location: '북시티', orderDate: today, orderNo: 'M0002', status: '의뢰', supplierCode: '01B0478', supplierName: 'YG PLUS', customsCode: 'HR00001' },
      { id: '3', confirm: '미확정', location: '북시티', orderDate: today, orderNo: 'M0003', status: '의뢰', supplierCode: '01B0478', supplierName: 'YG PLUS', customsCode: 'HR00001' },
      { id: '4', confirm: '확정', location: '광화문', orderDate: today, orderNo: 'M0004', status: '발주확정', supplierCode: '01B0478', supplierName: 'YG PLUS', customsCode: 'HR00001' },
      { id: '5', confirm: '확정', location: '광화문', orderDate: today, orderNo: 'M0005', status: '발주확정', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', customsCode: 'HR00001' },
      { id: '6', confirm: '미확정', location: '파주센터', orderDate: today, orderNo: 'M0006', status: '의뢰', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', customsCode: 'HR00001' },
      { id: '7', confirm: '미확정', location: '파주센터', orderDate: today, orderNo: 'M0007', status: '의뢰', supplierCode: '01B0478', supplierName: 'YG PLUS', customsCode: 'HR00001' },
      { id: '8', confirm: '미확정', location: '광화문', orderDate: today, orderNo: 'M0008', status: '의뢰', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', customsCode: 'HR00001' },
      { id: '9', confirm: '미확정', location: '파주센터', orderDate: today, orderNo: 'M0009', status: '의뢰', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', customsCode: 'HR00001' },
      { id: '10', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'M0010', status: '발주확정', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', customsCode: 'HR00001' },
      { id: '11', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'M0011', status: '발주확정', supplierCode: '01B0470', supplierName: '드림어스컴퍼니', customsCode: 'HR00001' },
      { id: '12', confirm: '미확정', location: '파주센터', orderDate: today, orderNo: 'M0012', status: '의뢰', supplierCode: '01B0470', supplierName: '드림어스컴퍼', customsCode: 'HR00001' },
      // 일반 (ETC) - 24개
      { id: '13', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'N0001', status: '발주확정', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '14', confirm: '확정', location: '광화문', orderDate: today, orderNo: 'N0002', status: '발주확정', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '15', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'N0003', status: '발주확정', supplierCode: '01B0504', supplierName: '지니뮤직', customsCode: 'ETC' },
      { id: '16', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'N0004', status: '발주확정', supplierCode: '01B0504', supplierName: '지니뮤직', customsCode: 'ETC' },
      { id: '17', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'N0005', status: '발주확정', supplierCode: '01B0479', supplierName: '유니버설뮤직', customsCode: 'ETC' },
      { id: '18', confirm: '미확정', location: '북시티', orderDate: today, orderNo: 'N0006', status: '의뢰', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '19', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'N0007', status: '발주확정', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '20', confirm: '미확정', location: '광화문', orderDate: today, orderNo: 'N0008', status: '의뢰', supplierCode: '01B0504', supplierName: '지니뮤직', customsCode: 'ETC' },
      { id: '21', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'N0009', status: '발주확정', supplierCode: '01B0521', supplierName: '소니뮤직', customsCode: 'ETC' },
      { id: '22', confirm: '확정', location: '북시티', orderDate: today, orderNo: 'N0010', status: '발주확정', supplierCode: '01B0509', supplierName: '카카오엔터테인먼트', customsCode: 'ETC' },
      { id: '23', confirm: '미확정', location: '북시티', orderDate: today, orderNo: 'N0011', status: '의뢰', supplierCode: '01B0479', supplierName: '유니버설뮤직', customsCode: 'ETC' },
      { id: '24', confirm: '미확정', location: '북시티', orderDate: today, orderNo: 'N0012', status: '의뢰', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '25', confirm: '확정', location: '광화문', orderDate: today, orderNo: 'N0013', status: '발주확정', supplierCode: '01B0479', supplierName: '유니버설뮤직', customsCode: 'ETC' },
      { id: '26', confirm: '확정', location: '광화문', orderDate: today, orderNo: 'N0014', status: '발주확정', supplierCode: '01B0504', supplierName: '지니뮤직', customsCode: 'ETC' },
      { id: '27', confirm: '미확정', location: '북시티', orderDate: today, orderNo: 'N0015', status: '의뢰', supplierCode: '01B0479', supplierName: '유니버설뮤직', customsCode: 'ETC' },
      { id: '28', confirm: '확정', location: '광화문', orderDate: today, orderNo: 'N0016', status: '발���확정', supplierCode: '01B0479', supplierName: '유니버설뮤직', customsCode: 'ETC' },
      { id: '29', confirm: '확정', location: '파주센터', orderDate: today, orderNo: 'N0017', status: '발주확정', supplierCode: '01B0509', supplierName: '카카오엔터테인먼트', customsCode: 'ETC' },
      { id: '30', confirm: '확정', location: '파주센터', orderDate: today, orderNo: 'N0018', status: '발주확정', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '31', confirm: '미확정', location: '광화문', orderDate: today, orderNo: 'N0019', status: '의뢰', supplierCode: '01B0504', supplierName: '지니뮤직', customsCode: 'ETC' },
      { id: '32', confirm: '확정', location: '파주센터', orderDate: today, orderNo: 'N0020', status: '발주확정', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '33', confirm: '미확정', location: '북시티', orderDate: today, orderNo: 'N0021', status: '의뢰', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '34', confirm: '미확정', location: '파주센터', orderDate: today, orderNo: 'N0022', status: '의뢰', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '35', confirm: '미확정', location: '파주센터', orderDate: today, orderNo: 'N0023', status: '의뢰', supplierCode: '01B0510', supplierName: '다날엔터테인먼트', customsCode: 'ETC' },
      { id: '36', confirm: '미확정', location: '광화문', orderDate: today, orderNo: 'N0024', status: '의뢰', supplierCode: '01B0509', supplierName: '카카오엔터테인먼트', customsCode: 'ETC' },
    ];

    const filteredMaster = baseMasterData.filter(item => {
       if (confirmYn !== 'all' && item.confirm !== confirmYn) return false;
       if (receiveLocation !== 'all' && item.location !== receiveLocation) return false;
       if (orderNo && item.orderNo !== orderNo) return false;
       if (supplierCode && item.supplierCode !== supplierCode) return false;
       if (supplierName && !item.supplierName.includes(supplierName)) return false;
       
       // 운송통관사 (M2M vs 일반) 필터
       const isM2M = item.customsCode === 'HR00001';
       if (searchType === 'M2M' && !isM2M) return false;
       if (searchType === '일반' && isM2M) return false;

       const itemDate = parseExcelDate(item.orderDate);
       if (itemDate) {
            if (orderDateStart && itemDate < orderDateStart) return false;
            if (orderDateEnd && itemDate > orderDateEnd) return false;
       } else {
            if (orderDateStart || orderDateEnd) return false;
       }
       return true;
    });

    const displayMaster = [...filteredMaster];
    while(displayMaster.length < 15) {
        displayMaster.push({ id: `empty-${displayMaster.length}`, confirm: '', location: '', orderDate: '', orderNo: '', status: '', supplierCode: '', supplierName: '', customsCode: '' });
    }
    
    setMasterData(displayMaster);
    setSelectedMasterIds([]);
    
    const firstValidRow = displayMaster.find(r => r.orderNo);
    if (firstValidRow) {
       setActiveMasterRowId(firstValidRow.id);
       loadDetailData(firstValidRow.id, firstValidRow.supplierCode, firstValidRow.orderNo);
    } else {
       setActiveMasterRowId(null);
       setDetailData([]);
    }
  };

  const loadDetailData = (mId: string, suppCode: string, targetOrderNo: string) => {
    // 발주 매입처 코드와 일치하는 실제 상품 데이터 필터링
    let matchedProducts = (products || []).filter(p => safeText(p.supplierCode) === suppCode);
    
    // 분류(Category) 조건 반영
    if (category !== 'all') {
        const catName = categories.find(c => c.code === category)?.name;
        if (catName) {
            matchedProducts = matchedProducts.filter(p => safeText(p.productCategory) === catName || safeText(p.groupCategory) === catName);
        }
    }

    // 만약 데이터가 없다면 임시로 해당 매입처의 상품 중 일부를 노출
    if (matchedProducts.length === 0) {
        matchedProducts = (products || []).filter(p => ALBUM_SUPPLIERS.includes(safeText(p.supplierCode))).slice(0, 3);
    } else {
        matchedProducts = matchedProducts.slice(0, 5); // 최대 5개 노출
    }

    const newDetails = matchedProducts.map((p, idx) => ({
        id: `d${mId}-${idx}`,
        seq: idx + 1,
        orderNo: targetOrderNo,
        productCode: safeText(p.productCode),
        productName: safeText(p.productName),
        artist: safeText(p.artistName), 
        qty: (idx + 1) * 5, 
        type: idx % 2 === 0 ? '일반' : '고객'
    }));

    setDetailData(newDetails);
  };

  const handleMasterRowClick = (row: any) => {
    if (!row.orderNo) return; 
    setActiveMasterRowId(row.id);
    loadDetailData(row.id, row.supplierCode, row.orderNo);
  };

  const handleMasterSelectAll = (checked: boolean) => {
    if (checked) setSelectedMasterIds(masterData.filter(item => item.orderNo !== '').map(item => item.id));
    else setSelectedMasterIds([]);
  };

  const handleMasterSelectRow = (id: string, checked: boolean) => {
    if (checked) setSelectedMasterIds(prev => [...prev, id]);
    else setSelectedMasterIds(prev => prev.filter(rowId => rowId !== id));
  };

  const handleConfirmOrder = () => {
    const unconfirmedSelections = masterData.filter(item => selectedMasterIds.includes(item.id) && item.confirm === '미확정');
    
    if (selectedMasterIds.length === 0) return alert("발주확정할 항목을 선택해주세요.");
    if (unconfirmedSelections.length === 0) return alert("선택한 항목은 이미 발주가 확정된 상태입니다.");

    alert(`${unconfirmedSelections.length}건의 발주가 확정처리 되었습니다.`);
    
    setMasterData(prev => prev.map(item => 
        selectedMasterIds.includes(item.id) ? { ...item, confirm: '확정', status: '발주확정' } : item
    ));
    setSelectedMasterIds([]);
  };

  const actualMasterCount = masterData.filter(item => item.orderNo !== '').length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">음반 발주확정</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">입하처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={receiveLocation} onValueChange={setReceiveLocation}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="파주센터">파주센터</SelectItem><SelectItem value="북시티">북시티</SelectItem></SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200">발주일자</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={orderDateStart} endVal={orderDateEnd} onStartChange={setOrderDateStart} onEndChange={setOrderDateEnd} />
             </div>
             <Label className="border-r border-gray-200">발주번호</Label>
             <div className="flex items-center p-1 gap-1 relative">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
                 <Search className="absolute right-2.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsOrderNoModalOpen(true)} />
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">확정여부</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={confirmYn} onValueChange={setConfirmYn}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="확정">확정</SelectItem>
                        <SelectItem value="미확정">미확정</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200">조회구분</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="M2M">M2M</SelectItem><SelectItem value="일반">일반</SelectItem></SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200">분류</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">전체</SelectItem>
                       <SelectItem value="가요">가요</SelectItem>
                       <SelectItem value="POP">POP</SelectItem>
                       <SelectItem value="클래식">클래식</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr]">
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative col-span-5">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="w-[300px] relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
               <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
               <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
       </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 mt-2">
          
          <div className="w-[45%] flex flex-col min-h-0">
             <div className="erp-section-group flex-1 min-h-0 flex flex-col">
             <div className="erp-section-toolbar">
                <div className="erp-section-title">발주내역</div>
             </div>
             <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
              <div className="flex-1 overflow-auto">
                <Table className="table-fixed min-w-[700px] text-[11px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="h-8">
                            <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">
                                <Checkbox checked={selectedMasterIds.length === actualMasterCount && actualMasterCount > 0} onCheckedChange={(c) => handleMasterSelectAll(!!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px] bg-white"/>
                            </TableHead>
                            <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">확정</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">입하처</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주일자</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주번호</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주상태</TableHead>
                            <TableHead className="text-center font-bold text-gray-900 p-1 w-[200px]">매입처</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {masterData.map((row) => {
                            const isActive = activeMasterRowId === row.id && row.orderNo;
                            return (
                              <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", isActive ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleMasterRowClick(row)}>
                                  <TableCell className="text-center p-0 border-r border-gray-200">
                                      {row.orderNo && <Checkbox checked={selectedMasterIds.includes(row.id)} onCheckedChange={(c) => handleMasterSelectRow(row.id, !!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px]" />}
                                  </TableCell>
                                  <TableCell className={cn("text-center p-1 border-r border-gray-200 font-bold", row.confirm === '미확정' ? 'text-red-500' : 'text-gray-600')}>{row.confirm}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.location}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.orderDate}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-blue-600 font-bold">{row.orderNo}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.status}</TableCell>
                                  <TableCell className="text-left p-1 text-gray-800 truncate" title={row.supplierName}>{row.supplierName}</TableCell>
                              </TableRow>
                            );
                        })}
                        {masterData.filter(r => r.orderNo).length === 0 && (
                          Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={`empty-m-${i}`} className="h-8 border-b border-gray-200 bg-white">
                              <TableCell className="border-r border-gray-200"></TableCell>
                              <TableCell className="border-r border-gray-200"></TableCell>
                              <TableCell className="border-r border-gray-200"></TableCell>
                              <TableCell className="border-r border-gray-200"></TableCell>
                              <TableCell className="border-r border-gray-200"></TableCell>
                              <TableCell className="border-r border-gray-200"></TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          ))
                        )}
                    </TableBody>
                </Table>
              </div>
             </div>
             </div> {/* close erp-section-group */}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
             <div className="erp-section-group flex-1 min-h-0 flex flex-col">
             <div className="erp-section-toolbar">
                <span className="erp-section-title">발주세부내역</span>
                <div className="flex gap-1">
                   <Button variant="outline" className={actionBtnClass} onClick={() => alert("출력")}>출력(F8)</Button>
                   <Button variant="outline" className={actionBtnClass} onClick={handleConfirmOrder}>발주확정</Button>
                   <Button variant="outline" className={actionBtnClass} onClick={() => alert("주문서 생성")}>주문서생성</Button>
                   <Button variant="outline" className={actionBtnClass} onClick={() => alert("엑셀 다운로드")}>엑셀다운</Button>
                </div>
             </div>
             <div className="flex-1 flex flex-col min-h-0 border border-gray-300 bg-white">
              <div className="flex-1 overflow-auto">
                <Table className="table-fixed min-w-[800px] text-[11px]">
                  <TableHeader className="sticky top-0 bg-[#f4f4f4] z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1">순번</TableHead>
                          <TableHead className="w-[120px] text-center font-bold border-r border-gray-300 p-1">주문번호</TableHead>
                          <TableHead className="w-[140px] text-center font-bold border-r border-gray-300 p-1">상품코드</TableHead>
                          <TableHead className="w-[200px] text-center font-bold border-r border-gray-300 p-1">상품명</TableHead>
                          <TableHead className="w-[150px] text-center font-bold border-r border-gray-300 p-1">아티스트</TableHead>
                          <TableHead className="w-[80px] text-center font-bold border-r border-gray-300 p-1">발주수량</TableHead>
                          <TableHead className="w-[80px] text-center font-bold p-1">접수구분</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {detailData.length > 0 ? detailData.map((row) => (
                        <TableRow key={row.id} className="h-8 border-b border-gray-200 hover:bg-blue-50/50 bg-white">
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.seq}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.orderNo}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.productCode}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate" title={row.productName}>{row.productName}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate" title={row.artist}>{row.artist}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 pr-3 font-bold text-gray-800">{row.qty}</TableCell>
                            <TableCell className="text-center p-1 text-gray-600">{row.type}</TableCell>
                        </TableRow>
                      )) : (
                        Array.from({ length: 15 }).map((_, i) => (
                          <TableRow key={`empty-d-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            <TableCell className="border-r border-gray-200"></TableCell><TableCell className="border-r border-gray-200"></TableCell>
                            <TableCell className="border-r border-gray-200"></TableCell><TableCell className="border-r border-gray-200"></TableCell>
                            <TableCell className="border-r border-gray-200"></TableCell><TableCell className="border-r border-gray-200"></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))
                      )}
                  </TableBody>
                </Table>
              </div>
             </div>
             </div> {/* close erp-section-group */}
          </div>
      </div>

      <SupplierSearchModal 
        isOpen={isSupplierModalOpen} 
        onClose={() => setIsSupplierModalOpen(false)} 
        initialSearchName={supplierName} 
        onSelect={(item) => { 
            if (!ALBUM_SUPPLIERS.includes(item.code)) {
                alert('음반 매입처만 선택 가능합니다.');
                return;
            }
            setSupplierCode(item.code); 
            setSupplierName(item.name); 
        }} 
      />
      <OrderNumberSearchModal isOpen={isOrderNoModalOpen} onClose={() => setIsOrderNoModalOpen(false)} onSelect={(no) => setOrderNo(no)} />
    </div>
  );
}