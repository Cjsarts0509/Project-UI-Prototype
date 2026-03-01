import React, { useState } from 'react';
import { Calendar, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';
import { format, subMonths } from 'date-fns';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { OrderNumberSearchModal } from '../components/OrderNumberSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal'; 

const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];
const STATIONERY_SUPPLIERS = ['0800448', '0803124', '0800586', '0800618', '0800666', '0803833', '0811137', '0815165', '0817037'];
const OVERSEAS_SUPPLIERS = ['0900216', '0900224', '0900252'];

const safeText = (val: any) => val && val !== '#' ? val : '';

const parseExcelDate = (val: any) => {
  if (!val || val === '#') return '';
  if (typeof val === 'number') {
      const date = new Date((val - 25569) * 86400 * 1000);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
  }
  
  let strVal = String(val).trim();
  
  if (/^\d{5}$/.test(strVal)) {
      const numVal = parseInt(strVal, 10);
      if (numVal > 25569) {
          const date = new Date((numVal - 25569) * 86400 * 1000);
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
      }
  }

  if (strVal.includes(' ')) {
      strVal = strVal.split(' ')[0];
  }

  if (strVal.includes('-') || strVal.includes('.') || strVal.includes('/')) {
     const parts = strVal.split(/[-./]/);
     if (parts.length >= 3) {
         let y = parts[0];
         if (y.length === 2) y = '20' + y;
         const m = parts[1].padStart(2, '0');
         const d = parts[2].substring(0, 2).padStart(2, '0');
         return `${y}-${m}-${d}`;
     }
  }
  
  let raw = strVal.replace(/[^0-9]/g, '');
  if (raw.length >= 8) {
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  } else if (raw.length === 6) { 
      return `20${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4, 6)}`;
  }
  return strVal;
};

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

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

const headerBtnClass = "erp-btn-header";
const actionBtnClass = "erp-btn-action";

export default function OrderRequestInquiryPage() {
  const { products, suppliers } = useMockData();

  const [productType, setProductType] = useState('stationery');
  const [reqStatus, setReqStatus] = useState('all');
  const [reqDateStart, setReqDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [reqDateEnd, setReqDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reqNo, setReqNo] = useState('');
  
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  
  const [supplierItemCode, setSupplierItemCode] = useState('');
  const [supplierItemName, setSupplierItemName] = useState('');

  const [category, setCategory] = useState('all'); 
  const [reqLocation, setReqLocation] = useState('all');
  const [reqType, setReqType] = useState('all');
  const [centerOrderYn, setCenterOrderYn] = useState('all');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isOrderNoModalOpen, setIsOrderNoModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);

  const [masterData, setMasterData] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [activeMasterRowId, setActiveMasterRowId] = useState<string | null>(null);

  const handleProductCodeSearch = () => {
    if (!productCode.trim()) { setIsProductModalOpen(true); return; }
    const numCode = productCode.replace(/[^0-9]/g, ''); setProductCode(numCode);
    const exactMatches = (products || []).filter(p => p.productCode === numCode);
    if (exactMatches.length === 1) setProductName(exactMatches[0].productName);
    else setIsProductModalOpen(true);
  };

  const handleProductNameSearch = () => {
    if (!productName.trim()) { setIsProductModalOpen(true); return; }
    const exactMatches = (products || []).filter(p => p.productName.includes(productName.trim()));
    if (exactMatches.length === 1) { setProductCode(exactMatches[0].productCode); setProductName(exactMatches[0].productName); } 
    else { setIsProductModalOpen(true); }
  };

  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const allowed = getActiveAllowedSuppliers();
    const exactMatches = (suppliers || []).filter(s => (!allowed || allowed.includes(s.code)) && s.code === supplierCode.trim());
    if (exactMatches.length === 1) { setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const allowed = getActiveAllowedSuppliers();
    const exactMatches = (suppliers || []).filter(s => (!allowed || allowed.includes(s.code)) && s.name.includes(supplierName.trim()));
    if (exactMatches.length === 1) { setSupplierCode(exactMatches[0].code); setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierItemSearch = () => {
    if (!supplierCode.trim()) {
        alert("매입처를 먼저 입력/조회하여 지정해주세요.");
        return;
    }
    setIsSupplierItemModalOpen(true);
  };

  const handleSearchReset = () => {
    setProductType('stationery'); setReqStatus('all'); 
    setReqDateStart(format(subMonths(new Date(), 1), 'yyyy-MM-dd')); setReqDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setReqNo(''); setProductCode(''); setProductName(''); setSupplierCode(''); setSupplierName('');
    setSupplierItemCode(''); setSupplierItemName('');
    setCategory('all'); setReqLocation('all'); setReqType('all'); setCenterOrderYn('all');
    setMasterData([]); setDetailData([]); setActiveMasterRowId(null);
  };

  const handleSearch = () => {
    let baseProducts = (products || []).filter(p => {
        const sCode = safeText(p.supplierCode);
        if (productType === 'album' && !ALBUM_SUPPLIERS.includes(sCode)) return false;
        if (productType === 'stationery' && !STATIONERY_SUPPLIERS.includes(sCode)) return false;
        if (productType === 'overseas' && !OVERSEAS_SUPPLIERS.includes(sCode)) return false;
        return true;
    });

    baseProducts = baseProducts.filter(item => {
        if (category !== 'all') {
             if (safeText(item.groupCategory) !== category && safeText(item.productCategory) !== category) return false;
        }
        if (productCode && !safeText(item.productCode).includes(productCode.replace(/[^0-9]/g, ''))) return false;
        if (productName && !safeText(item.productName).includes(productName)) return false;
        if (supplierCode && safeText(item.supplierCode) !== supplierCode) return false;
        if (centerOrderYn !== 'all' && safeText(item.centerOrderYn) !== centerOrderYn) return false;

        const regDate = parseExcelDate(item.registrationDate);
        if (regDate) {
            if (reqDateStart && regDate < reqDateStart) return false;
            if (reqDateEnd && regDate > reqDateEnd) return false;
        } else {
            if (reqDateStart || reqDateEnd) return false;
        }

        return true;
    }).slice(0, 15);

    const statuses = ['발주', '집책+발주', '발주미처리', '집책', '발주'];
    
    const newMasterData = baseProducts.map((p, idx) => {
        const rDate = parseExcelDate(p.registrationDate) || format(new Date(), 'yyyy-MM-dd');
        const reqStat = reqStatus !== 'all' ? reqStatus : statuses[idx % statuses.length];
        const ordQty = Math.floor(Math.random() * 50) + 1;
        
        return {
            id: `m${idx}-${Date.now()}`,
            no: idx + 1,
            reqDate: rDate,
            group: safeText(p.groupCategory) || safeText(p.productCategory),
            pCode: safeText(p.productCode),
            pName: safeText(p.productName),
            artist: safeText(p.artistName),
            status: safeText(p.productStatus),
            sCode: safeText(p.supplierCode),
            sName: safeText(p.supplierName),
            sItem: '',
            centerYn: safeText(p.centerOrderYn) || 'Y',
            reqStatus: reqStat,
            reqStore: `${ordQty}EA`,
            reqOnline: `${Math.floor(ordQty / 3)}EA`,
            reqB2b: '0EA',
            reqPurchase: '0EA',
            collectQty: reqStat.includes('집책') ? `${Math.floor(ordQty / 2)}EA` : '',
            orderQty: `${ordQty}EA`,
            unprocQty: reqStat === '발주미처리' ? `${ordQty}EA` : '',
            unprocReason: reqStat === '발주미처리' ? '매입처상태코드확인(004: 매입처상태비정상)' : ''
        };
    });

    setMasterData(newMasterData);
    if (newMasterData.length > 0) {
       setActiveMasterRowId(newMasterData[0].id);
       loadDetailData(newMasterData[0]);
    } else {
       setActiveMasterRowId(null);
       setDetailData([]);
    }
  };

  const loadDetailData = (masterRow: any) => {
      if (!masterRow) {
          setDetailData([]);
          return;
      }

      const locations = ['파주센터', '광화문', '강남', '북시티', '잠실', '대구'];
      const reqTypes = ['자동', '고객', 'B2B'];
      const detailCount = Math.floor(Math.random() * 3) + 1; 
      
      let remainingQty = parseInt(masterRow.orderQty.replace(/[^0-9]/g, '')) || 10;
      
      const details = Array.from({ length: detailCount }).map((_, i) => {
          const isCollect = masterRow.reqStatus.includes('집책');
          const isLast = i === detailCount - 1;
          
          let currentQty = isLast ? remainingQty : Math.floor(Math.random() * (remainingQty - 1)) + 1;
          if (currentQty < 1) currentQty = 1;
          remainingQty -= currentQty;

          let loc = reqLocation !== 'all' ? reqLocation : locations[Math.floor(Math.random() * locations.length)];
          let rType = reqType !== 'all' ? reqType : reqTypes[Math.floor(Math.random() * reqTypes.length)];

          return {
              id: `d${masterRow.id}-${i}`,
              pCode: masterRow.pCode,
              pName: masterRow.pName,
              reqLoc: loc,
              reqType: rType,
              reqStatus: masterRow.reqStatus,
              reqDate: masterRow.reqDate.replace(/-/g, ''),
              reqQty: `${currentQty}EA`,
              collectTime: isCollect ? format(new Date(), 'yyyy-MM-dd HH:mm') : '',
              bg_dir: isCollect ? `${Math.floor(currentQty/2)}EA` : '0', 
              bg_col: isCollect ? `${Math.ceil(currentQty/2)}EA` : '0', 
              bs_dir: '0', 
              bs_col: '0',
              ordDate: masterRow.reqDate.replace(/-/g, ''),
              ordCount: '1',
              ordQty: `${currentQty}EA`,
              ordSupplier: masterRow.sName,
              purType: '일시',
              cost: '800'
          };
      });

      setDetailData(details);
  };

  const handleMasterRowClick = (row: any) => {
    setActiveMasterRowId(row.id);
    loadDetailData(row);
  };

  const handleExcelDownload = () => {
    if (masterData.length === 0) return alert('다운로드할 데이터가 없습니다.');
    
    const exportData = masterData.map(item => {
      const baseObj: any = {
        'no': item.no,
        '발주의뢰일': item.reqDate,
        '조': item.group,
        '상품코드': item.pCode,
        '상품명': item.pName,
      };

      if (productType === 'album') baseObj['가수명'] = item.artist;

      return {
        ...baseObj,
        '상품상태': item.status,
        '매입처': item.sCode,
        '매입처명': item.sName,
        '매입처품목': item.sItem,
        '센터발주여부': item.centerYn,
        '의뢰상태': item.reqStatus,
        '의뢰수량(점포)': item.reqStore,
        '의뢰수량(온라인)': item.reqOnline,
        '의뢰수량(B2B)': item.reqB2b,
        '의뢰수량(구매)': item.reqPurchase,
        '집책수량': item.collectQty,
        '발주수량': item.orderQty,
        '발주미처리수량': item.unprocQty,
        '발주미처리사유': item.unprocReason
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "발주의뢰조회");
    XLSX.writeFile(wb, "발주의뢰조회내역.xlsx");
  };

  const getActiveAllowedSuppliers = () => {
    if (productType === 'album') return ALBUM_SUPPLIERS;
    if (productType === 'stationery') return STATIONERY_SUPPLIERS;
    if (productType === 'overseas') return OVERSEAS_SUPPLIERS;
    return undefined;
  };

  const calcTotal = (field: string) => {
      return masterData.reduce((acc, row) => {
          const val = parseInt(String(row[field]).replace(/[^0-9]/g, '')) || 0;
          return acc + val;
      }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">발주의뢰 조회</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 gap-4 border-r border-gray-200">
                <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-900">
                  <input type="radio" name="productType" value="stationery" checked={productType === 'stationery'} onChange={() => { setProductType('stationery'); setSupplierCode(''); setSupplierName(''); setCategory('all'); }} /> 문구
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-900">
                  <input type="radio" name="productType" value="album" checked={productType === 'album'} onChange={() => { setProductType('album'); setSupplierCode(''); setSupplierName(''); setCategory('all'); }} /> 음반
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-900">
                  <input type="radio" name="productType" value="overseas" checked={productType === 'overseas'} onChange={() => { setProductType('overseas'); setSupplierCode(''); setSupplierName(''); setCategory('all'); }} /> 해외문구
                </label>
             </div>
             
             <Label className="border-r border-gray-200">의뢰상태</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={reqStatus} onValueChange={setReqStatus}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="발주">발주</SelectItem><SelectItem value="집책">집책</SelectItem><SelectItem value="발주미처리">발주미처리</SelectItem></SelectContent>
                 </Select>
             </div>
             
             <Label className="border-r border-gray-200">발주의뢰일</Label>
             <div className="flex items-center p-1 gap-1">
                 <DateRangeInput startVal={reqDateStart} endVal={reqDateEnd} onStartChange={setReqDateStart} onEndChange={setReqDateEnd} />
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">발주번호</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" value={reqNo} onChange={(e) => setReqNo(e.target.value)} />
                 <Search className="absolute right-2.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsOrderNoModalOpen(true)} />
             </div>
             
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr]">
             <Label className="border-r border-gray-200">조코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {productType === 'album' && <><SelectItem value="가요">가요</SelectItem><SelectItem value="POP">POP</SelectItem><SelectItem value="클래식">클래식</SelectItem></>}
                        {productType === 'stationery' && <><SelectItem value="학용품">학용품</SelectItem><SelectItem value="사무용품">사무용품</SelectItem><SelectItem value="디지털">디지털</SelectItem></>}
                        {productType === 'overseas' && <><SelectItem value="학용품">학용품</SelectItem><SelectItem value="사무용품">사무용품</SelectItem></>}
                    </SelectContent>
                 </Select>
             </div>
             
             <Label className="border-r border-gray-200">의뢰처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={reqLocation} onValueChange={setReqLocation}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="파주센터">파주센터</SelectItem><SelectItem value="광화문">광화문</SelectItem><SelectItem value="북시티">북시티</SelectItem></SelectContent>
                 </Select>
             </div>

             <Label className="border-r border-gray-200">기타조건</Label>
             <div className="flex items-center p-1 gap-2">
                 <Select value={reqType} onValueChange={setReqType}>
                    <SelectTrigger className="h-6 w-[100px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="의뢰구분" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="자동">자동</SelectItem><SelectItem value="고객">고객</SelectItem></SelectContent>
                 </Select>
                 <Select value={centerOrderYn} onValueChange={setCenterOrderYn}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="센터발주여부" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
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
          <div className="erp-section-group flex-1 min-h-0 flex flex-col" style={{flex: '1 1 50%'}}>
             <div className="erp-section-toolbar">
                <span className="erp-section-title">발주의뢰 목록</span>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={() => alert('삭제')}>삭제</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운로드</Button>
                 </div>
             </div>
             <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1 overflow-auto">
                <Table className="table-fixed min-w-[2300px] border-collapse text-[11px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="bg-[#f4f4f4]">
                            <TableHead rowSpan={2} className="w-[40px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">No</TableHead>
                            <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">발주의뢰일</TableHead>
                            <TableHead rowSpan={2} className="w-[70px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">조코드</TableHead>
                            <TableHead rowSpan={2} className="w-[120px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품코드</TableHead>
                            <TableHead rowSpan={2} className="w-[180px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품명</TableHead>
                            {productType === 'album' && (
                                <TableHead rowSpan={2} className="w-[120px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">가수명</TableHead>
                            )}
                            <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품<br/>상태</TableHead>
                            <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처</TableHead>
                            <TableHead rowSpan={2} className="w-[140px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처명</TableHead>
                            <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처품목</TableHead>
                            <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">센터발주<br/>여부</TableHead>
                            <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">의뢰상태</TableHead>
                            
                            {/* ★ 의뢰수량 하위 항목 4개의 너비를 합산하여 상위 넓이를 지정 */}
                            <TableHead colSpan={4} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 w-[800px]">의뢰수량</TableHead>
                            
                            <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">집책수량</TableHead>
                            <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">발주수량</TableHead>
                            <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">발주미처리<br/>수량</TableHead>
                            <TableHead rowSpan={2} className="w-[200px] text-center font-bold text-gray-900 border-b border-gray-300 p-1">발주미처리사유</TableHead>
                        </TableRow>
                        <TableRow className="bg-[#f4f4f4] h-8 shadow-[0_1px_0_0_#d1d5db]">
                            {/* ★ 하위 칼럼 4개의 넓이를 기존 90px에서 200px로 2.5배 가량 넓힘 */}
                            <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">점포</TableHead>
                            <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">온라인</TableHead>
                            <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">B2B</TableHead>
                            <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">구매</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {masterData.map((row) => {
                            const isSelected = activeMasterRowId === row.id;
                            return (
                              <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleMasterRowClick(row)}>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.no}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.reqDate}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.group}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.pCode}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate font-bold">{row.pName}</TableCell>
                                  {productType === 'album' && (
                                      <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate">{row.artist}</TableCell>
                                  )}
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.status}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sCode}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate">{row.sName}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sItem}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-gray-800">{row.centerYn}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.reqStatus}</TableCell>
                                  
                                  <TableCell className="text-right p-1 border-r border-gray-200 pr-2">{row.reqStore}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 pr-2">{row.reqOnline}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 pr-2">{row.reqB2b}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 pr-2">{row.reqPurchase}</TableCell>
                                  
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.collectQty}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-blue-600 pr-2 bg-blue-50">{row.orderQty}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-red-600 pr-2">{row.unprocQty}</TableCell>
                                  <TableCell className="text-left p-1 text-gray-500 truncate" title={row.unprocReason}>{row.unprocReason}</TableCell>
                              </TableRow>
                            );
                        })}
                        {masterData.length > 0 && (
                            <TableRow className="h-8 bg-gray-100 font-bold border-b border-gray-300">
                                <TableCell colSpan={productType === 'album' ? 12 : 11} className="text-center border-r border-gray-300">합계</TableCell>
                                <TableCell className="text-right pr-2 border-r border-gray-300">{calcTotal('reqStore')}</TableCell>
                                <TableCell className="text-right pr-2 border-r border-gray-300">{calcTotal('reqOnline')}</TableCell>
                                <TableCell className="text-right pr-2 border-r border-gray-300">{calcTotal('reqB2b')}</TableCell>
                                <TableCell className="text-right pr-2 border-r border-gray-300">{calcTotal('reqPurchase')}</TableCell>
                                <TableCell className="text-right pr-2 border-r border-gray-300">{calcTotal('collectQty')}</TableCell>
                                <TableCell className="text-right pr-2 border-r border-gray-300 text-blue-600">{calcTotal('orderQty')}</TableCell>
                                <TableCell className="text-right pr-2 border-r border-gray-300 text-red-600">{calcTotal('unprocQty')}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        )}
                        {masterData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={`empty-m-${i}`} className="h-8 border-b border-gray-200 bg-white">
                              {Array.from({ length: 20 }).map((_, j) => (
                                <TableCell key={j} className={j < 19 ? "border-r border-gray-200" : ""}></TableCell>
                              ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </div>

          <div className="erp-section-group flex-1 min-h-0 flex flex-col" style={{flex: '1 1 50%'}}>
             <div className="erp-section-toolbar">
                <span className="erp-section-title">상세내역</span>
             </div>
             <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1 overflow-auto">
                <Table className="table-fixed min-w-[2000px] border-collapse text-[11px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="bg-[#f4f4f4]">
                            <TableHead rowSpan={2} className="w-[120px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품코드</TableHead>
                            <TableHead rowSpan={2} className="w-[180px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품명</TableHead>
                            <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">의뢰처</TableHead>
                            <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">의뢰구분</TableHead>
                            <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">의뢰상태</TableHead>
                            <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">의뢰일</TableHead>
                            <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">의뢰수량</TableHead>
                            <TableHead rowSpan={2} className="w-[140px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">집책정보지시일시</TableHead>
                            
                            <TableHead colSpan={2} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">부곡리</TableHead>
                            <TableHead colSpan={2} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">북시티</TableHead>
                            <TableHead colSpan={6} className="text-center font-bold text-gray-900 border-b border-gray-300 p-1 bg-yellow-50">발주정보</TableHead>
                        </TableRow>
                        <TableRow className="bg-[#f4f4f4] h-8 shadow-[0_1px_0_0_#d1d5db]">
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">지시수량</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">집책수량</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">지시수량</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">집책수량</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">발주일</TableHead>
                            <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">횟수</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">발주수량</TableHead>
                            <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">발주매입처</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">매입구분</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 p-1 bg-yellow-50">원가</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {detailData.map((row) => (
                            <TableRow key={row.id} className="h-8 border-b border-gray-200 hover:bg-blue-50/50 bg-white">
                                <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.pCode}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate font-bold">{row.pName}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.reqLoc}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.reqType}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.reqStatus}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.reqDate}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.reqQty}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.collectTime}</TableCell>
                                
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.bg_dir}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.bg_col}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.bs_dir}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.bs_col}</TableCell>

                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 bg-yellow-50/20">{row.ordDate}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 bg-yellow-50/20">{row.ordCount}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-blue-600 pr-2 bg-yellow-50/20">{row.ordQty}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate bg-yellow-50/20">{row.ordSupplier}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 bg-yellow-50/20">{row.purType}</TableCell>
                                <TableCell className="text-right p-1 text-gray-600 pr-2 bg-yellow-50/20">{row.cost ? Number(row.cost).toLocaleString() : ''}</TableCell>
                            </TableRow>
                        ))}
                        {detailData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={`empty-d-${i}`} className="h-8 border-b border-gray-200 bg-white">
                              {Array.from({ length: 18 }).map((_, j) => (
                                <TableCell key={j} className={j < 17 ? "border-r border-gray-200" : ""}></TableCell>
                              ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </div>
      </div>

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName || productCode} onSelect={(item) => { setProductCode(item.productCode); setProductName(item.productName); }} />
      <SupplierSearchModal 
          isOpen={isSupplierModalOpen} 
          onClose={() => setIsSupplierModalOpen(false)} 
          initialSearchName={supplierName || supplierCode} 
          allowedCodes={getActiveAllowedSuppliers()}
          onSelect={(item) => { setSupplierCode(item.code); setSupplierName(item.name); }} 
      />
      <SupplierItemSearchModal isOpen={isSupplierItemModalOpen} onClose={() => setIsSupplierItemModalOpen(false)} supplierCode={supplierCode} initialSearchName={supplierItemName || supplierItemCode} onSelect={(item) => { setSupplierItemCode(item.code); setSupplierItemName(item.name); }} />
      <OrderNumberSearchModal isOpen={isOrderNoModalOpen} onClose={() => setIsOrderNoModalOpen(false)} onSelect={(no) => setReqNo(no)} />
    </div>
  );
}