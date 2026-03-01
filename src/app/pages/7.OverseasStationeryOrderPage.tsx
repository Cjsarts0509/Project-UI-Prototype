import React, { useState, useRef } from 'react';
import { Calendar, Search, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';

// ★ 해외문구 전용 매입처 (하드코딩 데이터 확정)
const OVERSEAS_SUPPLIERS_DATA = [
  { code: '0900216', name: 'LEUCHTTURM' },
  { code: '0900224', name: 'LIHIT LAB.,INC' },
  { code: '0900252', name: 'HIGHTIDE CO.,LTD' }
];
const OVERSEAS_SUPPLIER_CODES = OVERSEAS_SUPPLIERS_DATA.map(s => s.code);

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

const SectionHeader = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="erp-section-toolbar">
    <span className="erp-section-title">{title}</span>
    <div className="flex gap-1">{children}</div>
  </div>
);

const actionBtnClass = "erp-btn-action";
const actionRedBtnClass = "erp-btn-danger";
const headerBtnClass = "erp-btn-header";

// 수불처별 판매량 모달 컴포넌트
const StoreSalesModal = ({ isOpen, onClose, data, productName }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-[350px] flex flex-col overflow-hidden text-[12px]">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-[#f9f9f9]">
          <div className="flex items-center gap-1">
             <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent"></div>
             <h2 className="font-bold text-[14px] text-gray-900">수불처별 판매량</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-lg">✕</button>
        </div>
        <div className="p-2 bg-blue-50 border-b border-blue-100">
           <p className="font-bold text-blue-800 truncate">{productName}</p>
        </div>
        <div className="flex-1 overflow-auto p-2 max-h-[300px]">
           <Table className="border border-gray-200">
             <TableHeader className="bg-[#f4f4f4] sticky top-0 shadow-[0_1px_0_0_#d1d5db]">
               <TableRow className="h-8">
                   <TableHead className="text-center py-1 font-bold text-gray-900 border-r border-gray-300">수불처명</TableHead>
                   <TableHead className="text-center py-1 font-bold text-gray-900">판매량(수량)</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {data.map((item: any, idx: number) => (
                 <TableRow key={idx} className="hover:bg-blue-50 h-7 border-b border-gray-200">
                   <TableCell className="text-center py-1 font-medium text-gray-600 border-r border-gray-300">{item.storeName}</TableCell>
                   <TableCell className="text-right py-1 text-gray-600 pr-3">{item.qty}</TableCell>
                 </TableRow>
               ))}
               {data.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-6 text-gray-500">데이터가 없습니다.</TableCell></TableRow>}
             </TableBody>
           </Table>
        </div>
      </div>
    </div>
  );
};

export default function OverseasStationeryOrderPage() {
  const { products } = useMockData();

  const [productType, setProductType] = useState('overseas'); 
  const [receiveLocation, setReceiveLocation] = useState('파주센터');
  const [salesDateStart, setSalesDateStart] = useState('');
  const [salesDateEnd, setSalesDateEnd] = useState('');
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState(''); 
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');

  const [data, setData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [discountRate, setDiscountRate] = useState('');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<any[]>([]);

  const [isStoreSalesModalOpen, setIsStoreSalesModalOpen] = useState(false);
  const [selectedStoreSales, setSelectedStoreSales] = useState<any[]>([]);
  const [selectedStoreProductName, setSelectedStoreProductName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearchReset = () => {
    setProductType('overseas'); setReceiveLocation('파주센터');
    setSalesDateStart(''); setSalesDateEnd('');
    setProductCode(''); setProductName(''); setSupplierCode(''); setSupplierName('');
    setData([]); setSelectedRows([]); setDiscountRate('');
  };

  const handleProductCodeSearch = () => {
    if (!productCode.trim()) { setIsProductModalOpen(true); return; }
    const numCode = productCode.replace(/[^0-9]/g, ''); setProductCode(numCode);
    const exactMatches = (products || []).filter(p => safeText(p.productCode) === numCode);
    if (exactMatches.length === 1) setProductName(safeText(exactMatches[0].productName));
    else setIsProductModalOpen(true);
  };

  const handleProductNameSearch = () => {
    if (!productName.trim()) { setIsProductModalOpen(true); return; }
    const exactMatches = (products || []).filter(p => safeText(p.productName).includes(productName.trim()));
    if (exactMatches.length === 1) { setProductCode(safeText(exactMatches[0].productCode)); setProductName(safeText(exactMatches[0].productName)); } 
    else { setIsProductModalOpen(true); }
  };

  // ★ 해외문구 매입처 하드코딩 배열에서만 인풋 검색 작동
  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = OVERSEAS_SUPPLIERS_DATA.filter(s => s.code === supplierCode.trim());
    if (exactMatches.length === 1) { setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = OVERSEAS_SUPPLIERS_DATA.filter(s => s.name.toLowerCase().includes(supplierName.trim().toLowerCase()));
    if (exactMatches.length === 1) { setSupplierCode(exactMatches[0].code); setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
  };

  const createDummyRow = (item: any, idx: number, qty: number = 0) => {
    const krwCost = Number(safeText(item.initialReleasePrice)) || 15000;
    const foreignCost = Number(safeText(item.fobPrice)) || 12.5; 
    
    const storeNames = ['광화문', '강남', '잠실', '영등포', '부산', '대구', '파주센터', '북시티'];
    const randomSales = storeNames.map(name => ({
        storeName: name,
        qty: Math.floor(Math.random() * 50)
    }));
    const totalRandomSales = randomSales.reduce((sum, cur) => sum + cur.qty, 0);

    return {
      id: `data-${Date.now()}-${idx}`,
      productName: safeText(item.productName) || '해외 다이어리',
      productCode: safeText(item.productCode) || `8800${idx}`,
      krwCost: krwCost,
      foreignCost: foreignCost,
      currency: safeText(item.foreignCurrencyPrice) ? 'USD' : 'KRW',
      price: Number(safeText(item.listPrice)) || 25000,
      orderQty: qty,
      totalKrwCost: qty * krwCost,
      totalForeignCost: qty * foreignCost,
      unit: 'EA',
      logisticsUnit: item.logisticsUnit || 'BOX',
      logisticsUnitQty: item.logisticsUnitQty || 24,
      stockPaju: Math.floor(Math.random() * 150),
      stockStore: totalRandomSales, 
      storeSalesDetails: randomSales,
      salesOff: Math.floor(Math.random() * 100),
      salesOn: Math.floor(Math.random() * 50),
      salesWholesale: Math.floor(Math.random() * 20)
    };
  };

  const handleSearch = () => {
    if (!supplierCode.trim() && !productCode.trim()) {
        alert("매입처 또는 상품코드를 입력해주세요.");
        return;
    }

    const filtered = (products || []).filter(item => {
       if (productCode && !safeText(item.productCode).includes(productCode.replace(/[^0-9]/g, ''))) return false;
       if (productName && !safeText(item.productName).includes(productName)) return false;
       
       const suppCode = safeText(item.supplierCode);
       // 해외문구 필터 무조건 적용
       if (!OVERSEAS_SUPPLIER_CODES.includes(suppCode)) return false;
       if (supplierCode && suppCode !== supplierCode) return false;

       const itemRelDate = parseExcelDate(item.releaseDate);
       if (itemRelDate) {
           if (salesDateStart && itemRelDate < salesDateStart) return false;
           if (salesDateEnd && itemRelDate > salesDateEnd) return false;
       } else {
           if (salesDateStart || salesDateEnd) return false;
       }

       return true;
    }).slice(0, 5); 

    const newData = filtered.map((item, idx) => createDummyRow(item, idx, 0));
    
    while (newData.length < 10) {
      newData.push({ id: `empty-${Date.now()}-${newData.length}`, productName: '', productCode: '', krwCost: '', foreignCost: '', currency: '', price: '', orderQty: '', totalKrwCost: '', totalForeignCost: '', unit: '', logisticsUnit: '', logisticsUnitQty: '', stockPaju: '', stockStore: '', storeSalesDetails: [], salesOff: '', salesOn: '', salesWholesale: '' });
    }
    setData(newData);
    setSelectedRows([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(data.filter(item => item.productCode !== '').map(item => item.id));
    else setSelectedRows([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) setSelectedRows(prev => [...prev, id]);
    else setSelectedRows(prev => prev.filter(rowId => rowId !== id));
  };

  const handleDeleteRow = () => {
      if (selectedRows.length === 0) return alert('삭제할 항목을 선택해주세요.');
      let remainingData = data.filter(item => !selectedRows.includes(item.id) || item.productCode === '');
      
      if (remainingData.length < 10) {
         const emptyPadding = Array.from({ length: 10 - remainingData.length }, (_, i) => ({
            id: `padding-${Date.now()}-${i}`, productName: '', productCode: '', krwCost: '', foreignCost: '', currency: '', price: '', orderQty: '', totalKrwCost: '', totalForeignCost: '', unit: '', logisticsUnit: '', logisticsUnitQty: '', stockPaju: '', stockStore: '', storeSalesDetails: [], salesOff: '', salesOn: '', salesWholesale: ''
         }));
         remainingData = [...remainingData, ...emptyPadding];
      }
      
      setData(remainingData);
      setSelectedRows([]);
  };

  const handleUpdateField = (id: string, field: 'orderQty' | 'foreignCost', val: string) => {
    const rawVal = val.replace(/[^0-9.]/g, '');
    const numVal = Number(rawVal) || 0;
    
    setData(prev => prev.map(item => {
        if (item.id === id) {
            const updatedItem = { ...item, [field]: rawVal };
            const currentQty = field === 'orderQty' ? numVal : (Number(item.orderQty) || 0);
            const currentForeignCost = field === 'foreignCost' ? numVal : (Number(item.foreignCost) || 0);
            const currentKrwCost = Number(item.krwCost) || 0;

            updatedItem.totalKrwCost = currentQty * currentKrwCost;
            updatedItem.totalForeignCost = currentQty * currentForeignCost;
            return updatedItem;
        }
        return item;
    }));
  };

  const handleApplyDiscount = () => {
    const rate = Number(discountRate);
    if (!rate || rate <= 0 || rate > 100) return alert("올바른 할인율을 입력해주세요.");
    if (selectedRows.length === 0) return alert("할인을 적용할 항목을 체크해주세요.");

    setData(prev => prev.map(item => {
        if (selectedRows.includes(item.id) && item.productCode) {
            const qty = Number(item.orderQty) || 0;
            const fCost = Number(item.foreignCost) || 0;
            const originalTotal = qty * fCost;
            const discountedTotal = originalTotal * (1 - rate / 100);
            return { ...item, totalForeignCost: discountedTotal };
        }
        return item;
    }));
  };

  const handleRestoreForeignCost = () => {
    if (selectedRows.length === 0) return alert("복원할 항목을 체크해주세요.");
    setData(prev => prev.map(item => {
        if (selectedRows.includes(item.id) && item.productCode) {
            const qty = Number(item.orderQty) || 0;
            const fCost = Number(item.foreignCost) || 0;
            return { ...item, totalForeignCost: qty * fCost };
        }
        return item;
    }));
  };

  const applyUploadData = (newItems: any[], clearExisting: boolean) => {
    let baseData = clearExisting ? [] : data.filter(d => d.productCode !== '');
    let displayData = [...baseData, ...newItems];
    
    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        id: `padding-${Date.now()}-${i}`, productName: '', productCode: '', krwCost: '', foreignCost: '', currency: '', price: '', orderQty: '', totalKrwCost: '', totalForeignCost: '', unit: '', logisticsUnit: '', logisticsUnitQty: '', stockPaju: '', stockStore: '', storeSalesDetails: [], salesOff: '', salesOn: '', salesWholesale: ''
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    setData(displayData);
    setSelectedRows([]);
    setPendingUploadData([]);
    setUploadModalOpen(false);
    alert(`${newItems.length}건의 품 정보가 화면에 적용되었습니다.`);
  };

  const handleFileUploadClick = () => fileInputRef.current?.click();
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const uploadedItems = [];
      for (let i = 1; i < Math.min(rows.length, 1000); i++) {
        const row = rows[i] as any[];
        if (!row[0]) continue;

        const pCode = String(row[0]).trim();
        const qty = Number(row[1]) || 0;

        const foundProduct = (products || []).find(p => safeText(p.productCode) === pCode);
        if (foundProduct) {
          uploadedItems.push(createDummyRow(foundProduct, i, qty));
        }
      }

      const existingCodes = data.filter(d => d.productCode !== '').map(d => d.productCode);
      const hasDuplicates = uploadedItems.some(item => existingCodes.includes(item.productCode));

      if (existingCodes.length > 0 && hasDuplicates) {
         setPendingUploadData(uploadedItems);
         setUploadModalOpen(true);
      } else {
         applyUploadData(uploadedItems, false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleUploadOverwrite = () => applyUploadData(pendingUploadData, true);
  const handleUploadExcludeDuplicates = () => {
     const existingCodes = data.filter(d => d.productCode !== '').map(d => d.productCode);
     const filteredItems = pendingUploadData.filter(item => !existingCodes.includes(item.productCode));
     applyUploadData(filteredItems, false);
  };

  const handleExcelDownload = () => {
    const validData = data.filter(item => item.productCode !== '');
    if (validData.length === 0) return alert('다운로드할 데이터가 없습니다.');

    const excelExportData = validData.map(item => ({
      '상품명': item.productName,
      '상품코드': item.productCode,
      '원화원가': item.krwCost,
      '외화원가': item.foreignCost,
      '화폐단위': item.currency,
      '정가': item.price,
      '발주수량': item.orderQty,
      '총발주원화원가': item.totalKrwCost,
      '총발주외화원가': item.totalForeignCost,
      '단위': item.unit,
      '물류사용단위': item.logisticsUnit,
      '물류사용단위수량': item.logisticsUnitQty,
      '재고수량(파주센터)': item.stockPaju,
      '재고수량(점포합산)': item.stockStore,
      '판매정보(OFF)': item.salesOff,
      '판매정보(ON)': item.salesOn,
      '판매정보(도매)': item.salesWholesale
    }));

    const ws = XLSX.utils.json_to_sheet(excelExportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "해외문구발주내역");
    XLSX.writeFile(wb, "해외문구_추가발주의뢰.xlsx");
  };

  const actualDataCount = data.filter(item => item.productCode !== '').length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">해외문구 추가발주의뢰</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 gap-4 border-r border-gray-200">
                <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-900">
                  <input type="radio" name="productType" value="overseas" checked={productType === 'overseas'} onChange={() => setProductType('overseas')} /> 해외문구
                </label>
             </div>
             <Label className="border-r border-gray-200">입하처</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={receiveLocation} onValueChange={setReceiveLocation}>
                    <SelectTrigger className="h-6 w-[150px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="파주센터">파주센터</SelectItem></SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             <Label className="border-r border-gray-200" required>판매일자</Label>
             <div className="flex items-center p-1 gap-1">
                 <DateRangeInput startVal={salesDateStart} endVal={salesDateEnd} onStartChange={setSalesDateStart} onEndChange={setSalesDateEnd} />
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr]">
             <Label className="border-r border-gray-200" required>매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 col-span-3">
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

      <div className="erp-section-group flex-1 min-h-0 flex flex-col">
      <SectionHeader title="발주내역">
         <div className="flex items-center gap-1 mr-4">
             <span className="font-bold text-gray-700">전체할인율</span>
             <div className="flex items-center border border-gray-400 bg-white h-6 w-16">
                 <Input className="h-full w-full border-none text-right px-1 text-[11px] font-bold" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} />
                 <span className="pr-1 text-gray-600">%</span>
             </div>
             <Button variant="outline" className={cn(actionBtnClass, "bg-[#444444] hover:bg-[#333]")} onClick={handleApplyDiscount}>총할인적용</Button>
             <Button variant="outline" className={cn(actionBtnClass, "bg-[#444444] hover:bg-[#333]")} onClick={handleRestoreForeignCost}>외화원가복원</Button>
         </div>
         <Button variant="outline" className={actionRedBtnClass} onClick={handleDeleteRow}>선택삭제</Button>
         <Button variant="outline" className={actionBtnClass} onClick={() => alert('저장')}>저장</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운(F1)</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>엑셀업로드(F2)</Button>
      </SectionHeader>

      <div className="flex-1 border border-gray-300 bg-white flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[2000px] border-collapse">
                <TableHeader className="bg-[#f4f4f4] sticky top-0 shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead rowSpan={2} className="w-[40px] text-center border-r border-b border-gray-300 p-0">
                            <Checkbox checked={selectedRows.length === actualDataCount && actualDataCount > 0} onCheckedChange={(c) => handleSelectAll(!!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px] bg-white"/>
                        </TableHead>
                        <TableHead rowSpan={2} className="w-[180px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품명</TableHead>
                        <TableHead rowSpan={2} className="w-[110px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품코드</TableHead>
                        <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">원화원가</TableHead>
                        <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-yellow-400">외화원가</TableHead>
                        <TableHead rowSpan={2} className="w-[70px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">화폐단위</TableHead>
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">정가</TableHead>
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-yellow-400">발주수량</TableHead>
                        <TableHead rowSpan={2} className="w-[110px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">총발주<br/>원화원가</TableHead>
                        <TableHead rowSpan={2} className="w-[110px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">총발주<br/>외화원가</TableHead>
                        <TableHead rowSpan={2} className="w-[60px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">단위</TableHead>
                        <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">물류사용단위</TableHead>
                        <TableHead rowSpan={2} className="w-[110px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">물류사용단위<br/>수량</TableHead>
                        
                        <TableHead colSpan={2} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">재고수량</TableHead>
                        <TableHead colSpan={3} className="text-center font-bold text-gray-900 border-b border-gray-300 p-1">판매정보</TableHead>
                    </TableRow>
                    <TableRow className="bg-[#f4f4f4] h-8 shadow-[0_1px_0_0_#d1d5db]">
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">파주센터</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">점포합산</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">OFF</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">ON</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 p-1">도매</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id} className="h-8 border-b border-gray-200 hover:bg-blue-50/50 bg-white">
                            <TableCell className="text-center p-0 border-r border-gray-200">
                                {row.productCode && <Checkbox checked={selectedRows.includes(row.id)} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px]" />}
                            </TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate" title={row.productName}>{row.productName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.productCode}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.krwCost ? Number(row.krwCost).toLocaleString() : ''}</TableCell>
                            
                            <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                {row.productCode && (
                                    <Input 
                                        className="h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-2 bg-transparent text-[11px] font-bold text-blue-700" 
                                        value={row.foreignCost} 
                                        onChange={(e) => handleUpdateField(row.id, 'foreignCost', e.target.value)} 
                                    />
                                )}
                            </TableCell>

                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.currency}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.price ? Number(row.price).toLocaleString() : ''}</TableCell>
                            
                            <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                {row.productCode && (
                                    <Input 
                                        className="h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-2 bg-transparent text-[11px] font-bold text-red-600" 
                                        value={row.orderQty} 
                                        onChange={(e) => handleUpdateField(row.id, 'orderQty', e.target.value)} 
                                    />
                                )}
                            </TableCell>

                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 pr-2 font-bold bg-gray-50">{row.totalKrwCost ? Number(row.totalKrwCost).toLocaleString() : ''}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-blue-700 pr-2 font-bold bg-gray-50">{row.totalForeignCost ? Number(row.totalForeignCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}</TableCell>
                            
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.unit}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.logisticsUnit}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.logisticsUnitQty}</TableCell>
                            
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.stockPaju}</TableCell>
                            
                            <TableCell className="text-right p-1 border-r border-gray-200 text-blue-600 underline cursor-pointer pr-2 font-bold" onClick={() => {
                                if (row.productCode) {
                                    setSelectedStoreSales(row.storeSalesDetails || []);
                                    setSelectedStoreProductName(row.productName);
                                    setIsStoreSalesModalOpen(true);
                                }
                            }}>{row.stockStore}</TableCell>
                            
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.salesOff}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.salesOn}</TableCell>
                            <TableCell className="text-right p-1 text-gray-600 pr-2">{row.salesWholesale}</TableCell>
                        </TableRow>
                    ))}
                    {data.filter(r => r.productCode).length === 0 && Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
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

      {uploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full flex flex-col items-center">
             <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
             <h3 className="text-[15px] font-bold text-gray-900 mb-2">중복 상품코드 발생</h3>
             <p className="text-[12px] text-gray-600 text-center mb-6 leading-relaxed">
               동일 상품코드가 존재합니다.<br/>내역을 초기화하고 업로드를 진행하시겠습니까?
             </p>
             <div className="flex flex-col gap-2 w-full">
               <Button className="w-full erp-btn-action h-8" onClick={handleUploadOverwrite}>초기화 후 업로드</Button>
               <Button className="w-full erp-btn-header h-8" onClick={handleUploadExcludeDuplicates}>중복코드 제외하고 업로드</Button>
               <Button variant="outline" className="w-full text-[12px] h-8 mt-2 font-bold" onClick={() => { setUploadModalOpen(false); setPendingUploadData([]); }}>취소</Button>
             </div>
          </div>
        </div>
      )}

      {/* ★ 수불처별 판매량 모달 */}
      <StoreSalesModal 
        isOpen={isStoreSalesModalOpen} 
        onClose={() => setIsStoreSalesModalOpen(false)} 
        data={selectedStoreSales} 
        productName={selectedStoreProductName}
      />

      {/* ★ 해외문구 매입처만 팝업에서 조회 및 선택되도록 커스텀 데이터 주입 */}
      <SupplierSearchModal 
        isOpen={isSupplierModalOpen} 
        onClose={() => setIsSupplierModalOpen(false)} 
        initialSearchName={supplierName} 
        customData={OVERSEAS_SUPPLIERS_DATA}
        onSelect={(item) => { 
            setSupplierCode(item.code); 
            setSupplierName(item.name); 
        }} 
      />
      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName} onSelect={(item) => { setProductCode(item.productCode); setProductName(item.productName); }} />
    </div>
  );
}