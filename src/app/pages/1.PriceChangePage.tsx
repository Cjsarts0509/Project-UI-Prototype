import React, { useState, useRef } from 'react';
import { Search, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { format, addDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';

const ALLOWED_CATEGORY_CODES = ['M1', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'T1', 'T2', 'T3', 'U1'];
// ★ 공통: 허용된 상품상태 명칭만 필터링
const ALLOWED_STATUS_NAMES = ['정상', '절판', '품절', '판매금지', '일시품절', '예약판매'];

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const formatNumber = (val: any) => {
  if (!val) return '';
  const num = String(val).replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString() : '';
};

const parseExcelDate = (val: any) => {
  if (!val || val === '#') return '';
  if (typeof val === 'string' && val.includes('-')) return val.split(' ')[0];
  let raw = String(val).replace(/[^0-9]/g, '');
  if (raw.length === 8) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  const numVal = Number(val);
  if (!isNaN(numVal) && numVal > 25569 && numVal < 99999) {
      const date = new Date((numVal - 25569) * 86400 * 1000);
      return format(date, 'yyyy-MM-dd');
  }
  return String(val);
};

const safeText = (val: any) => val && val !== '#' ? val : '';

const createEmptyRows = () => Array.from({ length: 10 }, (_, index) => ({
  id: `empty-${index + 1}`, productCode: '', productName: '', supplierCode: '', supplierName: '',
  supplierItemCode: '', categoryCode: '', categoryName: '', status: '', originalPrice: '', currentPrice: '', 
  newPrice: '', effectiveDate: '', lastModified: '', modifier: ''
}));

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

export default function PriceChangePage() {
  const { products, statuses, categories, suppliers, supplierItems = [] } = useMockData();

  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState(''); 
  const [supplierItemCode, setSupplierItemCode] = useState(''); 
  const [supplierItemName, setSupplierItemName] = useState(''); 
  const [status, setStatus] = useState('all');
  const [categoryCode, setCategoryCode] = useState('all');

  const [batchPrice, setBatchPrice] = useState('');
  const [batchDate, setBatchDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [isBatchPriceChecked, setIsBatchPriceChecked] = useState(false);
  const [isBatchDateChecked, setIsBatchDateChecked] = useState(false);

  const [data, setData] = useState<any[]>(createEmptyRows());
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ★ 상품상태 공통 필터 적용
  const displayStatuses = (statuses || []).filter(s => ALLOWED_STATUS_NAMES.includes(s.name));
  const displayCategories = (categories || []).filter(c => ALLOWED_CATEGORY_CODES.includes(c.code));

  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.code === supplierCode.trim());
    if (exactMatches.length === 1) {
      setSupplierName(exactMatches[0].name); setSupplierItemCode(''); setSupplierItemName(''); 
    } else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.name === supplierName.trim());
    if (exactMatches.length === 1) {
      setSupplierCode(exactMatches[0].code); setSupplierName(exactMatches[0].name);
      setSupplierItemCode(''); setSupplierItemName(''); 
    } else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierItemCodeSearch = () => {
    if (!supplierCode.trim()) { alert('매입처코드값을 먼저 입력해주세요'); return; }
    if (!supplierItemCode.trim()) { setIsSupplierItemModalOpen(true); return; }
    const formatted = supplierItemCode.trim().padStart(3, '0');
    setSupplierItemCode(formatted); 
    const exactMatches = (supplierItems || []).filter(si => si.supplierCode === supplierCode.trim() && String(si.itemCode).padStart(3, '0') === formatted);
    if (exactMatches.length === 1) setSupplierItemName(exactMatches[0].itemName);
    else setIsSupplierItemModalOpen(true);
  };

  const handleSupplierItemNameSearch = () => {
    if (!supplierCode.trim()) { alert('매입처코드값을 먼저 입력해주세요'); return; }
    if (!supplierItemName.trim()) { setIsSupplierItemModalOpen(true); return; }
    const exactMatches = (supplierItems || []).filter(si => si.supplierCode === supplierCode.trim() && si.itemName === supplierItemName.trim());
    if (exactMatches.length === 1) {
      setSupplierItemCode(String(exactMatches[0].itemCode).padStart(3, '0')); setSupplierItemName(exactMatches[0].itemName);
    } else { setIsSupplierItemModalOpen(true); }
  };

  const handleProductCodeSearch = () => {
    if (!productCode.trim()) { setIsProductModalOpen(true); return; }
    const numCode = productCode.replace(/[^0-9]/g, '');
    setProductCode(numCode);
    const exactMatches = (products || []).filter(p => safeText(p.productCode) === numCode);
    if (exactMatches.length === 1) setProductName(safeText(exactMatches[0].productName));
    else setIsProductModalOpen(true);
  };

  const handleProductNameSearch = () => {
    if (!productName.trim()) { setIsProductModalOpen(true); return; }
    const exactMatches = (products || []).filter(p => safeText(p.productName).includes(productName.trim()));
    if (exactMatches.length === 1) {
      setProductCode(safeText(exactMatches[0].productCode)); setProductName(safeText(exactMatches[0].productName));
    } else { setIsProductModalOpen(true); }
  };

  const handleSearch = () => {
    let filtered = products || [];

    if (productCode.trim()) filtered = filtered.filter(p => safeText(p.productCode).includes(productCode.trim()));
    if (productName.trim()) filtered = filtered.filter(p => safeText(p.productName).includes(productName.trim()));
    if (supplierCode.trim()) filtered = filtered.filter(p => safeText(p.supplierCode).includes(supplierCode.trim()));
    if (supplierName.trim()) filtered = filtered.filter(p => safeText(p.supplierName).includes(supplierName.trim()));
    if (supplierItemCode.trim()) filtered = filtered.filter(p => safeText(p.supplierItemCode).includes(supplierItemCode.trim()));
    if (supplierItemName.trim()) filtered = filtered.filter(p => safeText(p.supplierItemName).includes(supplierItemName.trim()));
    
    if (categoryCode !== 'all') {
        const catName = categories.find(c => c.code === categoryCode)?.name;
        if (catName) {
            filtered = filtered.filter(p => safeText(p.groupCategory) === catName || safeText(p.productCategory) === catName);
        }
    }
    if (status !== 'all') {
        const statName = statuses.find(s => s.code === status)?.name;
        if (statName) {
            filtered = filtered.filter(p => safeText(p.productStatus) === statName);
        }
    }
    
    let displayData = filtered.map((p, idx) => ({
      ...p,
      id: `${safeText(p.productCode)}-${idx}`,
      originalPrice: safeText(p.initialReleasePrice),
      currentPrice: safeText(p.listPrice),
      status: safeText(p.productStatus),
      lastModified: parseExcelDate(p.registrationDate),
      modifier: safeText(p.registrant),
      newPrice: '',
      effectiveDate: format(addDays(new Date(), 1), 'yyyy-MM-dd')
    }));

    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        id: `padding-${i}`, productCode: '', productName: '', supplierCode: '', supplierName: '',
        supplierItemCode: '', categoryCode: '', categoryName: '', status: '', originalPrice: '', currentPrice: '', 
        newPrice: '', effectiveDate: '', lastModified: '', modifier: ''
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    setData(displayData);
    setSelectedRows([]);
  };

  const handleSearchReset = () => {
    setSupplierCode(''); setSupplierName('');
    setProductCode(''); setProductName('');
    setSupplierItemCode(''); setSupplierItemName(''); 
    setStatus('all'); setCategoryCode('all');
  };

  const handleGridReset = () => {
    setData(createEmptyRows());
    setSelectedRows([]);
    setBatchPrice('');
    setBatchDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    setIsBatchPriceChecked(false);
    setIsBatchDateChecked(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(data.filter(item => item.productCode !== '').map(item => item.id));
    else setSelectedRows([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) setSelectedRows(prev => [...prev, id]);
    else setSelectedRows(prev => prev.filter(rowId => rowId !== id));
  };

  // ★ 선택 삭제 버그 수정: 아예 배열에서 제거하여 당겨지게 만듦 (빈 공간 모자라면 채우기)
  const handleDeleteSelected = () => {
      if (selectedRows.length === 0) return alert('삭제할 항목을 선택해주세요.');
      
      let remainingData = data.filter(item => !selectedRows.includes(item.id) || item.productCode === '');
      
      if (remainingData.length < 10) {
         const emptyPadding = Array.from({ length: 10 - remainingData.length }, (_, i) => ({
            id: `padding-${Date.now()}-${i}`, productCode: '', productName: '', supplierCode: '', supplierName: '',
            supplierItemCode: '', categoryCode: '', categoryName: '', status: '', originalPrice: '', currentPrice: '', 
            newPrice: '', effectiveDate: '', lastModified: '', modifier: ''
         }));
         remainingData = [...remainingData, ...emptyPadding];
      }
      
      setData(remainingData);
      setSelectedRows([]);
  };

  const handleBatchApply = () => {
    if (selectedRows.length === 0) { alert('선택된 항목이 없습니다.'); return; }
    setData(prevData => prevData.map(item => {
      if (selectedRows.includes(item.id) && item.productCode !== '') {
        return {
          ...item,
          newPrice: isBatchPriceChecked ? batchPrice : item.newPrice,
          effectiveDate: isBatchDateChecked ? batchDate : item.effectiveDate
        };
      }
      return item;
    }));
  };

  const handleUpdateItem = (id: string, field: 'newPrice' | 'effectiveDate', value: string) => {
    setData(prevData => prevData.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    const changedItems = data.filter(item => item.productCode !== '' && (item.newPrice || item.effectiveDate));
    if(changedItems.length === 0) { alert('저장할 변경사항이 없습니다.'); return; }
    alert(`${changedItems.length}건의 변경사항이 저장되었습니다.`);
  };

  const handleBatchPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setBatchPrice(rawValue ? Number(rawValue).toLocaleString() : '');
  };

  const applyUploadData = (newItems: any[], clearExisting: boolean) => {
    let baseData = clearExisting ? [] : data.filter(d => d.productCode !== '');
    let displayData = [...baseData, ...newItems];
    
    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        id: `padding-${Date.now()}-${i}`, productCode: '', productName: '', supplierCode: '', supplierName: '',
        supplierItemCode: '', categoryCode: '', categoryName: '', status: '', originalPrice: '', currentPrice: '', 
        newPrice: '', effectiveDate: '', lastModified: '', modifier: ''
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    setData(displayData);
    setSelectedRows([]);
    setPendingUploadData([]);
    setUploadModalOpen(false);
    alert(`${newItems.length}건의 상품 정보가 화면에 적용되었습니다.`);
  };

  const handleFileUploadClick = () => { fileInputRef.current?.click(); };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', raw: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const uploadedItems = [];
      for (let i = 1; i < Math.min(excelData.length, 1001); i++) {
        const row = excelData[i] as any[];
        if (!row[0]) continue;
        const pCode = String(row[0]).trim();
        const nPrice = row[1] ? String(row[1]).replace(/[^0-9]/g, '') : '';
        const nPriceFormatted = nPrice ? Number(nPrice).toLocaleString() : '';
        
        let eDate = '';
        if (row[2]) {
          let rawDate = String(row[2]).replace(/[^0-9]/g, '');
          if (rawDate.length >= 8) {
            eDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          } else { eDate = rawDate; }
        }

        const foundProduct = products.find(p => safeText(p.productCode) === pCode);
        if (foundProduct) {
          uploadedItems.push({
            ...foundProduct, 
            id: `upload-${Date.now()}-${i}`, 
            originalPrice: safeText(foundProduct.initialReleasePrice),
            currentPrice: safeText(foundProduct.listPrice),
            status: safeText(foundProduct.productStatus),
            lastModified: parseExcelDate(foundProduct.registrationDate),
            modifier: safeText(foundProduct.registrant),
            newPrice: nPriceFormatted, 
            effectiveDate: eDate
          });
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
      '상품코드': item.productCode, '상품명': item.productName, '매입처': item.supplierName, '매입처품목코드': item.supplierItemCode,
      '상품상태': item.status, '최초출고가': item.originalPrice ? Number(item.originalPrice) : '', '정가': item.currentPrice ? Number(item.currentPrice) : '',
      '변경정가': item.newPrice ? Number(item.newPrice.replace(/,/g, '')) : '', '적용시작일자': item.effectiveDate,
      '최종수정일': item.lastModified, '변경사번': item.modifier
    }));
    const ws = XLSX.utils.json_to_sheet(excelExportData);
    ws['!cols'] = [ { wpx: 110 }, { wpx: 240 }, { wpx: 140 }, { wpx: 110 }, { wpx: 70 }, { wpx: 80 }, { wpx: 80 }, { wpx: 90 }, { wpx: 110 }, { wpx: 80 }, { wpx: 70 } ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "정가변경내역");
    XLSX.writeFile(wb, "정가변경내역.xlsx");
  };

  const actualDataCount = data.filter(item => item.productCode !== '').length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">문구/음반 정가변경</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr] border-b border-gray-200">
             <Label className="border-b">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 border-b border-gray-200">
                 <Input className="h-6 w-24 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드"value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명"value={supplierName} onChange={(e) => setSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSupplierModalOpen(true)} />
                 </div>
             </div>

             <Label className="border-b">매입처품목</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 border-b border-gray-200">
                  <Input className={cn("h-6 w-20 text-[11px] rounded-[2px] border-gray-300", !supplierCode.trim() && "bg-gray-100 cursor-not-allowed")} placeholder="매입처품목코드"value={supplierItemCode} onChange={(e) => setSupplierItemCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemCodeSearch(); }} disabled={!supplierCode.trim()} />
                 <div className="flex-1 relative flex items-center">
                     <Input className={cn("h-6 w-full text-[11px] rounded-[2px] border-gray-300 pr-6", !supplierCode.trim() ? "bg-gray-100 cursor-not-allowed" : "bg-[#fefefe]")} placeholder="매입처품목명"value={supplierItemName} onChange={(e) => setSupplierItemName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemNameSearch(); }} disabled={!supplierCode.trim()} />
                     <Search className={cn("absolute right-1.5 h-3.5 w-3.5", supplierCode.trim() ? "text-gray-400 cursor-pointer hover:text-gray-800" : "text-gray-300 cursor-not-allowed")} onClick={() => { if (supplierCode.trim()) setIsSupplierItemModalOpen(true); }} />
                  </div>
             </div>

             <Label className="border-b">조코드</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200">
                 <Select value={categoryCode} onValueChange={setCategoryCode}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem>{displayCategories?.map(c => <SelectItem key={c.code} value={c.code}>{c.code} : {c.name}</SelectItem>)}</SelectContent>
                 </Select>
             </div>
          </div>
          
          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr]">
             <Label>상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-24 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명"value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>

             <Label>상품상태</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    {/* ★ 공통 필터 적용된 상품상태 */}
                    <SelectContent><SelectItem value="all">전체</SelectItem>{displayStatuses.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                 </Select>
             </div>
             
             <div className="col-span-2 bg-white"></div>
          </div>
      </div>
      <div className="erp-search-actions">
                 <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button> 
                 <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>

      <div className="erp-section-group flex-1 min-h-0 flex flex-col">
      <div className="erp-section-toolbar">
         <span className="erp-section-title">일괄적용</span>
      </div>
      <div className="border border-gray-300 bg-white p-2 flex items-center gap-4 flex-shrink-0">
         <div className="flex items-center gap-2">
            <Checkbox id="batch-price" className="h-3.5 w-3.5 rounded-[2px] border-gray-400" checked={isBatchPriceChecked} onCheckedChange={(c) => setIsBatchPriceChecked(!!c)} />
            <label htmlFor="batch-price" className="text-[12px] font-bold text-blue-600 cursor-pointer">변경정가</label>
            <Input className="h-6 w-28 text-[11px] rounded-[2px] border-gray-300 bg-white ml-1 text-right" value={batchPrice} onChange={handleBatchPriceChange} placeholder="숫자 입력" />
         </div>
         <div className="flex items-center gap-2">
            <Checkbox id="batch-date" className="h-3.5 w-3.5 rounded-[2px] border-gray-400" checked={isBatchDateChecked} onCheckedChange={(c) => setIsBatchDateChecked(!!c)} />
            <label htmlFor="batch-date" className="text-[12px] font-bold text-blue-600 cursor-pointer">적용시작일자</label>
            <div className="flex items-center h-6 w-[110px] ml-1 bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
                <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={batchDate} onChange={(e) => setBatchDate(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
                <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                    <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={batchDate.length === 10 ? batchDate : ''} onChange={(e) => setBatchDate(e.target.value)} />
                </div>
            </div>
            <Button variant="outline" className={actionBtnClass} onClick={handleBatchApply}>일괄적용</Button>
         </div>
      </div>

      <SectionHeader title={`문구/음반 정가변경내역 (${actualDataCount}건)`}>
         <Button variant="outline" className={actionBtnClass} onClick={handleGridReset}>초기화</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운</Button> 
         <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>파일등록</Button>
         <Button variant="outline" className={actionRedBtnClass} onClick={handleDeleteSelected}>선택삭제</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장</Button>
      </SectionHeader>

      <div className="flex-1 border border-gray-300 bg-white flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[1200px] text-[11px]">
                <TableHeader className="sticky top-0 z-30 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="bg-[#f4f4f4] h-8 hover:bg-[#f4f4f4]">
                        <TableHead className="w-[40px] min-w-[40px] text-center border-r border-gray-300 p-0">
                            <Checkbox checked={selectedRows.length === actualDataCount && actualDataCount > 0} onCheckedChange={(c) => handleSelectAll(!!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px] bg-white"/>
                        </TableHead>
                        <TableHead className="w-[110px] min-w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">상품코드</TableHead>
                        <TableHead className="w-[240px] min-w-[240px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">상품명</TableHead>
                        <TableHead className="w-[140px] min-w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">매입처</TableHead>
                        <TableHead className="w-[110px] min-w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">매입처별품명</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">상품상태</TableHead>
                        <TableHead className="w-[80px] min-w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">최초출고가</TableHead>
                        <TableHead className="w-[80px] min-w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">정가</TableHead>
                        
                        <TableHead className="w-[90px] min-w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px] bg-yellow-400">변경정가</TableHead>
                        <TableHead className="w-[110px] min-w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px] bg-yellow-400">적용시작일자</TableHead>
                        
                        <TableHead className="w-[80px] min-w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 text-[12px]">최종수정일</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center font-bold text-gray-900 p-1 text-[12px]">변경사번</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id} className="h-8 hover:bg-blue-50/50 border-b border-gray-200 bg-white">
                            <TableCell className="text-center p-0 border-r border-gray-200 truncate">
                                {row.productCode && <Checkbox checked={selectedRows.includes(row.id)} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px]" />}
                            </TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600 truncate">{row.productCode}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate" title={row.productName}>{row.productName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate" title={row.supplierName}>{row.supplierName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplierItemName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.status}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 truncate">{row.originalPrice ? Number(row.originalPrice).toLocaleString() : ''}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-gray-800 truncate">{row.currentPrice ? Number(row.currentPrice).toLocaleString() : ''}</TableCell>
                            
                            <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                {row.productCode && <Input className="h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-1 bg-transparent text-[11px] font-bold text-red-600" value={row.newPrice} onChange={(e) => {
                                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                        const formatted = rawValue ? Number(rawValue).toLocaleString() : '';
                                        handleUpdateItem(row.id, 'newPrice', formatted);
                                      }} />}
                            </TableCell>
                            <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                {row.productCode && (
                                  <div className="flex items-center h-full w-full focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden relative">
                                      <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={row.effectiveDate} placeholder="" onChange={(e) => handleUpdateItem(row.id, 'effectiveDate', formatDateString(e.target.value))} onFocus={(e) => e.target.select()} />
                                      <div className="absolute right-0 w-5 h-full flex items-center justify-center border-l border-yellow-200 cursor-pointer hover:bg-yellow-100 flex-shrink-0">
                                          <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                                          <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={row.effectiveDate.length === 10 ? row.effectiveDate : ''} onChange={(e) => handleUpdateItem(row.id, 'effectiveDate', e.target.value)} />
                                      </div>
                                  </div>
                                )}
                            </TableCell>
                            
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 truncate">{row.lastModified}</TableCell>
                            <TableCell className="text-center p-1 text-gray-500 truncate">{row.modifier}</TableCell>
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

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName} onSelect={(item) => { setProductCode(item.productCode); setProductName(item.productName); }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={supplierName} onSelect={(item) => { setSupplierCode(item.code); setSupplierName(item.name); setSupplierItemCode(''); setSupplierItemName(''); }} />
      <SupplierItemSearchModal isOpen={isSupplierItemModalOpen} onClose={() => setIsSupplierItemModalOpen(false)} supplierCode={supplierCode} initialSearchName={supplierItemName} onSelect={(item) => { setSupplierItemCode(String(item.itemCode).padStart(3, '0')); setSupplierItemName(item.itemName); }} />
    </div>
  );
}