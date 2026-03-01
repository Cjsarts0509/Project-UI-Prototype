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
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';
import { MediaSearchModal, MEDIA_CODES } from '../components/MediaSearchModal';

const ALLOWED_STATUS_NAMES = ['정상', '절판', '품절', '판매금지', '일시품절', '예약판매'];

// 공통 필터 규칙
const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];
const STATIONERY_SUPPLIERS = ['0800448', '0803124', '0800586', '0800618', '0800666', '0803833', '0811137', '0815165', '0817037'];
const OVERSEAS_SUPPLIERS = ['0900216', '0900224', '0900252'];

// ★ 차수 ↔ 매입처 매핑 하드코딩 데이터
const ALBUM_BATCH_MAPPING = [
  { batch: '1차', supplierCode: '01B0470' },
  { batch: '1차', supplierCode: '01B0478' },
  { batch: '1차', supplierCode: '01B0479' },
  { batch: '2차', supplierCode: '01B0504' },
  { batch: '2차', supplierCode: '01B0509' },
  { batch: 'free', supplierCode: '01B0510' },
  { batch: 'free', supplierCode: '01B0521' }
];

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
  id: `empty-${Date.now()}-${index}`, productCode: '', productNo: '', artist: '', productName: '', label: '', supplier: '', status: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', originalPrice: '', noReturnYn: '', releaseDate: '', recentOrderDate: '', recentInDate: '', _original: {} 
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

const getDummyStoreDetails = (pCode: string) => {
  if (!pCode) return [];
  if (pCode.endsWith('28438')) {
      return [
        { id: 'sum', storeName: '총합계', salesQty: 500, stockQty: 23, addReqQty: '', custReqQty: 30, orderQty: 60, totalQty: 90 },
        { id: 's1', storeName: '광화문', salesQty: 250, stockQty: 5, addReqQty: '', custReqQty: 20, orderQty: 20, totalQty: 40 },
        { id: 's2', storeName: '북시티', salesQty: 150, stockQty: 10, addReqQty: '', custReqQty: 10, orderQty: 20, totalQty: 30 },
        { id: 's3', storeName: '파주본점', salesQty: 100, stockQty: 8, addReqQty: '', custReqQty: 0, orderQty: 20, totalQty: 20 },
      ];
  } else if (pCode.endsWith('05592')) {
      return [
        { id: 'sum', storeName: '총합계', salesQty: 300, stockQty: 12, addReqQty: '', custReqQty: 10, orderQty: 40, totalQty: 50 },
        { id: 's4', storeName: '강남점', salesQty: 150, stockQty: 2, addReqQty: '', custReqQty: 5, orderQty: 20, totalQty: 25 },
        { id: 's5', storeName: '잠실점', salesQty: 100, stockQty: 5, addReqQty: '', custReqQty: 5, orderQty: 10, totalQty: 15 },
        { id: 's6', storeName: '영등포점', salesQty: 50, stockQty: 5, addReqQty: '', custReqQty: 0, orderQty: 10, totalQty: 10 },
      ];
  } else {
      return [
        { id: 'sum', storeName: '총합계', salesQty: 150, stockQty: 50, addReqQty: '', custReqQty: 0, orderQty: 0, totalQty: 0 },
        { id: 's7', storeName: '부산점', salesQty: 80, stockQty: 20, addReqQty: '', custReqQty: 0, orderQty: 0, totalQty: 0 },
        { id: 's8', storeName: '대구점', salesQty: 70, stockQty: 30, addReqQty: '', custReqQty: 0, orderQty: 0, totalQty: 0 },
      ];
  }
};

export default function AlbumOrderPage() {
  const { products, statuses, categories, suppliers, supplierItems = [] } = useMockData();

  const [productType, setProductType] = useState('album');
  const [receiveLocation, setReceiveLocation] = useState('파주센터');
  const [orderDegree, setOrderDegree] = useState('all');
  const [salesDateStart, setSalesDateStart] = useState('');
  const [salesDateEnd, setSalesDateEnd] = useState('');
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState(''); 
  const [category, setCategory] = useState('all');
  
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierItemCode, setSupplierItemCode] = useState('');
  const [supplierItemName, setSupplierItemName] = useState('');

  const [mediaCode, setMediaCode] = useState('');
  const [mediaName, setMediaName] = useState('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(['all']);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  const [data, setData] = useState<any[]>(createEmptyRows());
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [storeDetails, setStoreDetails] = useState<any[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false); 
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<any[]>([]);

  const displayStatuses = (statuses || []).filter(s => ALLOWED_STATUS_NAMES.includes(s.name));

  // ★ 선택된 차수에 따라 보여질 매입처 목록 필터링
  const filteredSuppliers = (suppliers || []).filter(s => {
      if (!ALBUM_SUPPLIERS.includes(s.code)) return false;
      if (orderDegree !== 'all') {
          const matchedCodes = ALBUM_BATCH_MAPPING.filter(b => b.batch === orderDegree).map(b => b.supplierCode);
          if (!matchedCodes.includes(s.code)) return false;
      }
      return true;
  });

  const handleSearchReset = () => {
    setProductType('album'); setReceiveLocation('파주센터'); setOrderDegree('all');
    setSalesDateStart(''); setSalesDateEnd(''); setProductCode(''); setProductName('');
    setMediaCode(''); setMediaName(''); setSelectedSuppliers(['all']); setCategory('all');
    setSupplierCode(''); setSupplierName(''); setSupplierItemCode(''); setSupplierItemName('');
    setData(createEmptyRows()); setSelectedRowId(null); setSelectedRows([]); setIsConfirmed(false); setStoreDetails([]);
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
            id: `padding-${Date.now()}-${i}`, productCode: '', productNo: '', artist: '', productName: '', label: '', supplier: '', status: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', originalPrice: '', noReturnYn: '', releaseDate: '', recentOrderDate: '', recentInDate: '', _original: {} 
         }));
         remainingData = [...remainingData, ...emptyPadding];
      }
      
      setData(remainingData);
      setSelectedRows([]);
      setSelectedRowId(null);
      setStoreDetails([]);
  };

  const handleSupplierToggle = (code: string) => {
    if (code === 'all') { setSelectedSuppliers(['all']); } 
    else {
      let newSups = selectedSuppliers.filter(s => s !== 'all');
      if (newSups.includes(code)) newSups = newSups.filter(s => s !== code);
      else newSups.push(code);
      if (newSups.length === 0) newSups = ['all'];
      setSelectedSuppliers(newSups);
    }
  };

  // ★ 차수 변경 시 매입처 선택 상태 리셋
  const handleOrderDegreeChange = (val: string) => {
      setOrderDegree(val);
      setSelectedSuppliers(['all']);
  };

  const getSupplierDisplayText = () => {
    if (selectedSuppliers.length === 0) return '선택 없음';
    if (selectedSuppliers.includes('all')) return '전체 선택';
    return `${selectedSuppliers.length}개 선택`;
  };

  const handleProductCodeSearch = () => {
    if (!productCode.trim()) { setIsProductModalOpen(true); return; }
    const numCode = productCode.replace(/[^0-9]/g, ''); setProductCode(numCode);
    const exactMatches = products.filter(p => safeText(p.productCode) === numCode);
    if (exactMatches.length === 1) setProductName(safeText(exactMatches[0].productName));
    else setIsProductModalOpen(true);
  };

  const handleProductNameSearch = () => {
    if (!productName.trim()) { setIsProductModalOpen(true); return; }
    const exactMatches = products.filter(p => safeText(p.productName).includes(productName.trim()));
    if (exactMatches.length === 1) { setProductCode(safeText(exactMatches[0].productCode)); setProductName(safeText(exactMatches[0].productName)); } 
    else { setIsProductModalOpen(true); }
  };

  const handleMediaCodeSearch = () => {
    if (!mediaCode.trim()) { setIsMediaModalOpen(true); return; }
    const exactMatches = MEDIA_CODES.filter(m => m.code === mediaCode.trim());
    if (exactMatches.length === 1) { setMediaName(exactMatches[0].name); } 
    else { setIsMediaModalOpen(true); }
  };

  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.code === supplierCode.trim());
    if (exactMatches.length === 1) { setSupplierName(exactMatches[0].name); setSupplierItemCode(''); setSupplierItemName(''); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => s.name === supplierName.trim());
    if (exactMatches.length === 1) { setSupplierCode(exactMatches[0].code); setSupplierName(exactMatches[0].name); setSupplierItemCode(''); setSupplierItemName(''); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSearch = () => {
    const filtered = (products || []).filter(item => {
        if (productCode && !safeText(item.productCode).includes(productCode.replace(/[^0-9]/g, ''))) return false;
        if (productName && !safeText(item.productName).includes(productName)) return false;
        if (supplierCode && !safeText(item.supplierCode).includes(supplierCode)) return false;
        
        const suppCode = safeText(item.supplierCode);
        
        // ★ 차수에 매핑된 매입처만 필터링 통과
        if (productType === 'album' && !ALBUM_SUPPLIERS.includes(suppCode)) return false;
        if (orderDegree !== 'all') {
            const matchedCodes = ALBUM_BATCH_MAPPING.filter(b => b.batch === orderDegree).map(b => b.supplierCode);
            if (!matchedCodes.includes(suppCode)) return false;
        }

        // 매입처 멀티체크 필터
        if (!selectedSuppliers.includes('all')) {
            if (!selectedSuppliers.includes(suppCode)) return false;
        }

        if (mediaName && safeText(item.media) !== mediaName) return false;
        if (mediaCode && !mediaName) {
            const matchedMedia = MEDIA_CODES.find(m => m.code === mediaCode);
            if (matchedMedia && safeText(item.media) !== matchedMedia.name) return false;
        }

        if (category !== 'all') {
            if (safeText(item.productCategory) !== category) return false;
        }

        const itemRelDate = parseExcelDate(item.releaseDate);
        if (itemRelDate) {
            if (salesDateStart && itemRelDate < salesDateStart) return false;
            if (salesDateEnd && itemRelDate > salesDateEnd) return false;
        } else {
            if (salesDateStart || salesDateEnd) return false;
        }

        return true;
    });

    let displayData = filtered.map((item, idx) => {
      return {
        ...item, 
        id: `data-${Date.now()}-${idx}`,
        productNo: safeText(item.orderNo),
        artist: safeText(item.artistName),
        label: safeText(item.labelName),
        supplier: safeText(item.supplierName),
        status: safeText(item.productStatus),
        orderStandardPrice: '', 
        purchaseRate: '', 
        currentPrice: safeText(item.listPrice) || '0', 
        originalPrice: safeText(item.initialReleasePrice) || '0', 
        noReturnYn: 'N', 
        releaseDate: parseExcelDate(item.releaseDate), 
        recentOrderDate: '', 
        recentInDate: '', 
        _original: { orderStandardPrice: safeText(item.fobPrice), currentPrice: safeText(item.listPrice) }
      };
    });

    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        id: `padding-${Date.now()}-${i}`, productCode: '', productNo: '', artist: '', productName: '', label: '', supplier: '', status: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', originalPrice: '', noReturnYn: '', releaseDate: '', recentOrderDate: '', recentInDate: '', _original: {} 
      }));
      displayData = [...displayData, ...emptyPadding];
    }
    
    setData(displayData);
    
    const firstId = displayData[0]?.productCode ? displayData[0].id : null;
    setSelectedRowId(firstId); 
    setSelectedRows([]);
    setStoreDetails(firstId ? getDummyStoreDetails(displayData[0].productCode) : []);
    setIsConfirmed(false);
  };

  const handleRowClick = (id: string, pCode: string) => {
    if (!pCode) return;
    setSelectedRowId(id);
    setStoreDetails(getDummyStoreDetails(pCode));
    setIsConfirmed(false); 
  };

  const handleUpdateOrderStandardPrice = (id: string, val: string) => {
    const numVal = val.replace(/[^0-9]/g, '');
    setData(prev => prev.map(item => {
        if (item.id === id) {
            const curP = Number(item.currentPrice) || 0;
            const pr = (curP && numVal) ? ((Number(numVal) / curP) * 100).toFixed(2) : '';
            return { ...item, orderStandardPrice: numVal, purchaseRate: pr };
        }
        return item;
    }));
  };

  const applyOrderStandard = () => {
    if (selectedRows.length === 0) return alert("발주기준을 적용할 상품을 체크해주세요.");
    setData(prev => prev.map(item => {
      if (selectedRows.includes(item.id) && item.productCode) {
        const oPrice = item.originalPrice || ''; 
        const cPrice = item.currentPrice || '';
        const pr = (cPrice && oPrice && Number(cPrice) !== 0) ? ((Number(oPrice) / Number(cPrice)) * 100).toFixed(2) : '';
        return { ...item, orderStandardPrice: oPrice, purchaseRate: pr };
      }
      return item;
    }));
  };

  const handleTotalAddReqInput = (val: string) => {
    const rawVal = val.replace(/[^0-9]/g, '');
    const totalInput = rawVal === '' ? 0 : Number(rawVal);
    
    setStoreDetails(prev => {
        const sumRow = prev.find(s => s.id === 'sum');
        if (!sumRow) return prev;
        const distributableSales = sumRow.salesQty; 
        if (distributableSales === 0) return prev;
        
        let newDetails = prev.map(store => {
            if (store.id === 'sum') {
                return { ...store, addReqQty: rawVal, totalQty: totalInput + store.custReqQty + (Number(store.orderQty)||0) };
            }
            const ratio = store.salesQty / distributableSales;
            const calcQty = Math.round(totalInput * ratio);
            return { ...store, addReqQty: calcQty === 0 ? '' : String(calcQty), totalQty: calcQty + store.custReqQty + (Number(store.orderQty)||0) };
        });

        const allocatedSum = newDetails.filter(s => s.id !== 'sum').reduce((acc, cur) => acc + (Number(cur.addReqQty)||0), 0);
        if (allocatedSum !== totalInput && newDetails.length > 1) {
           const diff = totalInput - allocatedSum;
           const targetStore = newDetails[1]; 
           const adjQty = (Number(targetStore.addReqQty) || 0) + diff;
           targetStore.addReqQty = adjQty === 0 ? '' : String(adjQty);
           targetStore.totalQty = Math.max(0, adjQty) + targetStore.custReqQty + (Number(targetStore.orderQty)||0);
        }
        return newDetails;
    });
  };

  const handleSingleStoreAddReqInput = (id: string, val: string) => {
    const rawVal = val.replace(/[^0-9]/g, '');
    const qty = rawVal === '' ? 0 : Number(rawVal);
    
    setStoreDetails(prev => {
        const updated = prev.map(store => {
            if (store.id === id) return { ...store, addReqQty: rawVal, totalQty: qty + store.custReqQty + (Number(store.orderQty)||0) };
            return store;
        });
        const newTotalAddReq = updated.filter(s => s.id !== 'sum').reduce((acc, cur) => acc + (Number(cur.addReqQty)||0), 0);
        const sumCustReq = updated.find(s => s.id === 'sum')?.custReqQty || 0;
        const sumOrderQty = Number(updated.find(s => s.id === 'sum')?.orderQty) || 0;
        
        return updated.map(store => store.id === 'sum' ? { 
            ...store, 
            addReqQty: newTotalAddReq === 0 ? '' : String(newTotalAddReq), 
            totalQty: newTotalAddReq + sumCustReq + sumOrderQty 
        } : store);
    });
  };

  const confirmStoreOrder = () => {
    setIsConfirmed(true);
    alert("추가 발주의뢰 수량이 확정되어 입력이 잠금 처리되었습니다.");
  };

  const handleSave = () => {
    alert("발주가 저장 및 의뢰 생성되었습니다.");
  };

  const applyUploadData = (newItems: any[], clearExisting: boolean) => {
    let baseData = clearExisting ? [] : data.filter(d => d.productCode !== '');
    let displayData = [...baseData, ...newItems];
    
    if (displayData.length < 10) {
      const emptyPadding = Array.from({ length: 10 - displayData.length }, (_, i) => ({
        id: `padding-${Date.now()}-${i}`, productCode: '', productNo: '', artist: '', productName: '', label: '', supplier: '', status: '', orderStandardPrice: '', purchaseRate: '', currentPrice: '', originalPrice: '', noReturnYn: '', releaseDate: '', recentOrderDate: '', recentInDate: '', _original: {} 
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
          uploadedItems.push({
            ...foundProduct, 
            id: `upload-${Date.now()}-${i}`, 
            productNo: safeText(foundProduct.orderNo),
            artist: safeText(foundProduct.artistName),
            label: safeText(foundProduct.labelName),
            supplier: safeText(foundProduct.supplierName),
            status: safeText(foundProduct.productStatus),
            orderStandardPrice: '', 
            purchaseRate: '', 
            currentPrice: safeText(foundProduct.listPrice) || '0', 
            originalPrice: safeText(foundProduct.initialReleasePrice) || '0', 
            noReturnYn: 'N', 
            releaseDate: parseExcelDate(foundProduct.releaseDate), 
            recentOrderDate: '', 
            recentInDate: '', 
            _original: { orderStandardPrice: safeText(foundProduct.fobPrice), currentPrice: safeText(foundProduct.listPrice) }
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
      '상품코드': item.productCode, '제품번호': item.productNo, '가수명': item.artist, '상품명': item.productName,
      '레이블': item.label, '상태': item.status, '발주기준단가': item.orderStandardPrice, '매입율': item.purchaseRate,
      '정가': item.currentPrice, '반품불가': item.noReturnYn, '출시일자': item.releaseDate, '최근발주일자': item.recentOrderDate
    }));
    const ws = XLSX.utils.json_to_sheet(excelExportData);
    ws['!cols'] = [ {wpx:110}, {wpx:100}, {wpx:120}, {wpx:200}, {wpx:120}, {wpx:70}, {wpx:100}, {wpx:60}, {wpx:80}, {wpx:70}, {wpx:90}, {wpx:90} ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "음반추가발주목록");
    XLSX.writeFile(wb, "음반추가발주목록.xlsx");
  };

  const selectedProduct = data.find(d => d.id === selectedRowId) || {};
  const actualDataCount = data.filter(item => item.productCode !== '').length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">음반 추가발주의뢰</h2>
      </div>

      {/* Search filter area */}
      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr] border-b border-gray-200">
             <Label className="border-r border-gray-200" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 gap-4 border-r border-gray-200">
                <label className="flex items-center gap-1 cursor-pointer text-gray-900">
                  <input type="radio" name="productType" value="album" checked={productType === 'album'} onChange={() => setProductType('album')} /> 음반
                </label>
             </div>
             <Label className="border-r border-gray-200"></Label>
             <div className="border-r border-gray-200"></div>
             <Label className="border-r border-gray-200">입하처</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={receiveLocation} onValueChange={setReceiveLocation}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="파주센터">파주센터</SelectItem><SelectItem value="북시티">북시티</SelectItem></SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleProductNameSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             <Label className="border-r border-gray-200">미디어</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="코드" value={mediaCode} onChange={(e) => setMediaCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleMediaCodeSearch(); }} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="명칭" value={mediaName} onChange={(e) => setMediaName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleMediaCodeSearch(); }} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsMediaModalOpen(true)} />
                 </div>
             </div>
             <Label className="border-r border-gray-200">판매일자</Label>
             <div className="flex items-center p-1 gap-1">
                 <DateRangeInput startVal={salesDateStart} endVal={salesDateEnd} onStartChange={setSalesDateStart} onEndChange={setSalesDateEnd} />
             </div>
          </div>

          <div className="grid grid-cols-[110px_1fr_110px_1fr_110px_1fr]">
             <Label className="border-r border-gray-200">차수</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={orderDegree} onValueChange={handleOrderDegreeChange}>
                    <SelectTrigger className="h-6 w-[150px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="1차">1차</SelectItem>
                        <SelectItem value="2차">2차</SelectItem>
                        <SelectItem value="free">free</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200" required>매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <div className="h-6 w-full border border-gray-300 rounded-[2px] bg-white flex items-center justify-between px-2 cursor-pointer text-[11px] text-gray-700" onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}>
                   <span>{getSupplierDisplayText()}</span><span className="text-[8px] transform scale-x-150">▼</span>
                 </div>
                 {isSupplierDropdownOpen && (
                   <div className="absolute top-7 left-1 w-[250px] bg-white border border-gray-300 shadow-lg z-50 p-2 flex flex-col gap-1 max-h-[200px] overflow-auto">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-1 py-0.5">
                          <Checkbox className="h-3.5 w-3.5 rounded-[2px] border-gray-400" checked={selectedSuppliers.includes('all')} onCheckedChange={() => handleSupplierToggle('all')} /> <span className="text-[11px]">전체 선택</span>
                      </label>
                      {/* ★ 필터링된 매입처만 노출되도록 수정 */}
                      {filteredSuppliers.map(s => (
                          <label key={s.code} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-1 py-0.5">
                              <Checkbox className="h-3.5 w-3.5 rounded-[2px] border-gray-400" checked={selectedSuppliers.includes(s.code)} onCheckedChange={() => handleSupplierToggle(s.code)} /> <span className="text-[11px]">{s.name}</span>
                          </label>
                      ))}
                   </div>
                 )}
                 {isSupplierDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsSupplierDropdownOpen(false)}></div>}
             </div>
             <Label className="border-r border-gray-200">분류</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-6 w-[150px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="가요">가요</SelectItem><SelectItem value="POP">POP</SelectItem><SelectItem value="클래식">클래식</SelectItem></SelectContent>
                 </Select>
             </div>
          </div>{/* end grid row 3 */}
      </div>{/* end border div */}
      <div className="erp-search-actions">
          <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
          <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>{/* end erp-search-area */}

      <div className="flex gap-4 flex-1 min-h-0">
          
          <div className="w-[60%] flex flex-col min-h-0">
             <div className="erp-section-group flex-1 min-h-0 flex flex-col">
             <div className="erp-section-toolbar">
                <div className="erp-section-title">발주내역</div>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={applyOrderStandard}>발주기준</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>엑셀업로드(F2)</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownload}>엑셀다운(F1)</Button>
                    <Button variant="outline" className={actionRedBtnClass} onClick={handleDeleteRow}>선택삭제</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleSave}>저장</Button>
                 </div>
             </div>
             <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
              <div className="flex-1 overflow-auto">
                <Table className="table-fixed min-w-[1200px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="h-8">
                            <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">
                                <Checkbox checked={selectedRows.length === actualDataCount && actualDataCount > 0} onCheckedChange={(c) => handleSelectAll(!!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px] bg-white"/>
                            </TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">제품번호</TableHead>
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">가수명</TableHead>
                            <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">레이블</TableHead>
                            <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상태</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-400">발주기준단가</TableHead>
                            <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입율</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">정가</TableHead>
                            <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">반품불가</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">출시일자</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 p-1">최근발주일자</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => {
                            const isSelected = selectedRowId === row.id;
                            return (
                              <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleRowClick(row.id, row.productCode)}>
                                  <TableCell className="text-center p-0 border-r border-gray-200">
                                      {row.productCode && <Checkbox checked={selectedRows.includes(row.id)} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} className="h-3.5 w-3.5 translate-y-[2px] border-gray-400 rounded-[2px]" />}
                                  </TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.productCode}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.productNo}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate">{row.artist}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate font-bold">{row.productName}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate">{row.label}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.status}</TableCell>
                                  
                                  <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                      {row.productCode && (
                                          <Input 
                                              className="h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-2 bg-transparent text-[11px] font-bold text-red-600" 
                                              value={row.orderStandardPrice} 
                                              onChange={(e) => handleUpdateOrderStandardPrice(row.id, e.target.value)} 
                                          />
                                      )}
                                  </TableCell>
                                  
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.purchaseRate}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.currentPrice ? Number(row.currentPrice).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.noReturnYn}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.releaseDate}</TableCell>
                                  <TableCell className="text-center p-1 text-gray-500">{row.recentOrderDate}</TableCell>
                              </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
              </div>
             </div>
          </div>
          </div>

          <div className="w-[40%] flex flex-col min-h-0">
             <div className="erp-section-group flex-1 min-h-0 flex flex-col">
             <div className="erp-section-toolbar">
                <div className="erp-section-title">발주세부영역</div>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={confirmStoreOrder} disabled={isConfirmed || !selectedRowId}>확정</Button>
                 </div>
             </div>
             <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
                <Table className="w-full">
                  <TableHeader className="sticky top-0 bg-[#f4f4f4] z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="text-center font-bold border-r border-gray-300 p-1">구분</TableHead>
                          <TableHead className="text-center font-bold border-r border-gray-300 p-1">판매량</TableHead>
                          <TableHead className="text-center font-bold border-r border-gray-300 p-1">재고</TableHead>
                          <TableHead className="text-center font-bold border-r border-gray-300 p-1 bg-yellow-400 text-[10px]">추가<br/>발주의뢰</TableHead>
                          <TableHead className="text-center font-bold border-r border-gray-300 p-1 text-blue-600 text-[10px]">고객<br/>발주의뢰</TableHead>
                          <TableHead className="text-center font-bold border-r border-gray-300 p-1">발주량</TableHead>
                          <TableHead className="text-center font-bold p-1">총발주량</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {storeDetails.map((store) => (
                        <TableRow key={store.id} className={cn("h-8 border-b border-gray-200", store.id === 'sum' && "bg-blue-50 font-bold")}>
                            <TableCell className="text-center p-1 border-r border-gray-200">{store.storeName}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 pr-3">{store.salesQty}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 pr-3">{store.stockQty}</TableCell>
                            
                            <TableCell className={cn("p-0 border-r border-gray-200", isConfirmed ? "bg-gray-100" : (store.id === 'sum' ? "bg-yellow-200" : "bg-yellow-50"))}>
                                <Input 
                                  className={cn("h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-2 bg-transparent text-[12px] font-bold", isConfirmed && "cursor-not-allowed text-gray-500")} 
                                  value={store.addReqQty} 
                                  disabled={isConfirmed}
                                  onChange={(e) => {
                                      if (store.id === 'sum') {
                                          handleTotalAddReqInput(e.target.value);
                                      } else {
                                          handleSingleStoreAddReqInput(store.id, e.target.value);
                                      }
                                  }}
                                  placeholder={isConfirmed ? '' : '0'}
                                />
                            </TableCell>

                            <TableCell className="text-right p-1 border-r border-gray-200 pr-3 text-blue-600 font-bold">{store.custReqQty}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 pr-3">{store.orderQty}</TableCell>
                            <TableCell className="text-right p-1 pr-3 font-bold text-red-600">{store.totalQty}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
             </div>
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

      <MediaSearchModal isOpen={isMediaModalOpen} onClose={() => setIsMediaModalOpen(false)} initialSearchName={mediaName} onSelect={(item: any) => { setMediaCode(item.code); setMediaName(item.name); }} />

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName} onSelect={(item) => { setProductCode(item.productCode); setProductName(item.productName); }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={supplierName} onSelect={(item) => { setSupplierCode(item.code); setSupplierName(item.name); setSupplierItemCode(''); setSupplierItemName(''); }} />
      <SupplierItemSearchModal isOpen={isSupplierItemModalOpen} onClose={() => setIsSupplierItemModalOpen(false)} supplierCode={supplierCode} initialSearchName={supplierItemName} onSelect={(item) => { setSupplierItemCode(String(item.itemCode).padStart(3, '0')); setSupplierItemName(item.itemName); }} />
    </div>
  );
}