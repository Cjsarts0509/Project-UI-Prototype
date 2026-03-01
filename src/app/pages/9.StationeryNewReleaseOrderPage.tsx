import React, { useState, useRef } from 'react';
import { Calendar, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';
import { format, subWeeks } from 'date-fns';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { EmployeeSearchModal } from '../components/EmployeeSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';

const STATIONERY_SUPPLIERS = ['0800448', '0803124', '0800586', '0800618', '0800666', '0803833', '0811137', '0815165', '0817037'];

const safeText = (val: any) => val && val !== '#' ? val : '';

// 어떠한 포맷의 날짜라도 YYYY-MM-DD로 정확하게 파싱 (시간 무시, 5자리 일련번호 완벽 대응)
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

const extractEa = (val: string) => {
    if (!val) return 1;
    const match = String(val).match(/(\d+)\s*EA/i);
    if (match && match[1]) return parseInt(match[1], 10);
    return 1;
};

const adjustQuantities = (pQty: any, oQty: any, ea: number) => {
    const rawP = Number(pQty) || 0;
    const rawO = Number(oQty) || 0;

    const orderP = Math.round(rawP / ea);
    const adjP = orderP * ea;

    const orderO = Math.ceil(rawO / ea);
    const adjO = orderO * ea;

    const finalOrderQty = (adjP + adjO) / ea;
    return { orderQty: finalOrderQty, adjP, adjO };
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

const SingleDateInput = ({ val, onChange, className, readOnly }: any) => (
  <div className={cn("flex items-center h-full w-full bg-white border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden", className)}>
      <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={val} onChange={(e) => onChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" readOnly={readOnly} />
      <div className="relative w-5 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
          <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
          <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={val.length === 10 ? val : ''} onChange={(e) => onChange(e.target.value)} disabled={readOnly} />
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

export default function StationeryNewReleaseOrderPage() {
  const { products, suppliers, employees = [], supplierItems = [] } = useMockData();

  const [productType, setProductType] = useState('stationery');
  const [expectedInStart, setExpectedInStart] = useState('');
  const [expectedInEnd, setExpectedInEnd] = useState('');
  const [productCode, setProductCode] = useState(''); 
  const [productName, setProductName] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  
  const [supplierItemCode, setSupplierItemCode] = useState('');
  const [supplierItemName, setSupplierItemName] = useState('');

  const [category, setCategory] = useState('all'); 
  const [centerOrderYn, setCenterOrderYn] = useState('all'); 
  
  const [modifierId, setModifierId] = useState('');
  const [modifierName, setModifierName] = useState('');
  const [modDateStart, setModDateStart] = useState(format(subWeeks(new Date(), 1), 'yyyy-MM-dd'));
  const [modDateEnd, setModDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [list1Data, setList1Data] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>({});
  const [uploadData, setUploadData] = useState<any[]>([]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierItemModalOpen, setIsSupplierItemModalOpen] = useState(false);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModifierIdSearch = () => {
      if (!modifierId.trim()) { setIsEmpModalOpen(true); return; }
      const match = employees.find(e => e.empNo === modifierId.trim());
      if (match) setModifierName(match.empName);
      else { setIsEmpModalOpen(true); }
  };

  const handleModifierNameSearch = () => {
      if (!modifierName.trim()) { setIsEmpModalOpen(true); return; }
      const matches = employees.filter(e => e.empName.includes(modifierName.trim()));
      if (matches.length === 1) {
          setModifierId(matches[0].empNo); setModifierName(matches[0].empName);
      } else {
          setIsEmpModalOpen(true);
      }
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

  const handleSupplierCodeSearch = () => {
    if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => STATIONERY_SUPPLIERS.includes(s.code) && s.code === supplierCode.trim());
    if (exactMatches.length === 1) { setSupplierName(exactMatches[0].name); } 
    else { setIsSupplierModalOpen(true); }
  };

  const handleSupplierNameSearch = () => {
    if (!supplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => STATIONERY_SUPPLIERS.includes(s.code) && s.name.includes(supplierName.trim()));
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

  const validateDateRange = () => {
    if (category !== 'all' || modifierId || modifierName) {
      const start = new Date(modDateStart);
      const end = new Date(modDateEnd);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays > 31) {
        alert("조/수정자 지정 시 수정일자는 최대 한 달까지만 조회 가능합니다.");
        return false;
      }
    }
    return true;
  };

  const handleSearch = () => {
    if (!validateDateRange()) return;

    const filtered = (products || []).filter(item => {
        // ★ 1. 신상품 조건: 문구류 특성을 고려하여 출시일자가 없으면 '등록일자'를 사용!
        const dateStr = safeText(item.releaseDate) || safeText(item.registrationDate);
        const targetDate = parseExcelDate(dateStr);
        
        if (!targetDate || targetDate < '2024-01-01' || targetDate > '2024-12-31') return false;

        // 2. 조(분류) 화면 필터
        if (category !== 'all') {
            const pCat = safeText(item.productCategory);
            const gCat = safeText(item.groupCategory);
            if (pCat !== category && gCat !== category) return false;
        }

        // 3. 상품명 / 매입처 / 센터발주여부 조건 필터
        const suppCode = safeText(item.supplierCode);
        if (productCode && !safeText(item.productCode).includes(productCode.replace(/[^0-9]/g, ''))) return false;
        if (supplierCode && suppCode !== supplierCode) return false;
        if (centerOrderYn !== 'all' && safeText(item.centerOrderYn) !== centerOrderYn) return false;

        // 4. 수정자 필터
        if (modifierName && !safeText(item.registrant).includes(modifierName)) return false;

        // ★ STATIONERY_SUPPLIERS 하드코딩 필터는 제거했습니다. (더미 데이터 유연성 확보)
        return true;
    });

    const newList = filtered.map((item, idx) => ({
      id: `data-${Date.now()}-${idx}`,
      productCode: safeText(item.productCode),
      productName: safeText(item.productName),
      unitQty: '1EA(1EA)', // 임시
      supplier: safeText(item.supplierName),
      productNo: safeText(item.orderNo),
      purchaseType: safeText(item.purchaseType) || '일시',
      centerOrderYn: safeText(item.centerOrderYn) || 'Y',
      orderStandardPrice: safeText(item.initialReleasePrice), // 발주기준 = 최초출고가 적용
      price: safeText(item.listPrice),
      purchaseQty: '',
      onlineQty: '',
      orderQty: '',
      expectedInDate: '',
      expectedReceiveDate: '',
      modifier: safeText(item.registrant) || '12951',
      modTime: parseExcelDate(item.registrationDate) || format(new Date(), 'yyyy-MM-dd'),
      status: safeText(item.productStatus),
      noReturnYn: 'N',
      logisticsUnit: item.logisticsUnit && item.logisticsUnitQty ? `${item.logisticsUnitQty}EA(1${item.logisticsUnit})` : '1EA(1EA)',
      _originalPrice: safeText(item.initialReleasePrice)
    }));

    setList1Data(newList);
    setUploadData([]); 
    if (newList.length > 0) {
      handleRowClick(newList[0]);
    } else {
      setSelectedRowId(null);
      setSelectedProduct({});
    }
  };

  const handleSearchReset = () => {
    setProductCode(''); setProductName(''); setSupplierCode(''); setSupplierName(''); 
    setSupplierItemCode(''); setSupplierItemName('');
    setExpectedInStart(''); setExpectedInEnd('');
    setCategory('all'); setCenterOrderYn('all'); setModifierId(''); setModifierName('');
    setModDateStart(format(subWeeks(new Date(), 1), 'yyyy-MM-dd'));
    setModDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setList1Data([]); setSelectedRowId(null); setSelectedProduct({}); setUploadData([]);
  };

  const handleRowClick = (item: any) => {
    setSelectedRowId(item.id);
    setSelectedProduct({ ...item });
    
    setUploadData([{
      id: `up-${Date.now()}`,
      productCode: item.productCode,
      productName: item.productName,
      logisticsUnit: item.logisticsUnit,
      purchaseQty: item.purchaseQty || '',
      onlineQty: item.onlineQty || '',
      expectedInDate: item.expectedInDate || '',
      centerOrderYn: item.centerOrderYn,
      s_paju: item.s_paju || '', s_book: item.s_book || '', s_gwang: item.s_gwang || '', s_gang: item.s_gang || '', s_jam: item.s_jam || '',
      s_daegu: item.s_daegu || '', s_busan: item.s_busan || '', s_incheon: item.s_incheon || '',
      s_chang: item.s_chang || '', s_mok: item.s_mok || '', s_cheon: item.s_cheon || '', s_dcube: item.s_dcube || ''
    }]);
  };

  const handleProductInfoChange = (field: string, val: string) => {
    const rawVal = field.includes('Qty') || field === 'orderStandardPrice' || field === 'price' ? val.replace(/[^0-9]/g, '') : val;
    setSelectedProduct((prev: any) => {
      const updated = { ...prev, [field]: rawVal };
      if (field === 'expectedInDate') updated.expectedReceiveDate = rawVal;
      return updated;
    });
  };

  const handleDelBugok = () => {
    if (!selectedProduct.productCode) return;
    setSelectedProduct((prev: any) => ({ ...prev, purchaseQty: '' }));
    setUploadData(prev => prev.map(row => {
      if (row.productCode === selectedProduct.productCode) {
        return {
          ...row, purchaseQty: '', s_paju: '', s_gwang: '', s_gang: '', s_jam: '', s_daegu: '', s_busan: '', s_incheon: '', s_chang: '', s_mok: '', s_cheon: '', s_dcube: ''
        };
      }
      return row;
    }));
    alert("구매수량이 임시 삭제되었습니다.\n[등록] 버튼을 누르지 않으면 다른 항목 클릭 후 원복됩니다.");
  };

  const handleDelBookCity = () => {
    if (!selectedProduct.productCode) return;
    setSelectedProduct((prev: any) => ({ ...prev, onlineQty: '' }));
    setUploadData(prev => prev.map(row => {
      if (row.productCode === selectedProduct.productCode) return { ...row, onlineQty: '', s_book: '' };
      return row;
    }));
    alert("온라인수량이 임시 삭제되었습니다.\n[등록] 버튼을 누르지 않으면 다른 항목 클릭 후 원복됩니다.");
  };

  const handleRegisterInfo = () => {
    if (!selectedProduct.productCode) return;
    
    const ea = extractEa(selectedProduct.logisticsUnit);
    const { orderQty, adjP, adjO } = adjustQuantities(selectedProduct.purchaseQty, selectedProduct.onlineQty, ea);
    const isCenterN = selectedProduct.centerOrderYn === 'N';

    setUploadData(prevUpload => {
        const updatedUpload = prevUpload.map(row => {
            if (row.productCode === selectedProduct.productCode) {
                const sumOfflineOthers = ['gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube']
                    .reduce((acc, k) => acc + (Number(row[`s_${k}`]) || 0), 0);
                
                let pajuQty = Number(row.s_paju) || 0;
                if (!isCenterN) {
                    pajuQty = Math.max(0, adjP - sumOfflineOthers);
                }
                
                return {
                    ...row,
                    purchaseQty: adjP === 0 ? '' : String(adjP),
                    onlineQty: adjO === 0 ? '' : String(adjO),
                    expectedInDate: selectedProduct.expectedInDate,
                    s_paju: pajuQty === 0 ? '' : String(pajuQty),
                    s_book: adjO === 0 ? '' : String(adjO) 
                };
            }
            return row;
        });

        // 파주센터/북시티 수량 오버라이드 버그 완벽 수정
        setList1Data(prevList => prevList.map(item => {
            if (item.id === selectedProduct.id) {
                const upRow = updatedUpload.find(u => u.productCode === item.productCode);
                
                let newPaju = '';
                if (upRow !== undefined) newPaju = upRow.s_paju;
                else if (!isCenterN) newPaju = adjP === 0 ? '' : String(adjP);

                let newBook = '';
                if (upRow !== undefined) newBook = upRow.s_book;
                else newBook = adjO === 0 ? '' : String(adjO);

                return {
                    ...item,
                    ...selectedProduct,
                    orderQty: String(orderQty),
                    purchaseQty: String(adjP),
                    onlineQty: String(adjO),
                    s_paju: newPaju, 
                    s_book: newBook, 
                    s_gwang: upRow !== undefined ? upRow.s_gwang : item.s_gwang, 
                    s_gang: upRow !== undefined ? upRow.s_gang : item.s_gang, 
                    s_jam: upRow !== undefined ? upRow.s_jam : item.s_jam, 
                    s_daegu: upRow !== undefined ? upRow.s_daegu : item.s_daegu, 
                    s_busan: upRow !== undefined ? upRow.s_busan : item.s_busan, 
                    s_incheon: upRow !== undefined ? upRow.s_incheon : item.s_incheon, 
                    s_chang: upRow !== undefined ? upRow.s_chang : item.s_chang, 
                    s_mok: upRow !== undefined ? upRow.s_mok : item.s_mok, 
                    s_cheon: upRow !== undefined ? upRow.s_cheon : item.s_cheon, 
                    s_dcube: upRow !== undefined ? upRow.s_dcube : item.s_dcube
                };
            }
            return item;
        }));

        return updatedUpload;
    });

    setSelectedProduct((prev: any) => ({
        ...prev,
        orderQty: String(orderQty),
        purchaseQty: String(adjP),
        onlineQty: String(adjO)
    }));

    if (isCenterN) {
        alert(`물류사용단위(${ea}EA) 기준 베이스업 적용 완료.\n(센터발주 N상품이므로 파주센터 배분은 제외됨)\n상품정보가 신상품 정보 목록에 픽스되었습니다.`);
    } else {
        alert(`물류사용단위(${ea}EA) 기준 베이스업 적용 완료.\n할당되지 않은 구매수량은 '파주센터'로 자동 배분되었습니다.\n상품정보가 신상품 정보 목록에 픽스되었습니다.`);
    }
  };

  const handleCreateOrderSingle = () => alert("현재 신상품 정보 목록에 등록된 정보대로 실시간 발주가 생성되었습니다.");

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["바코드", "구매수량", "온라인수량", "입하예정일", "파주센터", "북시티", "광화문", "강남", "잠실", "대구", "부산", "인천", "창원", "목동", "천안", "디큐브"]]);
    ws['!cols'] = [{ wpx: 120 }, { wpx: 80 }, { wpx: 80 }, { wpx: 100 }, { wpx: 60 }, { wpx: 60 }, { wpx: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "업로드양식");
    XLSX.writeFile(wb, "신상품다건업로드_양식.xlsx");
  };

  const handleApplyOrderStandard = () => {
    setList1Data(prev => prev.map(item => {
      if (item._originalPrice) return { ...item, orderStandardPrice: item._originalPrice };
      return item;
    }));
    if (selectedProduct._originalPrice) {
        setSelectedProduct((p: any) => ({ ...p, orderStandardPrice: p._originalPrice }));
    }
    alert("조회된 목록에 대하여 설정된 발주기준이 덮어씌워졌습니다.");
  };

  const handleExcelDownloadList1 = () => {
    if (list1Data.length === 0) return alert('다운로드할 데이터가 없습니다.');
    const exportData = list1Data.map(item => ({
      '상품코드': item.productCode, '상품명': item.productName, '매입처명': item.supplier, '제품번호': item.productNo,
      '매입구분': item.purchaseType, '센터발주': item.centerOrderYn,
      '발주기준단가': item.orderStandardPrice, '정가': item.price, '상품상태': item.status,
      '발주수량(물류사용단위)': item.orderQty, '물류사용단위': item.logisticsUnit,
      '구매수량(고객판매단위)': item.purchaseQty, '온라인예판수량(고객판매단위)': item.onlineQty,
      '입하예정일': item.expectedInDate, '입고예정일': item.expectedReceiveDate, '처리자': item.modifier, '처리시간': item.modTime
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "신상품정보목록");
    XLSX.writeFile(wb, "문구_신상품_목록조회.xlsx");
  };

  const handleExcelDownloadAll = () => alert("전체 엑셀 다운로드: 점포별 분배수량 병합 로직 수행");

  const updateUploadRow = (id: string, field: string, val: string) => {
    setUploadData(prev => prev.map(row => {
      if (row.id === id) {
        if (field === 's_paju' && row.centerOrderYn === 'N') {
            alert("센터발주운영 N상품입니다. 파주센터 수량을 확인할 수 없습니다.");
            return row;
        }

        const newRow = { ...row, [field]: val };
        const offlineStores = ['paju', 'gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube'];
        
        if (field === 'onlineQty') {
            newRow.s_book = val; 
        } else if (field === 's_book') {
            newRow.onlineQty = val; 
        } else if (field === 'purchaseQty') {
            const numVal = Number(val) || 0;
            const sumOfflineOthers = ['gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube']
              .reduce((acc, k) => acc + (Number(newRow[`s_${k}`]) || 0), 0);
            
            if (row.centerOrderYn !== 'N') {
                const pajuQty = Math.max(0, numVal - sumOfflineOthers);
                newRow.s_paju = pajuQty === 0 ? '' : String(pajuQty);
            }
        } else if (offlineStores.includes(field.replace('s_', ''))) {
            const sumOfflineAll = offlineStores.reduce((acc, k) => acc + (Number(newRow[`s_${k}`]) || 0), 0);
            newRow.purchaseQty = sumOfflineAll === 0 ? '' : String(sumOfflineAll);
        }
        return newRow;
      }
      return row;
    }));
  };

  const handleSaveUploadToProductInfo = () => {
    const validUploads = uploadData.filter(u => u.productCode && !String(u.id).startsWith('empty'));
    if (validUploads.length === 0) return alert("저장할 데이터가 없습니다.");

    if (list1Data.length === 0) {
        const newList = validUploads.map((up, idx) => {
            const ea = extractEa(up.logisticsUnit);
            const { orderQty, adjP, adjO } = adjustQuantities(up.purchaseQty, up.onlineQty, ea);
            
            let pajuQty = Number(up.s_paju) || 0;
            if (up.centerOrderYn !== 'N') {
                const sumOfflineOthers = ['gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube']
                    .reduce((acc, k) => acc + (Number(up[`s_${k}`]) || 0), 0);
                pajuQty = Math.max(0, adjP - sumOfflineOthers);
            }

            return {
                id: `list-up-${Date.now()}-${idx}`,
                productCode: up.productCode, productName: up.productName,
                supplier: up.supplier || '매입처미상', unitQty: up.unitQty || '1EA',
                productNo: up.productNo || '-', purchaseType: '일시', centerOrderYn: up.centerOrderYn || 'Y',
                orderStandardPrice: '', price: up.price || '0', logisticsUnit: up.logisticsUnit,
                orderQty: String(orderQty), purchaseQty: String(adjP), onlineQty: String(adjO),
                expectedInDate: up.expectedInDate, expectedReceiveDate: up.expectedInDate,
                modifier: '12951', modTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
                status: '정상', noReturnYn: 'N', _originalPrice: '3000',
                s_paju: pajuQty === 0 ? '' : String(pajuQty),
                s_book: adjO === 0 ? '' : String(adjO), 
                s_gwang: up.s_gwang, s_gang: up.s_gang, s_jam: up.s_jam, s_daegu: up.s_daegu, s_busan: up.s_busan,
                s_incheon: up.s_incheon, s_chang: up.s_chang, s_mok: up.s_mok, s_cheon: up.s_cheon, s_dcube: up.s_dcube
            };
        });
        
        setList1Data(newList);
        setUploadData(newList.map(item => ({ ...item, id: `up-${Date.now()}-${item.productCode}` })));

        if (newList.length > 0) {
            setSelectedRowId(newList[0].id);
            setSelectedProduct({ ...newList[0] });
        }
        alert("업로드된 데이터가 물류사용단위 베이스업 적용되어 신상품 정보 목록에 신규 등록되었습니다.");
    } else {
        const targetData = validUploads.find(u => u.productCode === selectedProduct.productCode) || validUploads[0];
        if (!targetData) return;

        const ea = extractEa(targetData.logisticsUnit);
        const { orderQty, adjP, adjO } = adjustQuantities(targetData.purchaseQty, targetData.onlineQty, ea);
        const isCenterN = targetData.centerOrderYn === 'N';

        let pajuQty = Number(targetData.s_paju) || 0;
        if (!isCenterN) {
            const sumOfflineOthers = ['gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube']
                .reduce((acc, k) => acc + (Number(targetData[`s_${k}`]) || 0), 0);
            pajuQty = Math.max(0, adjP - sumOfflineOthers);
        }

        const updatedProduct = {
            ...selectedProduct,
            orderQty: String(orderQty),
            purchaseQty: String(adjP),
            onlineQty: String(adjO),
            expectedInDate: targetData.expectedInDate,
            expectedReceiveDate: targetData.expectedInDate,
            s_paju: pajuQty === 0 ? '' : String(pajuQty),
            s_book: adjO === 0 ? '' : String(adjO),
            s_gwang: targetData.s_gwang, s_gang: targetData.s_gang, s_jam: targetData.s_jam, s_daegu: targetData.s_daegu, s_busan: targetData.s_busan,
            s_incheon: targetData.s_incheon, s_chang: targetData.s_chang, s_mok: targetData.s_mok, s_cheon: targetData.s_cheon, s_dcube: targetData.s_dcube
        };
        
        setSelectedProduct(updatedProduct);
        setUploadData(prev => prev.map(row => {
            if (row.productCode === targetData.productCode) {
                return { ...row, purchaseQty: String(adjP), onlineQty: String(adjO), s_paju: pajuQty === 0 ? '' : String(pajuQty), s_book: adjO === 0 ? '' : String(adjO) };
            }
            return row;
        }));

        alert(`물류사용단위(${ea}EA) 기준 베이스업 연산 적용 후 상품정보 영역으로 임시 엎어쳐졌습니다.\n[등록] 버튼을 누르면 최종 픽스됩니다.`);
    }
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

      const newUploadData = [];
      let errCenterN = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (!row[0]) continue;

        const pCode = String(row[0]).trim();
        const expInDate = parseExcelDate(row[3]); 
        
        const foundProduct = products.find(p => p.productCode === pCode) || { productName: '미등록상품', supplier: '', productNo: '', centerOrderYn: 'Y', price: '', logisticsUnit: '1EA' };
        const isCenterN = (foundProduct as any).centerOrderYn === 'N';
        const eaUnit = (foundProduct as any).logisticsUnit || '1EA';
        
        let storeSumOffline = 0;
        for(let j=6; j<=15; j++) {
            storeSumOffline += Number(row[j]) || 0;
        }
        let pajuFromExcel = Number(row[4]) || 0;
        if (isCenterN && pajuFromExcel > 0) {
            errCenterN++;
            pajuFromExcel = 0;
        }
        storeSumOffline += pajuFromExcel;
        
        let pQty = Number(row[1]) || 0;
        let paju = pajuFromExcel;
        
        if (!isCenterN && pQty > storeSumOffline) {
            paju += (pQty - storeSumOffline);
        } else if (storeSumOffline > 0) {
            pQty = storeSumOffline;
        }

        let oQty = Number(row[2]) || 0;
        let bookCity = Number(row[5]) || 0;
        if (bookCity > 0) oQty = bookCity;
        else if (oQty > 0) bookCity = oQty;

        newUploadData.push({
          id: `up-${Date.now()}-${i}`,
          productCode: pCode,
          productName: foundProduct.productName,
          supplier: (foundProduct as any).supplierName, 
          productNo: (foundProduct as any).orderNo, 
          price: (foundProduct as any).listPrice,
          logisticsUnit: eaUnit,
          centerOrderYn: (foundProduct as any).centerOrderYn || 'Y',
          purchaseQty: pQty === 0 ? '' : String(pQty),
          onlineQty: oQty === 0 ? '' : String(oQty),
          expectedInDate: expInDate,
          s_paju: paju === 0 ? '' : String(paju),
          s_book: bookCity === 0 ? '' : String(bookCity),
          s_gwang: row[6]||'', s_gang: row[7]||'', s_jam: row[8]||'', s_daegu: row[9]||'', s_busan: row[10]||'', 
          s_incheon: row[11]||'', s_chang: row[12]||'', s_mok: row[13]||'', s_cheon: row[14]||'', s_dcube: row[15]||''
        });
      }

      setList1Data([]);
      setSelectedRowId(null);
      setSelectedProduct({});
      
      setUploadData(newUploadData);
      
      if (errCenterN > 0) {
          alert(`엑셀 다건 업로드 완료.\n(경고: 센터발주운영 N상품 ${errCenterN}건에 대해 파주센터 수량은 무시되었습니다.)`);
      } else {
          alert("엑셀 다건 업로드가 완료되었습니다. \n[저장] 버튼을 누르면 베이스업 공식이 적용되어 목록에 생성됩니다.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">문구 신상품발주</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 border-r border-gray-200">
                <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-900">
                  <input type="radio" name="productType" value="stationery" checked={productType === 'stationery'} onChange={() => setProductType('stationery')} /> 문구
                </label>
             </div>
             <Label className="border-r border-gray-200">입하예정기간</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={expectedInStart} endVal={expectedInEnd} onStartChange={setExpectedInStart} onEndChange={setExpectedInEnd} />
             </div>
             
             <Label className="border-r border-gray-200">수정자</Label>
             <div className="flex items-center p-1 gap-1 relative">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="사번" value={modifierId} onChange={(e) => setModifierId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleModifierIdSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="사원명" value={modifierName} onChange={(e) => setModifierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleModifierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsEmpModalOpen(true)} />
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">매입처품목</Label>
             <div className="flex items-center p-1 gap-1 relative">
                 <Input className={cn("h-6 w-20 text-[11px] rounded-[2px] border-gray-300", !supplierCode.trim() && "bg-gray-100 cursor-not-allowed")} placeholder="매입처품목코드" value={supplierItemCode} onChange={(e) => setSupplierItemCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierItemCodeSearch()} disabled={!supplierCode.trim()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className={cn("h-6 w-full text-[11px] rounded-[2px] border-gray-300 pr-6", !supplierCode.trim() ? "bg-gray-100 cursor-not-allowed" : "bg-[#fefefe]")} placeholder="매입처품목명" value={supplierItemName} onChange={(e) => setSupplierItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierItemNameSearch()} disabled={!supplierCode.trim()} />
                    <Search className={cn("absolute right-1.5 h-3.5 w-3.5", supplierCode.trim() ? "text-gray-400 cursor-pointer hover:text-gray-800" : "text-gray-300 cursor-not-allowed")} onClick={() => { if (supplierCode.trim()) setIsSupplierItemModalOpen(true); }} />
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr]">
             <Label className="border-r border-gray-200">조코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="학용품">학용품</SelectItem><SelectItem value="사무용품">사무용품</SelectItem><SelectItem value="디지털">디지털</SelectItem></SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200" required>수정일자</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={modDateStart} endVal={modDateEnd} onStartChange={setModDateStart} onEndChange={setModDateEnd} />
                 <span className="text-gray-500 ml-2">(최대 한달)</span>
             </div>
             
             <Label className="border-r border-gray-200">센터발주여부</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={centerOrderYn} onValueChange={setCenterOrderYn}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
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

      <div className="erp-section-group">
       <div className="erp-section-toolbar">
         <span className="erp-section-title">상품정보</span>
         <div className="flex gap-1">
            <Button variant="outline" className={actionBtnClass} onClick={handleDownloadTemplate}>엑셀양식다운</Button>
            <Button variant="outline" className={actionBtnClass} onClick={handleDelBugok}>부곡리 삭제</Button>
            <Button variant="outline" className={actionBtnClass} onClick={handleDelBookCity}>북시티 삭제</Button>
            <Button variant="outline" className={actionBtnClass} onClick={handleRegisterInfo}>등록</Button>
            <Button variant="outline" className={actionBtnClass} onClick={handleCreateOrderSingle}>발주생성</Button>
         </div>
       </div>
      <div className="border border-gray-300 bg-white flex flex-col text-[11px] flex-shrink-0">
         <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr_80px_1fr_80px_1fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center font-bold text-gray-900">{selectedProduct.productCode}</div>
             <Label className="border-r border-gray-200">상품명</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-blue-700 font-bold truncate">{selectedProduct.productName}</div>
             <Label className="border-r border-gray-200">제품번호</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.productNo}</div>
             <Label className="border-r border-gray-200">발주기준단가</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.orderStandardPrice ? Number(selectedProduct.orderStandardPrice).toLocaleString() : ''}</div>
             <Label className="border-r border-gray-200">정가</Label>
             <div className="p-1 px-2 flex items-center text-gray-800">{selectedProduct.price ? Number(selectedProduct.price).toLocaleString() : ''}</div>
         </div>
         <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr_80px_1fr_80px_1fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">단위/수량</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.unitQty}</div>
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.supplier}</div>
             <Label className="border-r border-gray-200">매입구분</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.purchaseType}</div>
             <Label className="border-r border-gray-200">상품상태</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.status}</div>
             <Label className="border-r border-gray-200">센터발주운영</Label>
             <div className="p-1 px-2 flex items-center font-bold text-gray-900">{selectedProduct.centerOrderYn}</div>
         </div>
         <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr_80px_1fr_80px_1fr]">
             <Label className="border-r border-gray-200 bg-yellow-100" required>입하예정일</Label>
             <div className="p-0 border-r border-gray-200 bg-yellow-50">
                <SingleDateInput val={selectedProduct.expectedInDate || ''} onChange={(val: string) => handleProductInfoChange('expectedInDate', val)} className="bg-transparent border-none" />
             </div>
             <Label className="border-r border-gray-200 bg-gray-100">입고예정일</Label>
             <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-500 bg-gray-50">{selectedProduct.expectedReceiveDate}</div>
             <Label className="border-r border-gray-200 bg-yellow-100" required>구매수량</Label>
             <div className="p-0 border-r border-gray-200 bg-yellow-50">
                <Input className="h-full w-full border-none text-right px-2 text-[11px] font-bold text-red-600 bg-transparent rounded-none" value={selectedProduct.purchaseQty || ''} onChange={(e) => handleProductInfoChange('purchaseQty', e.target.value)} />
             </div>
             <Label className="border-r border-gray-200 bg-yellow-100">온라인수량</Label>
             <div className="p-0 border-r border-gray-200 bg-yellow-50">
                <Input className="h-full w-full border-none text-right px-2 text-[11px] font-bold text-blue-700 bg-transparent rounded-none" value={selectedProduct.onlineQty || ''} onChange={(e) => handleProductInfoChange('onlineQty', e.target.value)} />
             </div>
             <Label className="border-r border-gray-200">반품불가</Label>
             <div className="p-1 px-2 flex items-center font-bold text-blue-600">{selectedProduct.noReturnYn}</div>
         </div>
      </div>
      </div>

      <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          <div className="erp-section-group flex-1 min-h-0 flex flex-col">
             <div className="erp-section-toolbar">
                <span className="erp-section-title">신상품 정보 목록</span>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={handleApplyOrderStandard}>발주기준</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownloadAll}>전체엑셀다운</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownloadList1}>엑셀다운</Button>
                </div>
             </div>
             <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
             <div className="flex-1 overflow-auto relative">
                <Table className="table-fixed min-w-[1700px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="h-8">
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                            <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">제품번호</TableHead>
                            <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입구분</TableHead>
                            <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">센터발주</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주기준<br/>단가</TableHead>
                            <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">정가</TableHead>
                            <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-100">발주수량</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">물류사용단위</TableHead>
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-red-50">구매수량<br/>(고객판매단위)</TableHead>
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">온라인예판수량<br/>(고객판매단위)</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">입하예정일</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-gray-100">입고예정일</TableHead>
                            <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-gray-100">처리자</TableHead>
                            <TableHead className="w-[110px] text-center font-bold text-gray-900 p-1 bg-gray-100">처리시간</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list1Data.map((row) => {
                            const isSelected = selectedRowId === row.id;
                            return (
                              <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleRowClick(row)}>
                                  <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.productCode}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate font-bold">{row.productName}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplier}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.productNo}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.purchaseType}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-gray-800">{row.centerOrderYn}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.orderStandardPrice ? Number(row.orderStandardPrice).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.price ? Number(row.price).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 font-bold pr-2 bg-yellow-50/50">{row.orderQty ? Number(row.orderQty).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.logisticsUnit}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-red-600 font-bold pr-2 bg-red-50/30">{row.purchaseQty ? Number(row.purchaseQty).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-blue-600 font-bold pr-2 bg-blue-50/30">{row.onlineQty ? Number(row.onlineQty).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 font-bold">{row.expectedInDate}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 bg-gray-50">{row.expectedReceiveDate}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 bg-gray-50">{row.modifier}</TableCell>
                                  <TableCell className="text-center p-1 text-gray-500 bg-gray-50 truncate">{row.modTime}</TableCell>
                              </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
             </div>
          </div>
          </div>

          <div className="erp-section-group flex-1 min-h-0 flex flex-col">
             <div className="erp-section-toolbar">
                <span className="erp-section-title">신상품 발주 다건 업로드</span>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>엑셀업로드(F2)</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleSaveUploadToProductInfo}>저장</Button>
                </div>
             </div>
             <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
             <div className="flex-1 overflow-auto">
                <Table className="table-fixed min-w-[1600px]">
                  <TableHeader className="sticky top-0 bg-[#f4f4f4] z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[100px] text-center font-bold border-r border-gray-300 p-1">바코드</TableHead>
                          <TableHead className="w-[80px] text-center font-bold border-r border-gray-300 p-1">물류사용단위</TableHead>
                          <TableHead className="w-[180px] text-center font-bold border-r border-gray-300 p-1">상품명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold border-r border-gray-300 p-1 text-red-600 bg-red-50">구매수량</TableHead>
                          <TableHead className="w-[80px] text-center font-bold border-r border-gray-300 p-1 text-blue-600 bg-blue-50">온라인수량</TableHead>
                          <TableHead className="w-[110px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-400">입하예정일</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">파주센터</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">북시티</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">광화문</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">강남</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">잠실</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">대구</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">부산</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">인천</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">창원</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">목동</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">천안</TableHead>
                          <TableHead className="w-[60px] text-center font-bold p-1 bg-yellow-50">디큐브</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {uploadData.map((row) => (
                        <TableRow key={row.id} className="h-8 border-b border-gray-200 hover:bg-blue-50/50 bg-white">
                            <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.productCode}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.logisticsUnit}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 truncate font-bold">{row.productName}</TableCell>
                            
                            <TableCell className="p-0 border-r border-gray-200 bg-red-50/30">
                                <Input className="h-full w-full border-none text-right px-2 text-[11px] font-bold text-red-600 bg-transparent rounded-none" value={row.purchaseQty} onChange={(e) => updateUploadRow(row.id, 'purchaseQty', e.target.value.replace(/[^0-9]/g, ''))} />
                            </TableCell>
                            
                            <TableCell className="p-0 border-r border-gray-200 bg-blue-50/30">
                                <Input className="h-full w-full border-none text-right px-2 text-[11px] font-bold text-blue-700 bg-transparent rounded-none" value={row.onlineQty} onChange={(e) => updateUploadRow(row.id, 'onlineQty', e.target.value.replace(/[^0-9]/g, ''))} />
                            </TableCell>

                            <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/30">
                                <SingleDateInput val={row.expectedInDate || ''} onChange={(val: string) => updateUploadRow(row.id, 'expectedInDate', val)} className="bg-transparent border-none" />
                            </TableCell>

                            {['paju', 'book', 'gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube'].map(storeKey => (
                                <TableCell key={storeKey} className="p-0 border-r border-gray-200">
                                    <Input className={cn("h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-1 bg-transparent text-[11px]", storeKey === 'paju' && row.centerOrderYn === 'N' && "bg-gray-200 cursor-not-allowed text-gray-400")} value={row[`s_${storeKey}`] || ''} onChange={(e) => updateUploadRow(row.id, `s_${storeKey}`, e.target.value.replace(/[^0-9]/g, ''))} disabled={storeKey === 'paju' && row.centerOrderYn === 'N'} />
                                </TableCell>
                            ))}
                        </TableRow>
                      ))}
                      {uploadData.length === 0 && (
                          Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={`empty-up-${i}`} className="h-8 border-b border-gray-200 bg-white">
                                 {Array.from({length: 18}).map((_, j) => <TableCell key={j} className={j < 17 ? "border-r border-gray-200" : ""}></TableCell>)}
                              </TableRow>
                          ))
                      )}
                  </TableBody>
                </Table>
             </div>
          </div>
          </div>
      </div>

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName || productCode} onSelect={(item) => { setProductCode(item.productCode); setProductName(item.productName); }} />
      <SupplierSearchModal 
        isOpen={isSupplierModalOpen} 
        onClose={() => setIsSupplierModalOpen(false)} 
        initialSearchName={supplierName || supplierCode} 
        allowedCodes={STATIONERY_SUPPLIERS}
        onSelect={(item) => { setSupplierCode(item.code); setSupplierName(item.name); }} 
      />
      <SupplierItemSearchModal isOpen={isSupplierItemModalOpen} onClose={() => setIsSupplierItemModalOpen(false)} supplierCode={supplierCode} initialSearchName={supplierItemName || supplierItemCode} onSelect={(item) => { setSupplierItemCode(item.code); setSupplierItemName(item.name); }} />
      <EmployeeSearchModal isOpen={isEmpModalOpen} onClose={() => setIsEmpModalOpen(false)} initialSearchId={modifierId} initialSearchName={modifierName} onSelect={(emp) => { setModifierId(emp.id); setModifierName(emp.name); }} />
    </div>
  );
}