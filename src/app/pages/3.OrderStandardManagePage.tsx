import React, { useState, useRef } from 'react';
import { Search, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { format, subMonths } from 'date-fns';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';

const ALLOWED_CATEGORY_CODES = ['M1', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'T1', 'T2', 'U1'];
const ALLOWED_STATUS_NAMES = ['정상', '절판', '품절', '판매금지', '일시품절', '예약판매'];

const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];
const STATIONERY_SUPPLIERS = ['0800448', '0800586', '0800618', '0800666', '0811137', '0815165', '0817037'];
const OVERSEAS_SUPPLIERS = ['0900216', '0900224', '0900252'];
// ★ 특정매입 매입처(categoryCode '6')는 조회 제외
const SPECIAL_PURCHASE_CATEGORY_CODE = '6';

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

const createEmptyRows = () => Array.from({ length: 10 }, (_, index) => ({
  uniqueId: `empty-${Date.now()}-${index}`, productCode: '', productName: '', productNo: '', 
  supplierCode: '', supplierName: '', supplierItemName: '', status: '', purchaseType: '',
  originalPrice: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', 
  modifier: '', centerOrderYn: 'N', lastModified: ''
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
const headerBtnClass = "erp-btn-header";

export default function OrderStandardManagePage() {
  const { products, statuses, suppliers, supplierItems = [] } = useMockData();

  const [productType, setProductType] = useState('stationery'); 
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierItemCode, setSupplierItemCode] = useState(''); 
  const [supplierItemName, setSupplierItemName] = useState(''); 
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState(''); 
  const [regDateStart, setRegDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [regDateEnd, setRegDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('all');
  const [orderStandardPriceYn, setOrderStandardPriceYn] = useState('all'); 
  const [centerOrderSearchYn, setCenterOrderSearchYn] = useState('all');   

  const [data, setData] = useState<any[]>(createEmptyRows());
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayStatuses = (statuses || []).filter(s => ALLOWED_STATUS_NAMES.includes(s.name));

  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.code === supplierCode.trim() && s.categoryCode !== SPECIAL_PURCHASE_CATEGORY_CODE);
    if (exactMatches.length === 1) {
      setSupplierName(exactMatches[0].name); setSupplierItemCode(''); setSupplierItemName(''); 
    } else if ((suppliers || []).some(s => s.code === supplierCode.trim() && s.categoryCode === SPECIAL_PURCHASE_CATEGORY_CODE)) {
      alert('특정매입 매입처는 이 화면에서 조회할 수 없습니다.');
    } else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.name === supplierName.trim() && s.categoryCode !== SPECIAL_PURCHASE_CATEGORY_CODE);
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
            
            if (diffDays > 93) {
              alert("등록일자는 최대 3개월까지만 검색 가능합니다.");
              return;
            }
        }
    }

    const filtered = (products || []).filter(item => {
        // ★ 특정매입 매입처(categoryCode '6') 상품 제외
        const itemSupplier = (suppliers || []).find(s => s.code === safeText(item.supplierCode));
        if (itemSupplier && itemSupplier.categoryCode === SPECIAL_PURCHASE_CATEGORY_CODE) return false;

        if (isProductCodeSearch && !safeText(item.productCode).includes(productCode.replace(/[^0-9]/g, ''))) return false;
        if (productName && !safeText(item.productName).includes(productName)) return false;
        if (supplierCode && !safeText(item.supplierCode).includes(supplierCode)) return false;
        if (supplierItemCode && !safeText(item.supplierItemCode).includes(supplierItemCode)) return false;
        
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

        // ★ 발주기준가 유무 필터 (Y=값이 있음, N=비어있음)
        if (orderStandardPriceYn !== 'all') {
            const hasOrderPrice = !!safeText(item.fobPrice); // 현재 데이터엔 orderStandardPrice 필드가 명확치 않아 fobPrice를 대신 기준가로 가정
            if (orderStandardPriceYn === 'Y' && !hasOrderPrice) return false;
            if (orderStandardPriceYn === 'N' && hasOrderPrice) return false;
        }

        // ★ 센터발주여부 필터
        if (centerOrderSearchYn !== 'all' && safeText(item.centerOrderYn) !== centerOrderSearchYn) return false;

        return true;
    });
    
    let displayData = filtered.map((item, idx) => {
      const sItem = supplierItems.find(si => si.supplierCode === item.supplierCode && String(si.itemCode).padStart(3,'0') === item.supplierItemCode);
      const s = suppliers.find(su => su.code === item.supplierCode);
      
      const op = safeText(item.initialReleasePrice);
      const curP = safeText(item.listPrice);
      const stdP = safeText(item.fobPrice); // 발주기준가
      
      let pr = '';
      if (curP && stdP && !isNaN(Number(curP)) && !isNaN(Number(stdP)) && Number(curP) > 0) {
          pr = ((Number(stdP) / Number(curP)) * 100).toFixed(2);
      }

      return {
        ...item, 
        uniqueId: `data-${Date.now()}-${idx}`,
        productNo: safeText(item.orderNo),
        supplierItemName: sItem ? sItem.itemName : safeText(item.supplierItemName), 
        purchaseType: s ? s.purchaseType : safeText(item.purchaseType),
        status: safeText(item.productStatus),
        originalPrice: op,
        currentPrice: curP,
        orderStandardPrice: stdP, 
        purchaseRate: pr, 
        centerOrderYn: safeText(item.centerOrderYn) || 'N',
        lastModified: parseExcelDate(item.registrationDate),
        modifier: safeText(item.registrant)
      };
    });

    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', 
        supplierName: '', supplierItemName: '', status: '', purchaseType: '',
        originalPrice: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', 
        modifier: '', centerOrderYn: 'N', lastModified: ''
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    setData(displayData);
    setSelectedRows([]);
  };

  const handleSearchReset = () => {
    setProductType('stationery'); setSupplierCode(''); setSupplierName('');
    setSupplierItemCode(''); setSupplierItemName(''); setProductCode(''); setProductName('');
    setRegDateStart(format(subMonths(new Date(), 1), 'yyyy-MM-dd')); setRegDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setStatus('all'); setOrderStandardPriceYn('all'); setCenterOrderSearchYn('all');
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

  const handleUpdateOrderStandardPrice = (uniqueId: string, val: string) => {
    const numVal = val.replace(/[^0-9]/g, '');
    setData(prev => prev.map(item => {
        if (item.uniqueId === uniqueId) {
            const curP = item.currentPrice || 0;
            const pr = (curP && numVal) ? ((Number(numVal) / curP) * 100).toFixed(2) : '';
            return { ...item, orderStandardPrice: numVal, purchaseRate: pr };
        }
        return item;
    }));
  };

  const handleUpdateCenterOrder = (uniqueId: string, val: string) => {
    setData(prev => prev.map(item => item.uniqueId === uniqueId ? { ...item, centerOrderYn: val } : item));
  };

  const handleBatchOrderPrice = () => {
    if (selectedRows.length === 0) return alert('선택된 항목이 없습니다.');
    setData(prev => prev.map(item => {
        if (selectedRows.includes(item.uniqueId) && item.productCode) {
            const op = item.originalPrice || 0;
            const curP = item.currentPrice || 0;
            const pr = curP ? ((op / curP) * 100).toFixed(2) : '0.00';
            return { ...item, orderStandardPrice: String(op), purchaseRate: pr };
        }
        return item;
    }));
  };

  const handleBatchCenterOrder = (yn: string) => {
    if (selectedRows.length === 0) return alert('선택된 항목이 없습니다.');
    setData(prev => prev.map(item => {
        if (selectedRows.includes(item.uniqueId) && item.productCode) {
            return { ...item, centerOrderYn: yn };
        }
        return item;
    }));
  };

  // ★ 선택 삭제 (행 자체를 제거하여 당겨지게 처리)
  const handleDeleteRow = () => {
    if (selectedRows.length === 0) return alert('삭제할 항목을 선택해주세요.');
    
    let remainingData = data.filter(item => !selectedRows.includes(item.uniqueId) || item.productCode === '');
    
    if (remainingData.length < 10) {
       const emptyPadding = Array.from({ length: 10 - remainingData.length }, (_, i) => ({
          uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', 
          supplierCode: '', supplierName: '', supplierItemName: '', status: '', purchaseType: '',
          originalPrice: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', 
          modifier: '', centerOrderYn: 'N', lastModified: ''
       }));
       remainingData = [...remainingData, ...emptyPadding];
    }
    
    setData(remainingData);
    setSelectedRows([]);
  };

  const handleSave = () => {
    const changedItems = data.filter(item => item.productCode !== '' && item.orderStandardPrice !== '');
    if(changedItems.length === 0) { alert('저장할 변경사항이 없습니다.'); return; }
    alert(`${changedItems.length}건의 발주기준이 저장되었습니다.`);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["상품코드", "발주기준가(숫자)"]]);
    ws['!cols'] = [{ wpx: 120 }, { wpx: 120 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "업로드양식");
    XLSX.writeFile(wb, "발주기준가_업로드양식.xlsx");
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
      let hasError = false;
      let errorCount = 0;

      for (let i = 1; i < Math.min(excelData.length, 1001); i++) {
        const row = excelData[i] as any[];
        if (!row[0]) continue; 
        const pCode = String(row[0]).trim();
        const oPriceRaw = row[1];
        
        if (oPriceRaw !== undefined && isNaN(Number(oPriceRaw))) {
          hasError = true; errorCount++; continue;
        }
        
        const foundProduct = products.find(p => safeText(p.productCode) === pCode);
        if (foundProduct) {
          const curP = safeText(foundProduct.listPrice) || 0;
          const oPrice = oPriceRaw !== undefined ? Number(oPriceRaw) : '';
          const pr = (curP && oPrice !== '') ? ((oPrice / Number(curP)) * 100).toFixed(2) : '';
          
          uploadedItems.push({
            ...foundProduct, 
            uniqueId: `upload-${Date.now()}-${i}`,
            productNo: safeText(foundProduct.orderNo),
            status: safeText(foundProduct.productStatus),
            supplierItemName: supplierItems.find(si => si.supplierCode === foundProduct.supplierCode && String(si.itemCode).padStart(3,'0') === foundProduct.supplierItemCode)?.itemName || safeText(foundProduct.supplierItemName),
            purchaseType: suppliers.find(s => s.code === foundProduct.supplierCode)?.purchaseType || safeText(foundProduct.purchaseType),
            originalPrice: safeText(foundProduct.initialReleasePrice),
            currentPrice: curP,
            lastModified: parseExcelDate(foundProduct.registrationDate),
            modifier: safeText(foundProduct.registrant),
            orderStandardPrice: oPrice !== '' ? String(oPrice) : '', purchaseRate: pr, centerOrderYn: 'N'
          });
        } else { errorCount++; }
      }

      if (hasError) { alert(`상품코드/발주기준가를 확인해주세요!\n(성공: ${uploadedItems.length}건, 오류: ${errorCount}건)`); }
      else if (errorCount > 0) { alert(`미등록바코드 등 오류가 있습니다.\n(성공: ${uploadedItems.length}건, 오류: ${errorCount}건)`); } 
      else { alert(`${uploadedItems.length}건이 업로드 되었습니다.`); }

      let displayData = [...data.filter(d => d.productCode), ...uploadedItems];
      if (displayData.length < 10) {
        const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
          uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', 
          supplierName: '', supplierItemName: '', status: '', purchaseType: '',
          originalPrice: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', 
          modifier: '', centerOrderYn: 'N', lastModified: ''
        }));
        displayData = [...displayData, ...emptyPadding];
      }
      setData(displayData);
      setSelectedRows([]);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExcelDownload = () => {
    const validData = data.filter(item => item.productCode !== '');
    if (validData.length === 0) return alert('다운로드할 데이터가 없습니다.');
    const excelExportData = validData.map(item => ({
      '상품코드': item.productCode, '제품번호': item.productNo, '상품명': item.productName,
      '매입처명': item.supplierName, '매입처별품목코드명': item.supplierItemName, '상품상태': item.status,
      '매입구분': item.purchaseType, '최초출고가': item.originalPrice ? Number(item.originalPrice) : '',
      '발주기준가': item.orderStandardPrice ? Number(item.orderStandardPrice) : '', '매입율': item.purchaseRate ? Number(item.purchaseRate) : '',
      '정가': item.currentPrice ? Number(item.currentPrice) : '', '변경사번': item.modifier,
      '센터발주': item.centerOrderYn, '변경일시': item.lastModified
    }));
    const ws = XLSX.utils.json_to_sheet(excelExportData);
    ws['!cols'] = [ {wpx:110}, {wpx:100}, {wpx:200}, {wpx:140}, {wpx:140}, {wpx:70}, {wpx:70}, {wpx:80}, {wpx:100}, {wpx:60}, {wpx:80}, {wpx:70}, {wpx:80}, {wpx:120} ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "매입률조회리스트");
    XLSX.writeFile(wb, "매입률조회리스트.xlsx");
  };

  const actualDataCount = data.filter(item => item.productCode !== '').length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">발주기준관리</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[110px_1fr_110px_1.5fr_110px_1.5fr] border-b border-gray-200">
             <Label className="border-b" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 gap-4 border-b border-gray-200 border-r">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="productType" value="stationery" checked={productType === 'stationery'} onChange={() => setProductType('stationery')} /> 문구</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="productType" value="album" checked={productType === 'album'} onChange={() => setProductType('album')} /> 음반</label>
             </div>

             <Label className="border-b">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>

             <Label className="border-b">상품상태</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200">
                 <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    {/* ★ 공통 필터 적용된 상품상태 */}
                    <SelectContent><SelectItem value="all">전체</SelectItem>{displayStatuses.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1.5fr_110px_1.5fr] border-b border-gray-200">
             <Label className="border-b">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSupplierModalOpen(true)} />
                 </div>
             </div>

             <Label className="border-b">매입처품목</Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 border-r">
                 <Input className={cn("h-6 w-16 text-[11px] rounded-[2px] border-gray-300", !supplierCode.trim() && "bg-gray-100 cursor-not-allowed")} placeholder="매입처품목코드" value={supplierItemCode} onChange={(e) => setSupplierItemCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemCodeSearch(); }} disabled={!supplierCode.trim()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className={cn("h-6 w-full text-[11px] rounded-[2px] border-gray-300 pr-6", !supplierCode.trim() ? "bg-gray-100 cursor-not-allowed" : "bg-[#fefefe]")} placeholder="매입처품목명" value={supplierItemName} onChange={(e) => setSupplierItemName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemNameSearch(); }} disabled={!supplierCode.trim()} />
                    <Search className={cn("absolute right-1.5 h-3.5 w-3.5", supplierCode.trim() ? "text-gray-400 cursor-pointer hover:text-gray-800" : "text-gray-300 cursor-not-allowed")} onClick={() => { if (supplierCode.trim()) setIsSupplierItemModalOpen(true); }} />
                 </div>
             </div>

             <Label className="bg-[#eef3f8] border-b"></Label>
             <div className="flex items-center p-1 gap-1 border-b border-gray-200 bg-white"></div>
          </div>
          
          <div className="grid grid-cols-[110px_1fr_110px_1.5fr_110px_1.5fr]">
             <Label>등록일자</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={regDateStart} endVal={regDateEnd} onStartChange={setRegDateStart} onEndChange={setRegDateEnd} />
             </div>

             <Label>발주기준가</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={orderStandardPriceYn} onValueChange={setOrderStandardPriceYn}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="Y">Y (입력됨)</SelectItem><SelectItem value="N">N (비어있음)</SelectItem></SelectContent>
                 </Select>
             </div>

             <Label>센터발주여부</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={centerOrderSearchYn} onValueChange={setCenterOrderSearchYn}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
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

      <div className="erp-section-group flex-1 min-h-0 flex flex-col overflow-hidden">
      <SectionHeader title="매입률 조회 리스트">
         <Button variant="outline" className={actionBtnClass} onClick={handleDownloadTemplate}>엑셀양식</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>엑셀업로드(F2)</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운(F1)</Button>
         <Button variant="outline" className={actionBtnClass} title="클릭 시 최초출고가와 동일하게 처리됩니다" onClick={handleBatchOrderPrice}>발주기준가 일괄적용</Button>
         <Button variant="outline" className={actionBtnClass} onClick={() => handleBatchCenterOrder('N')}>센터발주 N일괄변경</Button>
         <Button variant="outline" className={actionBtnClass} onClick={() => handleBatchCenterOrder('Y')}>센터발주 Y일괄변경</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleDeleteRow}>삭제</Button>
         <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장</Button>
      </SectionHeader>

      <div className="flex-1 border border-gray-300 bg-white flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[1400px] text-[11px]">
                <TableHeader className="sticky top-0 z-30 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="bg-[#f4f4f4] h-8 hover:bg-[#f4f4f4]">
                        <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">NO</TableHead>
                        <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">
                            <Checkbox checked={selectedRows.length === actualDataCount && actualDataCount > 0} onCheckedChange={(c) => handleSelectAll(!!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px] bg-white"/>
                        </TableHead>
                        <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">제품번호</TableHead>
                        <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                        <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처코드</TableHead>
                        <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                        <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처별 품목코드명</TableHead>
                        <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품상태</TableHead>
                        <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입 구분</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">최초 출고가</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-400">발주기준가</TableHead>
                        <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입율</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">정가</TableHead>
                        <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">변경사번</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">센터 발주</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 p-1">변경일시</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, idx) => {
                        const isOverPriced = row.orderStandardPrice && row.currentPrice && (Number(row.orderStandardPrice) > Number(row.currentPrice));
                        const trClass = cn("h-8 hover:bg-blue-50/50 border-b border-gray-200 bg-white", isOverPriced && "text-red-600");

                        return (
                          <TableRow key={row.uniqueId} className={trClass}>
                              <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.productCode ? idx + 1 : ''}</TableCell>
                              <TableCell className="text-center p-0 border-r border-gray-200">
                                  {row.productCode && <Checkbox checked={selectedRows.includes(row.uniqueId)} onCheckedChange={(c) => handleSelectRow(row.uniqueId, !!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px]" />}
                              </TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200 font-medium truncate">{row.productCode}</TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.productCode ? row.productNo || '-' : ''}</TableCell>
                              <TableCell className="text-left p-1 border-r border-gray-200 truncate" title={row.productName}>{row.productName}</TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200 truncate">{row.supplierCode}</TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200 truncate" title={row.supplierName}>{row.supplierName}</TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200 truncate">{row.supplierItemName}</TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200">{row.status}</TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200">{row.purchaseType}</TableCell>
                              <TableCell className="text-right p-1 border-r border-gray-200 pr-2">{row.originalPrice ? Number(row.originalPrice).toLocaleString() : ''}</TableCell>
                              
                              <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                  {row.productCode && (
                                    <Input 
                                      className={cn("h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-1 bg-transparent text-[11px]", isOverPriced && "text-red-600 font-bold")} 
                                      value={row.orderStandardPrice} 
                                      onChange={(e) => handleUpdateOrderStandardPrice(row.uniqueId, e.target.value)} 
                                    />
                                  )}
                              </TableCell>
                              
                              <TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold">{row.purchaseRate}</TableCell>
                              <TableCell className="text-right p-1 border-r border-gray-200 pr-2">{row.currentPrice ? Number(row.currentPrice).toLocaleString() : ''}</TableCell>
                              <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.modifier}</TableCell>
                              
                              <TableCell className="p-0 border-r border-gray-200">
                                  {row.productCode && (
                                    <Select value={row.centerOrderYn} onValueChange={(val) => handleUpdateCenterOrder(row.uniqueId, val)}>
                                      <SelectTrigger className={cn("h-full w-full border-none focus:ring-1 focus:ring-blue-500 rounded-none bg-transparent text-[11px] px-1", isOverPriced && "text-red-600")}>
                                        <SelectValue placeholder="" />
                                      </SelectTrigger>
                                      <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                                    </Select>
                                  )}
                              </TableCell>
                              <TableCell className="text-center p-1 text-gray-500 truncate">{row.lastModified}</TableCell>
                          </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
          </div>
      </div>
      </div>

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName} onSelect={(item) => { setProductCode(item.productCode); setProductName(item.productName); }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={supplierName} excludedCategoryCodes={[SPECIAL_PURCHASE_CATEGORY_CODE]} onSelect={(item) => { setSupplierCode(item.code); setSupplierName(item.name); setSupplierItemCode(''); setSupplierItemName(''); }} />
      <SupplierItemSearchModal isOpen={isSupplierItemModalOpen} onClose={() => setIsSupplierItemModalOpen(false)} supplierCode={supplierCode} initialSearchName={supplierItemName} onSelect={(item) => { setSupplierItemCode(String(item.itemCode).padStart(3, '0')); setSupplierItemName(item.itemName); }} />
    </div>
  );
}