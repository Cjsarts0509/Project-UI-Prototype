import React, { useState, useRef } from 'react';
import { Search, Calendar, AlertCircle } from 'lucide-react';
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

// 공통 필터 규칙: 상품구분 매입처 매핑
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
  orderStandardPrice: '', currentPrice: '', recentOrderDate: '', centerOrderYn: '', 
  sales4W: { off: '', on: '', domae: '', total: '' },
  stock: { paju: '', store: '', bookcity: '', total: '' },
  dMinus1OrderQty: '', todayReqQty: '',
  orderUnitQty: '', orderUnitStr: '', orderUnitNum: 1, totalOrderQty: '', totalOrderAmount: ''
}));

const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-blue-600 whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

const actionBtnClass = "erp-btn-action";
const actionRedBtnClass = "erp-btn-danger";
const headerBtnClass = "erp-btn-header";

export default function StationeryOrderPage() {
  const { products, statuses, categories, suppliers, supplierItems = [] } = useMockData();

  const [productType, setProductType] = useState('stationery'); 
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierItemCode, setSupplierItemCode] = useState(''); 
  const [supplierItemName, setSupplierItemName] = useState(''); 
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState(''); 
  const [salesDateStart, setSalesDateStart] = useState('');
  const [salesDateEnd, setSalesDateEnd] = useState('');
  const [receiveLocation, setReceiveLocation] = useState('파주센터');
  const [centerOrderYn, setCenterOrderYn] = useState('all'); 
  
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [data, setData] = useState<any[]>(createEmptyRows());
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayStatuses = (statuses || []).filter(s => ALLOWED_STATUS_NAMES.includes(s.name));

  const handleStatusToggle = (code: string) => {
    if (code === 'all') { setSelectedStatuses(['all']); } 
    else {
      let newStatuses = selectedStatuses.filter(s => s !== 'all');
      if (newStatuses.includes(code)) { newStatuses = newStatuses.filter(s => s !== code); } 
      else { newStatuses.push(code); }
      if (newStatuses.length === 0) newStatuses = ['all'];
      setSelectedStatuses(newStatuses);
    }
  };

  const getStatusDisplayText = () => {
    if (selectedStatuses.includes('all')) return '전체';
    if (selectedStatuses.length === 1) return selectedStatuses[0];
    return `${selectedStatuses[0]} 외 ${selectedStatuses.length - 1}건`;
  };

  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = suppliers.filter(s => STATIONERY_SUPPLIERS.includes(s.code) && s.code === supplierCode.trim());
    if (exactMatches.length === 1) { setSupplierName(exactMatches[0].name); setSupplierItemCode(''); setSupplierItemName(''); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = suppliers.filter(s => STATIONERY_SUPPLIERS.includes(s.code) && s.name.includes(supplierName.trim()));
    if (exactMatches.length === 1) { setSupplierCode(exactMatches[0].code); setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
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
    const numCode = productCode.replace(/[^0-9]/g, ''); setProductCode(numCode);
    const exactMatches = (products || []).filter(p => safeText(p.productCode) === numCode);
    if (exactMatches.length === 1) setProductName(safeText(exactMatches[0].productName));
    else setIsProductModalOpen(true);
  };

  const handleProductNameSearch = () => {
    if (!productName.trim()) { setIsProductModalOpen(true); return; }
    const exactMatches = (products || []).filter(p => safeText(p.productName) === productName.trim());
    if (exactMatches.length === 1) { setProductCode(safeText(exactMatches[0].productCode)); setProductName(safeText(exactMatches[0].productName)); }
    else { setIsProductModalOpen(true); }
  };

  const handleSearch = () => {
    if (!supplierCode.trim() && !productCode.trim()) {
        alert("매입처 또는 상품코드는 필수 입력 항목입니다.");
        return;
    }

    const filtered = (products || []).filter(item => {
        // ★ 특정매입 매입처(categoryCode '6') 상품 제외
        const itemSupplier = (suppliers || []).find(s => s.code === safeText(item.supplierCode));
        if (itemSupplier && itemSupplier.categoryCode === SPECIAL_PURCHASE_CATEGORY_CODE) return false;

        if (productCode && !safeText(item.productCode).includes(productCode.replace(/[^0-9]/g, ''))) return false;
        if (supplierCode && safeText(item.supplierCode) !== supplierCode.trim()) return false;
        
        if (!selectedStatuses.includes('all')) {
            const currentStatusName = safeText(item.productStatus);
            if (!selectedStatuses.includes(currentStatusName)) return false;
        }

        if (centerOrderYn !== 'all' && safeText(item.centerOrderYn) !== centerOrderYn) return false;

        const suppCode = safeText(item.supplierCode);
        if (productType === 'stationery' && !STATIONERY_SUPPLIERS.includes(suppCode)) return false;

        if (supplierItemCode) {
            const itemCode = safeText(item.supplierItemCode);
            if (itemCode !== supplierItemCode.trim().padStart(3, '0')) return false;
        }

        if (productName && !safeText(item.productName).includes(productName.trim())) return false;

        return true;
    });

    // 매입처코드 → 매입처명 순서로 정렬
    const sorted = [...filtered].sort((a, b) => {
        const cmp = safeText(a.supplierCode).localeCompare(safeText(b.supplierCode));
        if (cmp !== 0) return cmp;
        return safeText(a.productName).localeCompare(safeText(b.productName));
    });
    
    // 시드 기반 의사 랜덤 생성 (상품코드 반으로 일관된 값)
    const seededRand = (seed: string, max: number) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) { hash = ((hash << 5) - hash) + seed.charCodeAt(i); hash |= 0; }
        return Math.abs(hash % max);
    };

    let displayData = sorted.map((item, idx) => {
      const sItem = supplierItems.find(si => si.supplierCode === item.supplierCode && String(si.itemCode).padStart(3,'0') === item.supplierItemCode);
      const pCode = safeText(item.productCode);
      const unitQty = item.logisticsUnitQty || 1;
      const unitStr = item.logisticsUnit && item.logisticsUnitQty 
        ? `${item.logisticsUnit}(${item.logisticsUnitQty})` 
        : 'EA(1)';

      // 상품코드 기반 의사 랜덤으로 현실적 데이터 생성
      const offSales = seededRand(pCode + 'off', 150);
      const onSales = seededRand(pCode + 'on', 80);
      const domaeSales = seededRand(pCode + 'dom', 30);
      const totalSales = offSales + onSales + domaeSales;

      const pajuStock = seededRand(pCode + 'paju', 500) + 10;
      const storeStock = seededRand(pCode + 'store', 200);
      const bookStock = seededRand(pCode + 'book', 100);
      const totalStock = pajuStock + storeStock + bookStock;

      const d1OrderQty = seededRand(pCode + 'd1', 50);
      const todayReq = seededRand(pCode + 'req', 30);

      const recentDays = seededRand(pCode + 'date', 30) + 1;
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - recentDays);
      const recentDateStr = format(recentDate, 'yyyy-MM-dd');
      
      return {
        ...item, 
        uniqueId: `data-${Date.now()}-${idx}`,
        productNo: safeText(item.productNumber) || safeText(item.orderNo) || '-',
        supplierItemName: sItem ? sItem.itemName : safeText(item.supplierItemName), 
        status: safeText(item.productStatus),
        orderStandardPrice: safeText(item.initialReleasePrice) || '0', 
        currentPrice: safeText(item.listPrice) || '0',
        recentOrderDate: recentDateStr, 
        centerOrderYn: safeText(item.centerOrderYn) || 'N',
        sales4W: { 
          off: String(offSales), 
          on: String(onSales), 
          domae: String(domaeSales), 
          total: String(totalSales) 
        },
        stock: { 
          paju: String(pajuStock), 
          store: String(storeStock), 
          bookcity: String(bookStock), 
          total: String(totalStock) 
        },
        dMinus1OrderQty: String(d1OrderQty), 
        todayReqQty: String(todayReq),
        orderUnitQty: '', 
        orderUnitStr: unitStr, 
        orderUnitNum: unitQty, 
        totalOrderQty: '', 
        totalOrderAmount: ''
      };
    });

    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', 
        supplierCode: '', supplierName: '', supplierItemName: '', status: '', purchaseType: '',
        orderStandardPrice: '', currentPrice: '', recentOrderDate: '', centerOrderYn: '', 
        sales4W: { off: '', on: '', domae: '', total: '' }, stock: { paju: '', store: '', bookcity: '', total: '' },
        dMinus1OrderQty: '', todayReqQty: '',
        orderUnitQty: '', orderUnitStr: '', orderUnitNum: 1, totalOrderQty: '', totalOrderAmount: ''
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    setData(displayData);
    setSelectedRows([]);
  };

  const handleSearchReset = () => {
    setProductType('stationery'); setSupplierCode(''); setSupplierName('');
    setSupplierItemCode(''); setSupplierItemName(''); setProductCode(''); setProductName('');
    setSalesDateStart(''); setSalesDateEnd(''); setReceiveLocation('파주센터');
    setCenterOrderYn('all'); setSelectedStatuses(['all']);
    setData(createEmptyRows());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(data.filter(item => item.productCode !== '').map(item => item.uniqueId));
    else setSelectedRows([]);
  };

  const handleSelectRow = (uniqueId: string, checked: boolean) => {
    if (checked) setSelectedRows(prev => [...prev, uniqueId]);
    else setSelectedRows(prev => prev.filter(rowId => rowId !== uniqueId));
  };

  const handleUpdateOrderQty = (uniqueId: string, val: string) => {
    const numVal = val.replace(/[^0-9]/g, '');
    setData(prev => prev.map(item => {
        if (item.uniqueId === uniqueId) {
            const qty = Number(numVal) || 0;
            const unitNum = item.orderUnitNum || 1;
            const price = Number(item.orderStandardPrice) || 0;
            const totalQty = qty * unitNum;
            const totalAmt = totalQty * price;
            return {
                ...item, orderUnitQty: numVal,
                totalOrderQty: numVal ? String(totalQty) : '', totalOrderAmount: numVal ? String(totalAmt) : ''
            };
        }
        return item;
    }));
  };

  const handleDeleteRow = () => {
    if (selectedRows.length === 0) return alert('선택된 항목이 없습니다.');
    let remainingData = data.filter(item => !selectedRows.includes(item.uniqueId) || item.productCode === '');
    if (remainingData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - remainingData.length }, (_, i) => ({
        uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', 
        supplierCode: '', supplierName: '', supplierItemName: '', status: '', purchaseType: '',
        orderStandardPrice: '', currentPrice: '', recentOrderDate: '', centerOrderYn: '', 
        sales4W: { off: '', on: '', domae: '', total: '' }, stock: { paju: '', store: '', bookcity: '', total: '' },
        dMinus1OrderQty: '', todayReqQty: '',
        orderUnitQty: '', orderUnitStr: '', orderUnitNum: 1, totalOrderQty: '', totalOrderAmount: ''
      }));
      remainingData = [...remainingData, ...emptyPadding];
    }
    setData(remainingData);
    setSelectedRows([]);
  };

  const handleSave = () => {
    const changedItems = data.filter(item => item.productCode !== '' && item.orderUnitQty !== '');
    if (changedItems.length === 0) return alert('저장할 발주 내역이 없습니다.\n발주수량을 확인 해 주세요.');
    alert(`${changedItems.length}건의 발주가 등록되었습니다.`);
  };

  const applyUploadData = (newItems: any[], clearExisting: boolean) => {
    let baseData = clearExisting ? [] : data.filter(d => d.productCode !== '');
    let displayData = [...baseData, ...newItems];
    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        uniqueId: `padding-${Date.now()}-${i}`, productCode: '', productName: '', productNo: '', 
        supplierCode: '', supplierName: '', supplierItemName: '', status: '', purchaseType: '',
        orderStandardPrice: '', currentPrice: '', recentOrderDate: '', centerOrderYn: '', 
        sales4W: { off: '', on: '', domae: '', total: '' }, stock: { paju: '', store: '', bookcity: '', total: '' },
        dMinus1OrderQty: '', todayReqQty: '',
        orderUnitQty: '', orderUnitStr: '', orderUnitNum: 1, totalOrderQty: '', totalOrderAmount: ''
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    setData(displayData);
    setSelectedRows([]);
    setPendingUploadData([]);
    setUploadModalOpen(false);
    alert(`${newItems.length}건의 발주 정보가 업로드 되었습니다.`);
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
          uploadedItems.push({
            ...foundProduct, 
            uniqueId: `upload-${Date.now()}-${i}`,
            productNo: safeText(foundProduct.orderNo),
            status: safeText(foundProduct.productStatus),
            orderStandardPrice: safeText(foundProduct.fobPrice) || '0',
            currentPrice: safeText(foundProduct.listPrice) || '0',
            orderUnitQty: row[1] ? String(row[1]).replace(/[^0-9]/g, '') : '',
            orderUnitStr: 'EA(1)', orderUnitNum: 1, centerOrderYn: safeText(foundProduct.centerOrderYn) || 'N'
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
    const ws = XLSX.utils.json_to_sheet(validData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "문구추가발주");
    XLSX.writeFile(wb, "문구추가발주의뢰.xlsx");
  };

  const actualDataCount = data.filter(item => item.productCode !== '').length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">문구 추가발주의뢰</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[110px_1fr_110px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 gap-4 border-r border-gray-200">
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked readOnly /> 문구</label>
             </div>
             <Label className="border-r border-gray-200">판매일자</Label>
             <div className="flex items-center p-1 gap-1">
                 <DateRangeInput startVal={salesDateStart} endVal={salesDateEnd} onStartChange={setSalesDateStart} onEndChange={setSalesDateEnd} />
             </div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             <Label className="border-r border-gray-200">입하처</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={receiveLocation} onValueChange={setReceiveLocation}>
                    <SelectTrigger className="h-6 w-[150px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="파주센터">파주센터</SelectItem><SelectItem value="북시티">북시티</SelectItem></SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">상품상태</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <div className="h-6 w-[200px] border border-gray-300 rounded-[2px] bg-white flex items-center justify-between px-2 cursor-pointer text-[11px] text-gray-700" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                   <span>{getStatusDisplayText()}</span><span className="text-[8px] transform scale-x-150">▼</span>
                 </div>
                 {isStatusDropdownOpen && (
                    <div className="absolute top-7 left-1 w-[200px] bg-white border border-gray-300 shadow-lg z-50 p-2 flex flex-col gap-1 max-h-[200px] overflow-auto">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-1 py-0.5"><Checkbox checked={selectedStatuses.includes('all')} onCheckedChange={() => handleStatusToggle('all')} /> <span className="text-[11px]">전체</span></label>
                      {displayStatuses.map(s => (<label key={s.code} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-1 py-0.5"><Checkbox checked={selectedStatuses.includes(s.name)} onCheckedChange={() => handleStatusToggle(s.name)} /> <span className="text-[11px]">{s.name}</span></label>))}
                    </div>
                 )}
                 {isStatusDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)}></div>}
             </div>
             <Label className="border-r border-gray-200">센터발주여부</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={centerOrderYn} onValueChange={setCenterOrderYn}>
                    <SelectTrigger className="h-6 w-[150px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1.5fr]">
             <Label className="border-r border-gray-200" required>매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsSupplierModalOpen(true)} />
                 </div>
             </div>
             <Label className="border-r border-gray-200">매입처품목</Label>
             <div className="flex items-center p-1 gap-1">
                 <div className="flex items-center flex-1">
                    <Input className={cn("h-6 w-16 text-[11px] rounded-[2px] border-gray-300 mr-1", !supplierCode.trim() && "bg-gray-100 cursor-not-allowed")} placeholder="매입처품목코드" value={supplierItemCode} onChange={(e) => setSupplierItemCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemCodeSearch(); }} disabled={!supplierCode.trim()} />
                    <div className="flex-1 relative flex items-center">
                        <Input className={cn("h-6 w-full text-[11px] rounded-[2px] border-gray-300 pr-6", !supplierCode.trim() ? "bg-gray-100 cursor-not-allowed" : "bg-[#fefefe]")} placeholder="매입처품목명" value={supplierItemName} onChange={(e) => setSupplierItemName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSupplierItemNameSearch(); }} disabled={!supplierCode.trim()} />
                        <Search className={cn("absolute right-1.5 h-3.5 w-3.5", supplierCode.trim() ? "text-gray-400 cursor-pointer hover:text-gray-800" : "text-gray-300 cursor-not-allowed")} onClick={() => { if (supplierCode.trim()) setIsSupplierItemModalOpen(true); }} />
                    </div>
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
      <div className="erp-section-toolbar">
          <span className="erp-section-title">발주의뢰</span>
          <div className="flex gap-1">
             <Button variant="outline" className={actionBtnClass} onClick={() => {}}>엑셀양식</Button>
             <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>엑셀업로드(F2)</Button>
             <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운(F1)</Button>
             <Button variant="outline" className={actionRedBtnClass} onClick={handleDeleteRow}>삭제</Button>
             <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장</Button>
          </div>
      </div>

      <div className="flex-1 border border-gray-300 bg-white flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[2000px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-30 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow><TableHead rowSpan={2} className="w-[40px] text-center border-r border-b border-gray-300 p-0 font-bold text-gray-900">NO</TableHead><TableHead rowSpan={2} className="w-[40px] text-center border-r border-b border-gray-300 p-0"><Checkbox checked={selectedRows.length === data.filter(d=>d.productCode).length && data.filter(d=>d.productCode).length > 0} onCheckedChange={(c) => handleSelectAll(!!c)} /></TableHead><TableHead rowSpan={2} className="w-[110px] text-center border-r border-b border-gray-300 p-1 font-bold">상품코드</TableHead><TableHead rowSpan={2} className="w-[180px] text-center border-r border-b border-gray-300 p-1 font-bold">상품명</TableHead><TableHead rowSpan={2} className="w-[100px] text-center border-r border-b border-gray-300 p-1 font-bold">제품번호</TableHead><TableHead rowSpan={2} className="w-[140px] text-center border-r border-b border-gray-300 p-1 font-bold">매입처(명)</TableHead><TableHead rowSpan={2} className="w-[100px] text-center border-r border-b border-gray-300 p-1 font-bold">매입처품목</TableHead><TableHead rowSpan={2} className="w-[70px] text-center border-r border-b border-gray-300 p-1 font-bold">상품상태</TableHead><TableHead rowSpan={2} className="w-[90px] text-center border-r border-b border-gray-300 p-1 font-bold">발주기준단가</TableHead><TableHead rowSpan={2} className="w-[80px] text-center border-r border-b border-gray-300 p-1 font-bold">정가</TableHead><TableHead rowSpan={2} className="w-[80px] text-center border-r border-b border-gray-300 p-1 font-bold text-center">최근<br/>발주일자</TableHead><TableHead rowSpan={2} className="w-[60px] text-center border-r border-b border-gray-300 p-1 font-bold text-center">센터<br/>발주</TableHead><TableHead colSpan={4} className="text-center border-r border-b border-gray-300 p-1 font-bold">4주판매량</TableHead><TableHead colSpan={4} className="text-center border-r border-b border-gray-300 p-1 font-bold">현재고</TableHead><TableHead rowSpan={2} className="w-[80px] text-center border-r border-b border-gray-300 p-1 font-bold">D-1일<br/>발주수량</TableHead><TableHead rowSpan={2} className="w-[80px] text-center border-r border-b border-gray-300 p-1 font-bold">당일<br/>의뢰수량</TableHead><TableHead colSpan={4} className="text-center border-b border-gray-300 p-1 font-bold">구매발주의뢰수량</TableHead></TableRow>
                    <TableRow><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">OFF</TableHead><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">ON</TableHead><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">도매</TableHead><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">합계</TableHead><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">파주센터<br/>(부곡리)</TableHead><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">점포</TableHead><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">북시티</TableHead><TableHead className="w-[60px] text-center border-r border-gray-300 p-1 font-bold">합계</TableHead><TableHead className="w-[80px] text-center border-r border-gray-300 p-1 font-bold bg-yellow-400">물류사용단위<br/>발주량</TableHead><TableHead className="w-[100px] text-center border-r border-gray-300 p-1 font-bold">물류사용단위</TableHead><TableHead className="w-[90px] text-center border-r border-gray-300 p-1 font-bold">총발주수량<br/>(EA)</TableHead><TableHead className="w-[100px] text-center font-bold p-1">총발주금액</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, idx) => (
                      <TableRow key={row.uniqueId} className="h-8 hover:bg-blue-50/50 border-b border-gray-200 bg-white">
                          <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.productCode ? idx + 1 : ''}</TableCell>
                          <TableCell className="text-center p-0 border-r border-gray-200">{row.productCode && <Checkbox checked={selectedRows.includes(row.uniqueId)} onCheckedChange={(c) => handleSelectRow(row.uniqueId, !!c)} />}</TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.productCode}</TableCell>
                          <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate" title={row.productName}>{row.productName}</TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.productCode ? row.productNo || '-' : ''}</TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplierName}</TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplierItemName}</TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.status}</TableCell>
                          <TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.orderStandardPrice ? Number(row.orderStandardPrice).toLocaleString() : ''}</TableCell>
                          <TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-gray-800">{row.currentPrice ? Number(row.currentPrice).toLocaleString() : ''}</TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.recentOrderDate}</TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-gray-600">{row.centerOrderYn}</TableCell>
                          <TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.sales4W?.off}</TableCell><TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.sales4W?.on}</TableCell><TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.sales4W?.domae}</TableCell><TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-gray-800 bg-gray-50">{row.sales4W?.total}</TableCell>
                          <TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.stock?.paju}</TableCell><TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.stock?.store}</TableCell><TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.stock?.bookcity}</TableCell><TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-gray-800 bg-gray-50">{row.stock?.total}</TableCell>
                          <TableCell className="text-right p-1 border-r border-gray-200 pr-2 text-gray-600">{row.dMinus1OrderQty}</TableCell><TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-gray-600">{row.todayReqQty}</TableCell>
                          <TableCell className={cn("p-0 border-r border-gray-200", row.centerOrderYn === 'N' ? "bg-gray-200" : "bg-yellow-50/30")}>
                              {row.productCode && (<Input className="h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-1 bg-transparent text-[11px] font-bold" value={row.orderUnitQty} disabled={row.centerOrderYn === 'N'} onChange={(e) => handleUpdateOrderQty(row.uniqueId, e.target.value)} />)}
                          </TableCell>
                          <TableCell className="text-center p-1 border-r border-gray-200">{row.productCode ? row.orderUnitStr : ''}</TableCell>
                          <TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold bg-gray-50">{row.totalOrderQty ? Number(row.totalOrderQty).toLocaleString() : ''}</TableCell>
                          <TableCell className="text-right p-1 pr-2 font-bold bg-gray-50">{row.totalOrderAmount ? Number(row.totalOrderAmount).toLocaleString() : ''}</TableCell>
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
             <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" /><h3 className="text-[15px] font-bold text-gray-900 mb-2">중복 상품코드 발생</h3><p className="text-[12px] text-gray-600 text-center mb-6 leading-relaxed">동일 상품코드가 존재합니다.<br/>내역을 초기화하고 업로드를 진행하시겠습니까?</p>
             <div className="flex flex-col gap-2 w-full"><Button className="w-full erp-btn-action h-8" onClick={handleUploadOverwrite}>초기화 후 업로드</Button><Button className="w-full erp-btn-header h-8" onClick={handleUploadExcludeDuplicates}>중복코드 제외하고 업로드</Button><Button variant="outline" className="w-full text-[12px] h-8 mt-2 font-bold" onClick={() => setUploadModalOpen(false)}>취소</Button></div>
          </div>
        </div>
      )}

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName} onSelect={(item) => { setProductCode(item.productCode); setProductName(item.productName); }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={supplierName} allowedCodes={STATIONERY_SUPPLIERS} onSelect={(item) => { setSupplierCode(item.code); setSupplierName(item.name); setSupplierItemCode(''); setSupplierItemName(''); }} />
      <SupplierItemSearchModal isOpen={isSupplierItemModalOpen} onClose={() => setIsSupplierItemModalOpen(false)} supplierCode={supplierCode} initialSearchName={supplierItemName} onSelect={(item) => { setSupplierItemCode(String(item.itemCode).padStart(3, '0')); setSupplierItemName(item.itemName); }} />
    </div>
  );
}