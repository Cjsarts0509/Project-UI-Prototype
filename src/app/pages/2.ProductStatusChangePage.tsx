import React, { useState, useRef } from 'react';
import { Search, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { format, subMonths } from 'date-fns';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';

const ALLOWED_CATEGORY_CODES = ['M1', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'T1', 'T2', 'T3', 'U1'];
const REASON_CATEGORIES = ['업체요청', '신규상품교체', '재고상태불량', '저작권/상표권/법적문제', '직접입력'];
const DUMMY_SUPPLIER_STATUS = ['전체', '정상', '거래중지'];

// ★ 상품상태 공통 필터 적용
const ALLOWED_STATUS_NAMES = ['정상', '절판', '품절', '판매금지', '일시품절', '예약판매'];

const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];
const STATIONERY_SUPPLIERS = ['0800448', '0803124', '0800586', '0800618', '0800666', '0803833', '0811137', '0815165', '0817037'];
const OVERSEAS_SUPPLIERS = ['0900216', '0900224', '0900252'];

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

const createEmptyRows = () => Array.from({ length: 10 }, (_, index) => ({
  uniqueId: `empty-${Date.now()}-${index}`, productCode: '', productName: '', productNo: '', categoryCode: '', categoryName: '',
  supplierCode: '', supplierName: '', supplierItemName: '', status: '', 
  newStatus: '', reasonCategory: '', reasonText: '', lastModified: '', modifier: ''
}));

// ★ onFocus 이벤트 추가로 클릭 시 전체 텍스트 블록 지정 (숫자 입력 즉시 덮어쓰기 가능)
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

export default function ProductStatusChangePage() {
  const { products, statuses, categories, suppliers, supplierItems = [] } = useMockData();

  const [productType, setProductType] = useState('stationery');
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierItemCode, setSupplierItemCode] = useState(''); 
  const [supplierItemName, setSupplierItemName] = useState(''); 
  const [categoryCode, setCategoryCode] = useState('all');
  const [supplierStatus, setSupplierStatus] = useState('all');
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState(''); 
  const [productNo, setProductNo] = useState('');
  const [status, setStatus] = useState('all');

  const [regDateStart, setRegDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [regDateEnd, setRegDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modDateStart, setModDateStart] = useState('');
  const [modDateEnd, setModDateEnd] = useState('');
  const [relDateStart, setRelDateStart] = useState('');
  const [relDateEnd, setRelDateEnd] = useState('');

  const [batchStatus, setBatchStatus] = useState('');
  const [batchReasonCat, setBatchReasonCat] = useState('');
  const [batchReasonText, setBatchReasonText] = useState('');

  const [data, setData] = useState<any[]>(createEmptyRows());
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    let isProductCodeSearch = false;
    if (productCode.trim()) {
        isProductCodeSearch = true;
    } else {
        if (!supplierCode.trim()) {
            const startDate = new Date(regDateStart);
            const endDate = new Date(regDateEnd);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays > 31) {
              alert("매입처 입력 없이 조회 시 등록일자는 최대 31일까지만 검색 가능합니다.");
              return;
            }
        }
    }

    const filtered = (products || []).filter(item => {
        if (isProductCodeSearch && !safeText(item.productCode).includes(productCode.replace(/[^0-9]/g, ''))) return false;
        if (productName && !safeText(item.productName).includes(productName)) return false;
        if (productNo && !safeText(item.orderNo).includes(productNo)) return false; 
        if (supplierCode && !safeText(item.supplierCode).includes(supplierCode)) return false;
        if (supplierItemCode && !safeText(item.supplierItemCode).includes(supplierItemCode)) return false;
        
        if (categoryCode !== 'all') {
            const catName = categories.find(c => c.code === categoryCode)?.name;
            if (catName && safeText(item.groupCategory) !== catName && safeText(item.productCategory) !== catName) return false;
        }
        
        if (status !== 'all') {
            const statName = statuses.find(s => s.code === status)?.name;
            if (statName && safeText(item.productStatus) !== statName) return false;
        }

        const suppCode = safeText(item.supplierCode);
        if (productType === 'album' && !ALBUM_SUPPLIERS.includes(suppCode)) return false;
        if (productType === 'stationery' && !STATIONERY_SUPPLIERS.includes(suppCode)) return false;
        if (productType === 'overseas' && !OVERSEAS_SUPPLIERS.includes(suppCode)) return false;

        const itemRegDate = parseExcelDate(item.registrationDate);
        if (itemRegDate) {
            if (regDateStart && itemRegDate < regDateStart) return false;
            if (regDateEnd && itemRegDate > regDateEnd) return false;
        } else {
            if (regDateStart || regDateEnd) return false;
        }

        const itemRelDate = parseExcelDate(item.releaseDate);
        if (itemRelDate) {
            if (relDateStart && itemRelDate < relDateStart) return false;
            if (relDateEnd && itemRelDate > relDateEnd) return false;
        } else {
            if (relDateStart || relDateEnd) return false;
        }

        return true;
    });
    
    let displayData = filtered.map((item, idx) => {
      const sItem = supplierItems.find(si => si.supplierCode === item.supplierCode && String(si.itemCode).padStart(3,'0') === item.supplierItemCode);
      const cat = categories.find(c => c.name === safeText(item.groupCategory) || c.name === safeText(item.productCategory));
      return {
        ...item, 
        uniqueId: `data-${Date.now()}-${idx}`,
        productNo: safeText(item.orderNo),
        categoryCode: cat ? cat.code : '',
        categoryName: safeText(item.groupCategory) || safeText(item.productCategory),
        status: safeText(item.productStatus),
        supplierItemName: sItem ? sItem.itemName : safeText(item.supplierItemName), 
        newStatus: '', 
        reasonCategory: '', 
        reasonText: '',
        lastModified: parseExcelDate(item.registrationDate),
        modifier: safeText(item.registrant)
      }
    });

    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', categoryCode: '', categoryName: '',
        supplierCode: '', supplierName: '', supplierItemName: '', status: '', 
        newStatus: '', reasonCategory: '', reasonText: '', lastModified: '', modifier: ''
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    setData(displayData);
    setSelectedRows([]);
  };

  const handleSearchReset = () => {
    setProductType('stationery'); setSupplierCode(''); setSupplierName('');
    setSupplierItemCode(''); setSupplierItemName(''); setCategoryCode('all'); 
    setStatus('all'); setSupplierStatus('all'); setProductCode(''); 
    setProductName(''); setProductNo(''); 
    setRegDateStart(format(subMonths(new Date(), 1), 'yyyy-MM-dd')); setRegDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setModDateStart(''); setModDateEnd(''); setRelDateStart(''); setRelDateEnd('');
    setData(createEmptyRows());
    setSelectedRows([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(data.filter(item => item.productCode !== '').map(item => item.uniqueId));
    else setSelectedRows([]);
  };

  const handleSelectRow = (uniqueId: string, checked: boolean) => {
    if (checked) setSelectedRows(prev => [...prev, uniqueId]);
    else setSelectedRows(prev => prev.filter(rowId => rowId !== uniqueId));
  };

  const handleBatchApply = () => {
    if (!batchStatus) return alert('변경할 상품상태를 선택해주세요.');
    if (selectedRows.length === 0) return alert('선택된 항목이 없습니다.');
    setData(prevData => prevData.map(item => {
      if (selectedRows.includes(item.uniqueId)) {
        return {
          ...item,
          newStatus: batchStatus,
          reasonCategory: batchReasonCat,
          reasonText: batchReasonCat === '직접입력' ? batchReasonText : ''
        };
      }
      return item;
    }));
  };

  const handleUpdateItem = (uniqueId: string, field: string, value: string) => {
    setData(prevData => prevData.map(item => {
      if (item.uniqueId === uniqueId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'reasonCategory' && value !== '직접입력') updatedItem.reasonText = '';
        return updatedItem;
      }
      return item;
    }));
  };

  const handleDeleteSelected = () => {
      if (selectedRows.length === 0) return alert('삭제할 항목을 선택해주세요.');
      
      let remainingData = data.filter(item => !selectedRows.includes(item.uniqueId) || item.productCode === '');
      
      if (remainingData.length < 10) {
         const emptyPadding = Array.from({ length: 10 - remainingData.length }, (_, i) => ({
            uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', categoryCode: '', categoryName: '',
            supplierCode: '', supplierName: '', supplierItemName: '', status: '', 
            newStatus: '', reasonCategory: '', reasonText: '', lastModified: '', modifier: ''
         }));
         remainingData = [...remainingData, ...emptyPadding];
      }
      
      setData(remainingData);
      setSelectedRows([]);
  };

  const handleSave = () => {
    const changedItems = data.filter(item => item.productCode !== '' && item.newStatus !== '');
    if(changedItems.length === 0) { alert('저장할 변경사항이 없습니다.'); return; }
    alert(`${changedItems.length}건의 상태 변경사항이 저장되었습니다.`);
  };

  const applyUploadData = (newItems: any[], clearExisting: boolean) => {
    let baseData = clearExisting ? [] : data.filter(d => d.productCode !== '');
    let displayData = [...baseData, ...newItems];
    
    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', categoryCode: '', categoryName: '',
        supplierCode: '', supplierName: '', supplierItemName: '', status: '', 
        newStatus: '', reasonCategory: '', reasonText: '', lastModified: '', modifier: ''
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
        const foundProduct = products.find(p => safeText(p.productCode) === pCode);
        
        if (foundProduct) {
          const sItem = supplierItems.find(si => si.supplierCode === foundProduct.supplierCode && String(si.itemCode).padStart(3,'0') === foundProduct.supplierItemCode);
          const cat = categories.find(c => c.name === safeText(foundProduct.groupCategory) || c.name === safeText(foundProduct.productCategory));
          
          uploadedItems.push({
            ...foundProduct, 
            uniqueId: `upload-${Date.now()}-${i}`, 
            productNo: safeText(foundProduct.orderNo),
            categoryName: cat ? cat.name : '',
            status: safeText(foundProduct.productStatus),
            supplierItemName: sItem ? sItem.itemName : safeText(foundProduct.supplierItemName), 
            lastModified: parseExcelDate(foundProduct.registrationDate),
            modifier: safeText(foundProduct.registrant),
            newStatus: '', reasonCategory: '', reasonText: ''
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
      '상품코드': item.productCode, '상품명': item.productName, '제품번호': item.productNo, '조': item.categoryName,
      '매입처코드': item.supplierCode, '매입처': item.supplierName, '매입처품목': item.supplierItemName,
      '현재상태': item.status, '변경상태': item.newStatus, '변경사유구분': item.reasonCategory,
      '변경사유': item.reasonText, '변경일자': item.lastModified, '변경사번': item.modifier
    }));
    const ws = XLSX.utils.json_to_sheet(excelExportData);
    ws['!cols'] = [ {wpx:110}, {wpx:200}, {wpx:100}, {wpx:100}, {wpx:100}, {wpx:140}, {wpx:140}, {wpx:70}, {wpx:70}, {wpx:110}, {wpx:150}, {wpx:80}, {wpx:70} ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "상품목록");
    XLSX.writeFile(wb, "상품상태변경_상품목록.xlsx");
  };

  const actualDataCount = data.filter(item => item.productCode !== '').length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">문구/음반 상품상태변경</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr] border-b border-gray-200">
             <Label className="border-b" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 gap-4 border-b border-gray-200 border-r">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="productType" value="stationery" checked={productType === 'stationery'} onChange={() => setProductType('stationery')} /> 문구</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="productType" value="album" checked={productType === 'album'} onChange={() => setProductType('album')} /> 음반</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="productType" value="overseas" checked={productType === 'overseas'} onChange={() => setProductType('overseas')} /> 해외문구</label>
             </div>
             <Label className="border-b">조코드</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Select value={categoryCode} onValueChange={setCategoryCode}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem>{displayCategories?.map(c => <SelectItem key={c.code} value={c.code}>{c.code} : {c.name}</SelectItem>)}</SelectContent>
                 </Select>
             </div>
             <Label className="border-b"></Label><div className="flex items-center p-1 gap-1 border-b border-gray-200 bg-white"></div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr] border-b border-gray-200">
             <Label className="border-b">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             <Label className="border-b">상품상태</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem>{displayStatuses.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                 </Select>
             </div>
             <Label className="border-b">제품번호</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200">
                 <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={productNo} onChange={(e) => setProductNo(e.target.value)} />
             </div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr] border-b border-gray-200">
             <Label className="border-b" required>매입처</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSupplierModalOpen(true)} />
                 </div>
             </div>
             <Label className="border-b">매입처상태</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Select value={supplierStatus} onValueChange={setSupplierStatus}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>{DUMMY_SUPPLIER_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                 </Select>
             </div>
             <Label className="border-b">매입처품목</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200">
                 <Input className={cn("h-6 w-16 text-[11px] rounded-[2px] border-gray-300", !supplierCode.trim() && "bg-gray-100 cursor-not-allowed")} placeholder="매입처품목코드" value={supplierItemCode} onChange={(e) => setSupplierItemCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemCodeSearch(); }} disabled={!supplierCode.trim()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className={cn("h-6 w-full text-[11px] rounded-[2px] border-gray-300 pr-6", !supplierCode.trim() ? "bg-gray-100 cursor-not-allowed" : "bg-[#fefefe]")} placeholder="매입처품목명" value={supplierItemName} onChange={(e) => setSupplierItemName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemNameSearch(); }} disabled={!supplierCode.trim()} />
                    <Search className={cn("absolute right-1.5 h-3.5 w-3.5", supplierCode.trim() ? "text-gray-400 cursor-pointer hover:text-gray-800" : "text-gray-300 cursor-not-allowed")} onClick={() => { if (supplierCode.trim()) setIsSupplierItemModalOpen(true); }} />
                 </div>
             </div>
          </div>
          
          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr]">
             <Label required>등록일자</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={regDateStart} endVal={regDateEnd} onStartChange={setRegDateStart} onEndChange={setRegDateEnd} />
             </div>
             <Label>변경일자</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={modDateStart} endVal={modDateEnd} onStartChange={setModDateStart} onEndChange={setModDateEnd} />
             </div>
             <Label>출시일자</Label>
             <div className="flex items-center p-1 gap-1">
                    <DateRangeInput startVal={relDateStart} endVal={relDateEnd} onStartChange={setRelDateStart} onEndChange={setRelDateEnd} />
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
                     <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
                     <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>

      <div className="erp-section-group flex-shrink-0">
       <div className="erp-section-toolbar">
          <div className="erp-section-title">상품상태 일괄적용</div>
       </div>
       <div className="border border-gray-300 bg-white p-2 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
             <label className="text-[12px] font-bold text-blue-600 whitespace-nowrap">변경 상품상태<span className="text-red-500 ml-1">*</span></label>
             <Select value={batchStatus} onValueChange={setBatchStatus}>
               <SelectTrigger className="h-6 w-32 text-[11px] rounded-[2px] border-gray-300 bg-white"><SelectValue placeholder="선택" /></SelectTrigger>
               <SelectContent>{displayStatuses.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
             </Select>
          </div>
          <div className="flex items-center gap-2">
             <label className="text-[12px] font-bold text-blue-600 whitespace-nowrap">변경사유</label>
             <Select value={batchReasonCat} onValueChange={(val) => { setBatchReasonCat(val); if (val !== '직접입력') setBatchReasonText(''); }}>
               <SelectTrigger className="h-6 w-32 text-[11px] rounded-[2px] border-gray-300 bg-white"><SelectValue placeholder="선택" /></SelectTrigger>
               <SelectContent>{REASON_CATEGORIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
             </Select>
          </div>
          <div className="flex items-center gap-2">
             <Input className={cn("h-6 w-[250px] text-[11px] rounded-[2px] border-gray-300 bg-[#e0e0e0]", batchReasonCat === '직접입력' && "bg-white")} value={batchReasonText} onChange={(e) => setBatchReasonText(e.target.value)} disabled={batchReasonCat !== '직접입력'} />
             <Button variant="outline" className={actionBtnClass} onClick={handleBatchApply}>일괄적용</Button>
          </div>
       </div>
      </div>

      <div className="erp-section-group flex-1 min-h-0 flex flex-col">
      <SectionHeader title="상품목록">
         <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>엑셀업로드</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운(F1)</Button>
         <Button variant="outline" className={actionRedBtnClass} onClick={handleDeleteSelected}>선택삭제</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장</Button>
      </SectionHeader>
      <div className="flex-1 border border-gray-300 bg-white flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[1400px] text-[11px]">
                <TableHeader className="sticky top-0 z-30 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="bg-[#f4f4f4] h-8 hover:bg-[#f4f4f4]">
                        <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">
                            <Checkbox checked={selectedRows.length === data.filter(d=>d.productCode).length && data.filter(d=>d.productCode).length > 0} onCheckedChange={(c) => handleSelectAll(!!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px] bg-white"/>
                        </TableHead>
                        <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                        <TableHead className="w-[160px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">제품번호</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">조코드</TableHead>
                        <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처코드</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처</TableHead>
                        <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처품목</TableHead>
                        <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">현재상태</TableHead>
                        
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-400">변경상태</TableHead>
                        <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-400">변경사유구분</TableHead>
                        <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-400">변경사유</TableHead>
                        
                        <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">변경일자</TableHead>
                        <TableHead className="w-[70px] text-center font-bold text-gray-900 p-1">변경사번</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.uniqueId} className="h-8 hover:bg-blue-50/50 border-b border-gray-200 bg-white">
                            <TableCell className="text-center p-0 border-r border-gray-200">
                                {row.productCode && <Checkbox checked={selectedRows.includes(row.uniqueId)} onCheckedChange={(c) => handleSelectRow(row.uniqueId, !!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px]" />}
                            </TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.productCode}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate" title={row.productName}>{row.productName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.productCode ? row.productNo || '-' : ''}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.categoryName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplierCode}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate" title={row.supplierName}>{row.supplierName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplierItemName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.status}</TableCell>
                            
                            <TableCell className="p-1 border-r border-gray-200 bg-yellow-50/30">
                                {row.productCode && (
                                  <Select value={row.newStatus} onValueChange={(val) => handleUpdateItem(row.uniqueId, 'newStatus', val)}>
                                    <SelectTrigger className="h-full w-full border-none focus:ring-1 focus:ring-blue-500 rounded-none bg-transparent text-[11px] px-1">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {displayStatuses.map(s => <SelectItem key={`tbl-${row.uniqueId}-${s.code}`} value={s.code}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                )}
                            </TableCell>

                            <TableCell className="p-1 border-r border-gray-200 bg-yellow-50/30">
                                {row.productCode && (
                                  <Select value={row.reasonCategory} onValueChange={(val) => handleUpdateItem(row.uniqueId, 'reasonCategory', val)}>
                                    <SelectTrigger className="h-full w-full border-none focus:ring-1 focus:ring-blue-500 rounded-none bg-transparent text-[11px] px-1">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {REASON_CATEGORIES.map(rc => <SelectItem key={`tbl-${row.uniqueId}-${rc}`} value={rc}>{rc}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                )}
                            </TableCell>

                            <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                {row.productCode && (
                                  <Input 
                                    className={cn("h-full w-full border-none text-left px-2 text-[11px] rounded-none focus-visible:ring-1 focus-visible:ring-blue-500 bg-transparent", row.reasonCategory !== '직접입력' && "bg-gray-100 cursor-not-allowed")} 
                                    value={row.reasonText} 
                                    onChange={(e) => handleUpdateItem(row.uniqueId, 'reasonText', e.target.value)} 
                                    disabled={row.reasonCategory !== '직접입력'} 
                                  />
                                )}
                            </TableCell>
                            
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.lastModified}</TableCell>
                            <TableCell className="text-center p-1 text-gray-500">{row.modifier}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
      </div>
      </div>

      {/* ★ 엑셀 업로드 중복 데이터 모달창 */}
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