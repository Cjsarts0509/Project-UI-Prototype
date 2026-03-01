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

// 사원 검색 팝업 연동
import { EmployeeSearchModal } from '../components/EmployeeSearchModal';

const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];

const safeText = (val: any) => val && val !== '#' ? val : '';

// ★ 엑셀 일련번호(4로 시작하는 5자리 숫자)까지 완벽 대응하는 날짜 파서
const parseExcelDate = (val: any) => {
  if (!val || val === '#') return '';
  
  // 1. 순수 Number 타입 엑셀 일련번호 처리
  if (typeof val === 'number') {
      const date = new Date((val - 25569) * 86400 * 1000);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
  }
  
  let strVal = String(val).trim();
  
  // 2. String으로 들어왔지만 엑셀 일련번호(5자리 숫자, 예: "45992")인 경우 처리
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

  // 3. 시간 포함 문자열 ("20251201 00:00:00" 등) 앞부분만 추출
  if (strVal.includes(' ')) {
      strVal = strVal.split(' ')[0];
  }

  // 4. 일반적인 기호 포함 날짜 문자열 ("2025-12-01", "25.12.01" 등)
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
  
  // 5. 기호 없는 숫자 뭉치 ("20251201", "251201" 등)
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

export default function AlbumNewReleaseOrderPage() {
  const { products, employees = [] } = useMockData();

  const [productType, setProductType] = useState('album');
  const [expectedInStart, setExpectedInStart] = useState('');
  const [expectedInEnd, setExpectedInEnd] = useState('');
  const [category, setCategory] = useState('all');
  
  const [modifierCode, setModifierCode] = useState('');
  const [modifierName, setModifierName] = useState('');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  const [modDateStart, setModDateStart] = useState(format(subWeeks(new Date(), 1), 'yyyy-MM-dd'));
  const [modDateEnd, setModDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [list1Data, setList1Data] = useState<any[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>({});
  const [uploadData, setUploadData] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModifierCodeSearch = () => {
    if (!modifierCode.trim()) { setIsEmployeeModalOpen(true); return; }
    const exactMatches = employees.filter(e => e.empNo === modifierCode.trim());
    if (exactMatches.length === 1) setModifierName(exactMatches[0].empName);
    else setIsEmployeeModalOpen(true);
  };

  const handleModifierNameSearch = () => {
    if (!modifierName.trim()) { setIsEmployeeModalOpen(true); return; }
    const exactMatches = employees.filter(e => e.empName.includes(modifierName.trim()));
    if (exactMatches.length === 1) { setModifierCode(exactMatches[0].empNo); setModifierName(exactMatches[0].empName); }
    else setIsEmployeeModalOpen(true);
  };

  const validateDateRange = () => {
    if (category !== 'all' || modifierCode || modifierName) {
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
        // 1. 상품구분: 음반 매입처 상품만 조회
        const suppCode = safeText(item.supplierCode);
        if (productType === 'album' && !ALBUM_SUPPLIERS.includes(suppCode)) return false;

        // 2. 신보 조건: 파싱된 날짜 기준으로 2025-12-01 ~ 2025-12-31 필터링
        const relDate = parseExcelDate(item.releaseDate);
        if (!relDate || relDate < '2025-12-01' || relDate > '2025-12-31') return false;

        // 3. 조(분류) 화면 필터 매핑
        if (category !== 'all') {
            if (safeText(item.productCategory) !== category) return false;
        }

        // 4. 수정자 필터 (이름 기준 검색)
        if (modifierName && !safeText(item.registrant).includes(modifierName)) return false;

        return true;
    });

    const newList = filtered.map((item, idx) => ({
      id: `data-${Date.now()}-${idx}`,
      productCode: safeText(item.productCode),
      productName: safeText(item.productName),
      artist: safeText(item.artistName),
      supplier: safeText(item.supplierName),
      productNo: safeText(item.orderNo),
      purchaseType: safeText(item.purchaseType) || '일시',
      orderStandardPrice: safeText(item.initialReleasePrice),
      purchaseQty: '',
      onlineQty: '',
      offPreOrder: '0',
      onPreOrder: '0',
      expectedInDate: '',
      expectedReceiveDate: '',
      modifier: safeText(item.registrant) || '12951',
      modTime: parseExcelDate(item.registrationDate) || format(new Date(), 'yyyy-MM-dd'),
      status: safeText(item.productStatus),
      noReturnYn: 'N',
      label: safeText(item.labelName),
      price: safeText(item.listPrice),
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
    setExpectedInStart(''); setExpectedInEnd('');
    setCategory('all'); setModifierCode(''); setModifierName('');
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
      purchaseQty: item.purchaseQty || '',
      onlineQty: item.onlineQty || '',
      expectedInDate: item.expectedInDate || '',
      s_paju: item.s_paju || '', 
      s_gwang: item.s_gwang || '', s_gang: item.s_gang || '', s_jam: item.s_jam || '',
      s_daegu: item.s_daegu || '', s_busan: item.s_busan || '', s_incheon: item.s_incheon || '',
      s_chang: item.s_chang || '', s_mok: item.s_mok || '', s_cheon: item.s_cheon || '', s_dcube: item.s_dcube || ''
    }]);
  };

  const handleProductInfoChange = (field: string, val: string) => {
    const rawVal = field.includes('Qty') || field === 'orderStandardPrice' ? val.replace(/[^0-9]/g, '') : val;
    setSelectedProduct((prev: any) => {
      const updated = { ...prev, [field]: rawVal };
      if (field === 'expectedInDate') {
        updated.expectedReceiveDate = rawVal;
      }
      return updated;
    });
  };

  const handleDelBugok = () => {
    if (!selectedProduct.productCode) return;
    
    setSelectedProduct((prev: any) => ({ ...prev, purchaseQty: '' }));
    setUploadData(prev => prev.map(row => {
      if (row.productCode === selectedProduct.productCode) {
        return {
          ...row, purchaseQty: '',
          s_paju: '', s_gwang: '', s_gang: '', s_jam: '', s_daegu: '', s_busan: '', 
          s_incheon: '', s_chang: '', s_mok: '', s_cheon: '', s_dcube: ''
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
      if (row.productCode === selectedProduct.productCode) {
        return { ...row, onlineQty: '' };
      }
      return row;
    }));

    alert("온라인수량이 임시 삭제되었습니다.\n[등록] 버튼을 누르지 않으면 다른 항목 클릭 후 원복됩니다.");
  };

  const handleRegisterInfo = () => {
    if (!selectedProduct.productCode) return;
    
    const pQty = Number(selectedProduct.purchaseQty) || 0;

    setUploadData(prevUpload => {
        const updatedUpload = prevUpload.map(row => {
            if (row.productCode === selectedProduct.productCode) {
                const sumOthers = ['gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube']
                    .reduce((acc, k) => acc + (Number(row[`s_${k}`]) || 0), 0);
                
                const pajuQty = Math.max(0, pQty - sumOthers);
                return {
                    ...row,
                    purchaseQty: selectedProduct.purchaseQty,
                    onlineQty: selectedProduct.onlineQty,
                    expectedInDate: selectedProduct.expectedInDate,
                    s_paju: pajuQty === 0 ? '' : String(pajuQty)
                };
            }
            return row;
        });

        setList1Data(prevList => prevList.map(item => {
            if (item.id === selectedProduct.id) {
                const upRow = updatedUpload.find(u => u.productCode === item.productCode);
                if (upRow) {
                    return {
                        ...item,
                        ...selectedProduct,
                        s_paju: upRow.s_paju, 
                        s_gwang: upRow.s_gwang, 
                        s_gang: upRow.s_gang, 
                        s_jam: upRow.s_jam, 
                        s_daegu: upRow.s_daegu, 
                        s_busan: upRow.s_busan, 
                        s_incheon: upRow.s_incheon, 
                        s_chang: upRow.s_chang, 
                        s_mok: upRow.s_mok, 
                        s_cheon: upRow.s_cheon, 
                        s_dcube: upRow.s_dcube
                    };
                } else {
                    return {
                        ...item,
                        ...selectedProduct,
                        s_paju: pQty === 0 ? '' : String(pQty)
                    };
                }
            }
            return item;
        }));

        return updatedUpload;
    });

    alert("상품정보가 신보 정보 목록에 픽스(등록)되었습니다.\n할당되지 않은 구매수량은 '파주센터'로 자동 배분되었습니다.");
  };

  const handleCreateOrderSingle = () => alert("현재  정보 목록에 등록된 정보대로 실시간 발주가 생성되었습니다.");

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["바코드", "구매수량", "온라인수량", "입하예정일", "파주센터", "광화문", "강남", "잠실", "대구", "부산", "인천", "창원", "목동", "천안", "큐브"]]);
    ws['!cols'] = [{ wpx: 120 }, { wpx: 80 }, { wpx: 80 }, { wpx: 100 }, { wpx: 60 }, { wpx: 60 }, { wpx: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "업로드양식");
    XLSX.writeFile(wb, "신보다건업로드_양식.xlsx");
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
      '상품코드': item.productCode, '상품명': item.productName, '가수명': item.artist, '매입처명': item.supplier, '레이블명': item.label, '제품번호': item.productNo,
      '발주기준단가': item.orderStandardPrice, '정가': item.price, '상품상태': item.status,
      '구매수량': item.purchaseQty, '온라인수량': item.onlineQty, '오프라인선결제': item.offPreOrder, '온라인예약판매': item.onPreOrder,
      '입하예정일': item.expectedInDate, '입고예정일': item.expectedReceiveDate, '처리자': item.modifier, '처리시간': item.modTime
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "신상품정보목록");
    XLSX.writeFile(wb, "음반_신보_목록조회.xlsx");
  };

  const handleExcelDownloadAll = () => alert("전체 엑셀 다운로드: 점포별 분배수량 병합 로직 수행");

  const updateUploadRow = (id: string, field: string, val: string) => {
    setUploadData(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: val };
        
        if (field === 'purchaseQty') {
            const numVal = Number(val) || 0;
            const sumOthers = ['gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube']
              .reduce((acc, k) => acc + (Number(newRow[`s_${k}`]) || 0), 0);
            
            const pajuQty = Math.max(0, numVal - sumOthers);
            newRow.s_paju = pajuQty === 0 ? '' : String(pajuQty);
        } else if (field.startsWith('s_')) {
            const sumAll = ['paju', 'gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube']
              .reduce((acc, k) => acc + (Number(newRow[`s_${k}`]) || 0), 0);
            newRow.purchaseQty = sumAll === 0 ? '' : String(sumAll);
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
        const newList = validUploads.map((up, idx) => ({
            id: `list-up-${Date.now()}-${idx}`,
            productCode: up.productCode, productName: up.productName,
            artist: up.artist || '가수명미상', supplier: up.supplier || '매입처미상',
            productNo: up.productNo || '-', purchaseType: '일시', orderStandardPrice: '',
            purchaseQty: up.purchaseQty, onlineQty: up.onlineQty,
            offPreOrder: '0', onPreOrder: '0',
            expectedInDate: up.expectedInDate, expectedReceiveDate: up.expectedInDate,
            modifier: '12951', modTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
            status: '정상', noReturnYn: 'N', label: up.label || '레이블미상', price: up.price || '0', _originalPrice: '12000',
            s_paju: up.s_paju, s_gwang: up.s_gwang, s_gang: up.s_gang, s_jam: up.s_jam, s_daegu: up.s_daegu, s_busan: up.s_busan,
            s_incheon: up.s_incheon, s_chang: up.s_chang, s_mok: up.s_mok, s_cheon: up.s_cheon, s_dcube: up.s_dcube
        }));
        setList1Data(newList);
        if (newList.length > 0) {
            setSelectedRowId(newList[0].id);
            setSelectedProduct({ ...newList[0] });
        }
        alert("업로드된 다건 데이터가 신보 정보 목록에 신규 등록되었습니다.");
    } else {
        const targetData = validUploads.find(u => u.productCode === selectedProduct.productCode) || validUploads[0];
        if (!targetData) return;

        const updatedProduct = {
            ...selectedProduct,
            purchaseQty: targetData.purchaseQty,
            onlineQty: targetData.onlineQty,
            expectedInDate: targetData.expectedInDate,
            expectedReceiveDate: targetData.expectedInDate,
            s_paju: targetData.s_paju, s_gwang: targetData.s_gwang, s_gang: targetData.s_gang, s_jam: targetData.s_jam, s_daegu: targetData.s_daegu, s_busan: targetData.s_busan,
            s_incheon: targetData.s_incheon, s_chang: targetData.s_chang, s_mok: targetData.s_mok, s_cheon: targetData.s_cheon, s_dcube: targetData.s_dcube
        };
        setSelectedProduct(updatedProduct);
        alert("다건 업로드 영역에 입력된 값이 상품정보 영역으로 임시 엎어쳐졌습니다.\n[등록] 버튼을 누르면 최종 픽스됩니다.");
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
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (!row[0]) continue;

        const pCode = String(row[0]).trim();
        const onlineQty = Number(row[2]) || 0;
        const expInDate = parseExcelDate(row[3]); 
        
        let storeSum = 0;
        let sumOthers = 0;
        for(let j=4; j<=14; j++) {
            storeSum += Number(row[j]) || 0;
            if(j > 4) sumOthers += Number(row[j]) || 0;
        }
        
        let pQty = Number(row[1]) || 0;
        let paju = Number(row[4]) || 0;
        
        if (pQty > storeSum) {
            paju += (pQty - storeSum);
            storeSum = pQty;
        } else if (storeSum > 0) {
            pQty = storeSum;
        }

        const foundProduct = products.find(p => p.productCode === pCode) || { productName: '미등록상품', artistName: '', supplierName: '', orderNo: '', labelName: '', listPrice: '' };
        
        newUploadData.push({
          id: `up-${Date.now()}-${i}`,
          productCode: pCode,
          productName: safeText(foundProduct.productName),
          artist: safeText(foundProduct.artistName) || '', 
          supplier: safeText(foundProduct.supplierName) || '', 
          productNo: safeText(foundProduct.orderNo) || '', 
          label: safeText(foundProduct.labelName) || '', 
          price: safeText(foundProduct.listPrice) || '',
          purchaseQty: pQty === 0 ? '' : String(pQty),
          onlineQty: onlineQty === 0 ? '' : String(onlineQty),
          expectedInDate: expInDate,
          s_paju: paju === 0 ? '' : String(paju),
          s_gwang: row[5]||'', s_gang: row[6]||'', s_jam: row[7]||'', s_daegu: row[8]||'', s_busan: row[9]||'', s_incheon: row[10]||'', s_chang: row[11]||'', s_mok: row[12]||'', s_cheon: row[13]||'', s_dcube: row[14]||''
        });
      }

      setList1Data([]);
      setSelectedRowId(null);
      setSelectedProduct({});
      
      setUploadData(newUploadData);
      alert("엑셀 다건 업로드가 완료되었습니다. 잉여 구매수량은 '파주센터'에 자동 할당되었습니다.\n[저장] 버튼을 누르면 신보 정보 목록에 신규 생성됩니다.");
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">음반 신보발주</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200" required>상품구분</Label>
             <div className="flex items-center p-1 px-3 border-r border-gray-200">
                <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-900">
                  <input type="radio" name="productType" value="album" checked={productType === 'album'} onChange={() => setProductType('album')} /> 음반
                </label>
             </div>
             <Label className="border-r border-gray-200">입하예정기간</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={expectedInStart} endVal={expectedInEnd} onStartChange={setExpectedInStart} onEndChange={setExpectedInEnd} />
             </div>
             <Label className="border-r border-gray-200">수정자</Label>
             <div className="flex items-center p-1 gap-1 relative">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="사번" value={modifierCode} onChange={(e) => setModifierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleModifierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="이름" value={modifierName} onChange={(e) => setModifierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleModifierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsEmployeeModalOpen(true)} />
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1.5fr_100px_1.5fr]">
             <Label className="border-r border-gray-200">조코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="가요">가요</SelectItem><SelectItem value="POP">POP</SelectItem><SelectItem value="클래식">클래식</SelectItem></SelectContent>
                 </Select>
             </div>
             <Label className="border-r border-gray-200" required>수정일자</Label>
             <div className="flex items-center p-1 gap-1 col-span-3">
                 <DateRangeInput startVal={modDateStart} endVal={modDateEnd} onStartChange={setModDateStart} onEndChange={setModDateEnd} />
                 <span className="text-gray-500 ml-2">(조/수정자 지정 시 최대 한달)</span>
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
          <div className="erp-section-title">상품정보</div>
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
              <div className="p-1 px-2 border-r border-gray-200 flex items-center text-blue-700 font-bold truncate col-span-3">{selectedProduct.productName}</div>
              <Label className="border-r border-gray-200">제품번호</Label>
              <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.productNo}</div>
              <Label className="border-r border-gray-200">발주기준단가</Label>
              <div className="p-1 px-2 flex items-center text-gray-800">{selectedProduct.orderStandardPrice ? Number(selectedProduct.orderStandardPrice).toLocaleString() : ''}</div>
          </div>
          <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr_80px_1fr_80px_1fr] border-b border-gray-200">
              <Label className="border-r border-gray-200">가수명</Label>
              <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.artist}</div>
              <Label className="border-r border-gray-200">레이블</Label>
              <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.label}</div>
              <Label className="border-r border-gray-200">매입처</Label>
              <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.supplier}</div>
              <Label className="border-r border-gray-200">매입구분</Label>
              <div className="p-1 px-2 border-r border-gray-200 flex items-center text-gray-800">{selectedProduct.purchaseType}</div>
              <Label className="border-r border-gray-200">상품상태</Label>
              <div className="p-1 px-2 flex items-center text-gray-800">{selectedProduct.status}</div>
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
                 <span className="erp-section-title">신보 정보 목록</span>
                 <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={handleApplyOrderStandard}>발주기준</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownloadAll}>전체엑셀다운</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownloadList1}>엑셀다운</Button>
                 </div>
              </div>
              <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
                <Table className="table-fixed min-w-[1500px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="h-8">
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                            <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">가수명</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">제품번호</TableHead>
                            <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입구분</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">발주기준<br/>단가</TableHead>
                            <TableHead className="w-[70px] text-center font-bold text-red-600 border-r border-gray-300 p-1 bg-red-50">구매수량</TableHead>
                            <TableHead className="w-[70px] text-center font-bold text-blue-600 border-r border-gray-300 p-1 bg-blue-50">온라인수량</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">오프라인<br/>선결제</TableHead>
                            <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">온라인<br/>예약판매</TableHead>
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
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate">{row.artist}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600 truncate">{row.supplier}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.productNo}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.purchaseType}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.orderStandardPrice ? Number(row.orderStandardPrice).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-red-600 font-bold pr-2 bg-red-50/30">{row.purchaseQty ? Number(row.purchaseQty).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-blue-600 font-bold pr-2 bg-blue-50/30">{row.onlineQty ? Number(row.onlineQty).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-blue-600 underline cursor-pointer pr-2 font-bold" onClick={() => alert('점포별 수량 미니팝업')}>{row.offPreOrder ? Number(row.offPreOrder).toLocaleString() : ''}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.onPreOrder ? Number(row.onPreOrder).toLocaleString() : ''}</TableCell>
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

          <div className="erp-section-group flex-1 min-h-0 flex flex-col">
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">신보 발주 다건 업로드</span>
                 <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={handleFileUploadClick}>엑셀업로드(F2)</Button>
                    <Button variant="outline" className={actionBtnClass} onClick={handleSaveUploadToProductInfo}>저장</Button>
                 </div>
              </div>
              <div className="flex flex-col min-h-0 border border-gray-300 bg-white flex-1">
              <div className="flex-1 overflow-auto">
                <Table className="table-fixed min-w-[1500px]">
                  <TableHeader className="sticky top-0 bg-[#f4f4f4] z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[100px] text-center font-bold border-r border-gray-300 p-1">바코드</TableHead>
                          <TableHead className="w-[180px] text-center font-bold border-r border-gray-300 p-1">상품명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold border-r border-gray-300 p-1 text-red-600 bg-red-50">구매수량</TableHead>
                          <TableHead className="w-[80px] text-center font-bold border-r border-gray-300 p-1 text-blue-600 bg-blue-50">온라인수량</TableHead>
                          <TableHead className="w-[110px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-400">입하예정일</TableHead>
                          <TableHead className="w-[60px] text-center font-bold border-r border-gray-300 p-1 bg-yellow-50">파주센터</TableHead>
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

                            {['paju', 'gwang', 'gang', 'jam', 'daegu', 'busan', 'incheon', 'chang', 'mok', 'cheon', 'dcube'].map(storeKey => (
                                <TableCell key={storeKey} className="p-0 border-r border-gray-200">
                                    <Input className="h-full w-full border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none text-right px-1 bg-transparent text-[11px]" value={row[`s_${storeKey}`] || ''} onChange={(e) => updateUploadRow(row.id, `s_${storeKey}`, e.target.value.replace(/[^0-9]/g, ''))} />
                                </TableCell>
                            ))}
                        </TableRow>
                      ))}
                      {uploadData.length === 0 && (
                          Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={`empty-up-${i}`} className="h-8 border-b border-gray-200 bg-white">
                                 {Array.from({length: 16}).map((_, j) => <TableCell key={j} className={j < 15 ? "border-r border-gray-200" : ""}></TableCell>)}
                              </TableRow>
                          ))
                      )}
                  </TableBody>
                </Table>
              </div>
             </div>
          </div>
      </div>

      <EmployeeSearchModal 
          isOpen={isEmployeeModalOpen} 
          onClose={() => setIsEmployeeModalOpen(false)} 
          initialSearchName={modifierName} 
          onSelect={(item: any) => { 
             setModifierCode(item.empNo); 
             setModifierName(item.empName); 
          }} 
      />
    </div>
  );
}