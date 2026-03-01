import React, { useState, useRef } from 'react';
import { Calendar, Search, Download, Save, FileUp, FileDown, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { ProductCodeSearchField } from '../components/ProductCodeSearchField';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';

const GROUP_CODES = [
  { code: '00', name: '전체' }, { code: 'M1', name: '음반/영상' }, { code: 'S1', name: '학용품' },
  { code: 'S2', name: '미술전문용품' }, { code: 'S3', name: '사무용품' }, { code: 'S4', name: '고급다이어리' },
  { code: 'S5', name: '고급필기구' }, { code: 'S6', name: '일반필기구' }, { code: 'S7', name: '디자인문구' },
  { code: 'T1', name: '디지털' }, { code: 'T2', name: '디자인상품' }, { code: 'T3', name: '일상소품' },
  { code: 'U1', name: '푸드' }, { code: 'Z9', name: '조코드미정' }
];

const PROD_STATUS = [
  { code: '00', name: '전체' }, { code: '012', name: '예약판매' }, { code: '001', name: '정상' },
  { code: '002', name: '품절' }, { code: '003', name: '절판' }, { code: '005', name: '판매금지' }
];

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const DateRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatDateString(e.target.value))} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 10 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={endVal} onChange={(e) => onEndChange(formatDateString(e.target.value))} placeholder="YYYY-MM-DD" />
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

// ★ 누락되었던 버튼 공통 클래스 복구
const headerBtnClass = "erp-btn-header";
const actionBtnClass = "erp-btn-action";

type RowData = {
    id: string;
    pCode: string;
    pName: string;
    suppCode: string;
    suppName: string;
    suppItemName: string;
    status: string;
    listPrice: number;
    baseFeeRate: number;     // 수수료율 (기존 매입율)
    baseCost: number;        // 원가 (기존 최초출고가)
    changeFeeRate: string;   // 변경수수료율
    changeCost: number;      // 변경원가
    changeReason: string;    // 변경사유
    modDate: string;
    modEmp: string;
};

export default function SpecificPurchaseFeeRatePage() {
  const { products, suppliers } = useMockData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 특정매입(503) 매입처만 필터링
  const specificSuppliers = suppliers.filter(s => s.purchaseTypeCode === 503);

  // 1. 조회 영역 State
  const [suppCode, setSuppCode] = useState('');
  const [suppName, setSuppName] = useState('');
  const [suppItemCode, setSuppItemCode] = useState('');
  const [suppItemName, setSuppItemName] = useState('');
  const [groupCode, setGroupCode] = useState('00');
  
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [pStatus, setPStatus] = useState('00');

  // 2. 정보 영역 (변경 적용부) State
  const [infoPCode, setInfoPCode] = useState('');
  const [infoPName, setInfoPName] = useState('');
  
  const [isApplyReason, setIsApplyReason] = useState(false);
  const [infoReason, setInfoReason] = useState('업체요청');
  
  const [isApplyFeeRate, setIsApplyFeeRate] = useState(false);
  const [infoFeeRate, setInfoFeeRate] = useState('');

  // 3. 그리드 & 팝업 State
  const [listData, setListData] = useState<RowData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [isSuppItemModalOpen, setIsSuppItemModalOpen] = useState(false);
  const [searchSuppName, setSearchSuppName] = useState('');

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodModalTarget, setProdModalTarget] = useState<'search'|'info'|null>(null);

  // Row 데이터 생성 (원가 = 정가 * 수수료율)
  const createRowData = (p: any, s: any): RowData => {
      const baseFeeRate = Math.floor(Math.random() * 30) + 40; 
      const listPrice = p.listPrice || 10000;
      const baseCost = Math.round(listPrice * (baseFeeRate / 100)); 
      
      return {
          id: `row-${Date.now()}-${p.productCode}-${Math.random()}`,
          pCode: p.productCode,
          pName: p.productName,
          suppCode: s.code,
          suppName: s.name,
          suppItemName: p.supplierItemName || '일반상품',
          status: p.productStatus || '정상',
          listPrice,
          baseFeeRate,
          baseCost,
          changeFeeRate: '',
          changeCost: 0,
          changeReason: '업체요청',
          modDate: '-',
          modEmp: '-'
      };
  };

  // ----------------------------------------------------------------------
  // [공통 핸들러]
  // ----------------------------------------------------------------------
  const handleSupplierSearch = () => {
      const query = suppName.trim();
      if (!query) {
          setSearchSuppName(''); setIsSuppModalOpen(true); return;
      }
      const exactMatches = specificSuppliers.filter(s => s.name === query || s.code === query);
      if (exactMatches.length === 1) {
          setSuppCode(exactMatches[0].code); setSuppName(exactMatches[0].name);
      } else {
          setSearchSuppName(query); setIsSuppModalOpen(true);
      }
  };

  const addProductToGrid = (p: any) => {
      const s = suppliers.find(x => x.code === p.supplierCode);
      if (s?.purchaseTypeCode !== 503) return alert("해당 상품의 매입처는 특정매입이 아닙니다.");

      const newRow = createRowData(p, s);
      setListData(prev => [newRow, ...prev]);
  };

  // ----------------------------------------------------------------------
  // [조회 영역 핸들러]
  // ----------------------------------------------------------------------
  const handleSearch = () => {
      if (!suppCode && !pCode) return alert("상품코드 또는 매입처 중 하나는 반드시 입력되어야 합니다.");

      let filtered = [...products];
      const validSuppIds = specificSuppliers.map(s => s.code);
      filtered = filtered.filter(p => validSuppIds.includes(p.supplierCode));

      if (suppCode) filtered = filtered.filter(p => p.supplierCode === suppCode);
      if (pCode) filtered = filtered.filter(p => p.productCode.includes(pCode));
      if (suppItemCode) filtered = filtered.filter(p => p.supplierItemCode === suppItemCode);
      if (pStatus !== '00') {
          const stObj = PROD_STATUS.find(s => s.code === pStatus);
          if (stObj) filtered = filtered.filter(p => p.productStatus === stObj.name);
      }

      const generated = filtered.map(p => {
          const sInfo = suppliers.find(s => s.code === p.supplierCode);
          return createRowData(p, sInfo);
      });

      setListData(generated);
      setSelectedRows([]);
  };

  const handleReset = () => {
      setSuppCode(''); setSuppName(''); setSuppItemCode(''); setSuppItemName('');
      setGroupCode('00'); setPCode(''); setPName(''); setDateStart(''); setDateEnd(''); setPStatus('00');
      setListData([]); setSelectedRows([]);
  };

  // ----------------------------------------------------------------------
  // [정보 영역 핸들러 (행 추가 및 일괄 적용)]
  // ----------------------------------------------------------------------
  const handleInfoPCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          if (!infoPCode.trim()) return;
          const p = products.find(x => x.productCode === infoPCode.trim());
          if (!p) { setInfoPName(''); return alert("해당 상품을 찾을 수 없습니다."); }
          
          setInfoPName(p.productName);
          addProductToGrid(p);
          setInfoPCode(''); setInfoPName('');
      }
  };

  const handleBatchApply = () => {
      if (selectedRows.length === 0) return alert("일괄 적용할 항목을 체크해주세요.");
      if (!isApplyReason && !isApplyFeeRate) return alert("변경할 항목(변경사유 또는 변경수수료율)의 체크박스를 선택해주세요.");

      setListData(prev => prev.map(r => {
          if (selectedRows.includes(r.id)) {
              let updated = { ...r };
              if (isApplyReason) {
                  updated.changeReason = infoReason;
              }
              if (isApplyFeeRate) {
                  updated.changeFeeRate = infoFeeRate;
                  updated.changeCost = infoFeeRate ? Math.round(r.listPrice * (Number(infoFeeRate) / 100)) : 0;
              }
              return updated;
          }
          return r;
      }));
  };

  // ----------------------------------------------------------------------
  // [그리드 및 엑셀 핸들러]
  // ----------------------------------------------------------------------
  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedRows(listData.map(r => r.id));
      else setSelectedRows([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedRows(prev => [...prev, id]);
      else setSelectedRows(prev => prev.filter(rId => rId !== id));
  };

  const handleRowChange = (id: string, field: 'changeFeeRate'|'changeReason', val: string) => {
      setListData(prev => prev.map(r => {
          if (r.id === id) {
              const updated = { ...r, [field]: val };
              if (field === 'changeFeeRate') {
                  const numVal = Number(val);
                  updated.changeCost = numVal > 0 ? Math.round(r.listPrice * (numVal / 100)) : 0;
              }
              return updated;
          }
          return r;
      }));
  };

  const handleSave = () => {
      if (selectedRows.length === 0) return alert("저장할 항목을 체크해주세요.");
      setListData(prev => prev.map(r => {
          if (selectedRows.includes(r.id)) {
              return { ...r, modDate: format(new Date(), 'yyyy/MM/dd'), modEmp: '12951' };
          }
          return r;
      }));
      setSelectedRows([]);
      alert("체크된 항목들의 수수료율 정보가 성공적으로 저장되었습니다.");
  };

  // 엑셀 양식 다운로드
  const handleExcelTemplateDownload = () => {
      const ws = XLSX.utils.json_to_sheet([{ '상품코드': '', '변경수수료율': '', '시작일자': '', '종료일자': '' }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "업로드양식");
      XLSX.writeFile(wb, `수수료율변경_업로드양식.xlsx`);
  };

  // 엑셀 업로드 클릭 트리거 및 파일 핸들러
  const handleExcelUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      alert(`[${file.name}] 파일이 정상적으로 등록 및 업로드 되었습니다.`);
      e.target.value = ''; // 동일 파일 재업로드를 위한 리셋
  };

  // 엑셀 다운로드 (현재 그리드 데이터)
  const handleExcelDownload = () => {
      if (listData.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = listData.map(r => ({
          '상품코드': r.pCode, '상품명': r.pName, '매입처코드': r.suppCode, '매입처': r.suppName, 
          '매입처별품목코드명': r.suppItemName, '상품상태': r.status, '정가': r.listPrice,
          '수수료율': r.baseFeeRate, '원가': r.baseCost, 
          '변경수수료율': r.changeFeeRate, '변경원가': r.changeCost, '변경사유': r.changeReason,
          '최종수정일': r.modDate, '변경사번': r.modEmp
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "수수료율변경내역");
      XLSX.writeFile(wb, `수수료율관리(특정매입)_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-4">
      
      {/* 1. 조회 영역 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">특정매입수수료율</h2>
      </div>

      <div className="erp-search-area">
      <div className="flex flex-col border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             <Label className="border-b border-gray-200" required>매입처</Label>
             <div className="flex items-center gap-1 p-1 border-b border-r border-gray-200">
                 <Input className="h-6 w-[80px] text-[11px] bg-white font-bold" value={suppCode} onChange={e => setSuppCode(e.target.value)} placeholder="매입처코드" />
                 <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0" onClick={handleSupplierSearch}>
                     <Search className="w-3.5 h-3.5 text-white" />
                 </Button>
                 <Input className="h-6 flex-1 text-[11px] bg-white" placeholder="매입처명" value={suppName} onChange={e => setSuppName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierSearch()} />
             </div>

             <Label className="border-b border-gray-200">매입처별품목코드</Label>
             <div className="flex items-center gap-1 p-1 border-b border-r border-gray-200">
                 <Input className={cn("h-6 w-[80px] text-[11px] bg-white font-bold", !suppCode.trim() && "bg-gray-100 cursor-not-allowed")} value={suppItemCode} onChange={e => setSuppItemCode(e.target.value)} disabled={!suppCode.trim()} />
                 <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0" onClick={() => setIsSuppItemModalOpen(true)} disabled={!suppCode.trim()}>
                     <Search className="w-3.5 h-3.5 text-white" />
                 </Button>
                 <Input className={cn("h-6 flex-1 text-[11px]", !suppCode.trim() ? "bg-gray-100" : "bg-gray-100")} readOnly tabIndex={-1} value={suppItemName} />
             </div>

             <Label className="border-b border-gray-200">조코드</Label>
             <div className="p-1 border-b border-gray-200">
                 <Select value={groupCode} onValueChange={setGroupCode}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         {GROUP_CODES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-gray-200" required>상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-r border-gray-200">
                 <ProductCodeSearchField
                   productCode={pCode}
                   setProductCode={setPCode}
                   productName={pName}
                   setProductName={setPName}
                 />
             </div>

             <Label className="border-gray-200">상품등록일자</Label>
             <div className="flex items-center p-1 border-r border-gray-200 px-3">
                 <DateRangeInput startVal={dateStart} endVal={dateEnd} onStartChange={setDateStart} onEndChange={setDateEnd} />
             </div>

             <Label className="border-gray-200">상품상태</Label>
             <div className="p-1">
                 <Select value={pStatus} onValueChange={setPStatus}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         {PROD_STATUS.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                     </SelectContent>
                 </Select>
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
             <Button variant="outline" className={headerBtnClass} onClick={handleReset}>초기화(F3)</Button>
             <Button className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>

      {/* 2. 수수료율 정보 입력/수정 영역 */}
      <div className="erp-section-group flex-shrink-0">
       <div className="erp-section-toolbar">
              <span className="erp-section-title">수수료율 변경정보</span>
       </div>
       <div className="flex flex-col border border-gray-300 bg-[#fefefe]">
          <div className="flex items-center px-3 py-1.5 gap-6">
             <div className="flex items-center gap-1 w-[320px]">
                 <span className="text-gray-700 font-bold w-16">상품코드</span>
                 <Input className="h-6 w-[100px] text-[11px] bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500 font-bold" maxLength={13} value={infoPCode} onChange={e => setInfoPCode(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={handleInfoPCodeKeyDown} placeholder="입력 후 엔터" />
                 <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0" onClick={() => { setProdModalTarget('info'); setIsProdModalOpen(true); }}>
                     <Search className="w-3.5 h-3.5 text-white" />
                 </Button>
                 <Input className="h-6 flex-1 text-[11px] bg-gray-100" readOnly tabIndex={-1} value={infoPName} />
             </div>
             
             <div className="flex items-center gap-1">
                 <Checkbox checked={isApplyReason} onCheckedChange={(c) => setIsApplyReason(!!c)} className="rounded-[2px]" />
                 <span className="text-gray-700 font-bold ml-1">변경사유</span>
                 <Select value={infoReason} onValueChange={setInfoReason} disabled={!isApplyReason}>
                     <SelectTrigger className="h-6 w-[120px] text-[11px] bg-white disabled:bg-gray-100 disabled:opacity-70"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="업체요청">업체요청</SelectItem>
                         <SelectItem value="기타">기타</SelectItem>
                     </SelectContent>
                 </Select>
             </div>
             <div className="flex items-center gap-1">
                 <Checkbox checked={isApplyFeeRate} onCheckedChange={(c) => setIsApplyFeeRate(!!c)} className="rounded-[2px]" />
                 <span className="text-gray-700 font-bold ml-1">변경수수료율</span>
                 <Input 
                     className="h-6 w-[60px] text-[11px] bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500 text-right font-bold disabled:bg-gray-100 disabled:opacity-70" 
                     maxLength={3} 
                     value={infoFeeRate} 
                     onChange={e => setInfoFeeRate(e.target.value.replace(/[^0-9]/g, ''))} 
                     disabled={!isApplyFeeRate}
                 />
                 <span className="text-gray-500">%</span>
             </div>
             
             <Button className="erp-btn-action" onClick={handleBatchApply}>
                 <CheckCircle className="w-3 h-3 mr-1"/> 일괄적용
             </Button>
          </div>
       </div>
      </div>

      {/* 3. 그리드 영역 (수수료율 변경내역) */}
      <div className="erp-section-group min-h-0 flex-1">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">수수료율 변경내역</span>
          <div className="flex gap-1.5 pr-1">
              <Button className="erp-btn-action" onClick={handleSave}>
                  <Save className="w-3 h-3 mr-1"/> 저장
              </Button>
              <div className="w-[1px] h-4 bg-gray-300 mx-1 self-center"></div>
              
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              
              <Button className="erp-btn-action" onClick={handleExcelTemplateDownload}>
                  <FileDown className="w-3 h-3 mr-1"/> 엑셀양식
              </Button>
              <Button className="erp-btn-action" onClick={handleExcelUploadClick}>
                  <FileUp className="w-3 h-3 mr-1"/> 엑셀업로드
              </Button>
              <Button className="erp-btn-action" onClick={handleExcelDownload}>
                  <FileDown className="w-3 h-3 mr-1"/> 엑셀다운
              </Button>
          </div>
       </div>
       <div className="flex flex-col flex-1 border border-gray-300 bg-white overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
              <Table className="table-fixed min-w-[1500px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">
                              <Checkbox checked={listData.length > 0 && selectedRows.length === listData.length} onCheckedChange={handleSelectAll} className="rounded-[2px]" />
                          </TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">매입처코드</TableHead>
                          <TableHead className="w-[130px] text-center font-bold text-gray-900 border-r border-gray-300">매입처</TableHead>
                          <TableHead className="w-[130px] text-center font-bold text-gray-900 border-r border-gray-300">매입처별품목코드명</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">상품상태</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">정가</TableHead>
                          
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">수수료율</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 text-blue-700">원가</TableHead>
                          
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">변경수수료율</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 text-red-600 bg-red-50">변경원가</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">변경사유</TableHead>
                          
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">최종수정일</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900">변경사번</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {listData.map((row) => {
                          const isSelected = selectedRows.includes(row.id);
                          return (
                              <TableRow key={row.id} className={cn("h-8 border-b border-gray-200 transition-colors", isSelected ? "bg-blue-50/50" : "bg-white hover:bg-gray-50")}>
                                  <TableCell className="text-center border-r border-gray-200 p-0">
                                      <Checkbox checked={isSelected} onCheckedChange={(c) => handleSelectRow(row.id, c as boolean)} className="rounded-[2px]" />
                                  </TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2 font-bold" title={row.pName}>{row.pName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.suppCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.suppName}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2 text-gray-500">{row.suppItemName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.status}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.listPrice.toLocaleString()}원</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.baseFeeRate}%</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-blue-700">{row.baseCost.toLocaleString()}원</TableCell>
                                  
                                  {/* 입력: 변경수수료율 */}
                                  <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/20">
                                      <Input 
                                          className="h-full w-full border-none text-right pr-2 text-[12px] font-bold text-gray-800 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                          maxLength={3}
                                          value={row.changeFeeRate} 
                                          onChange={e => handleRowChange(row.id, 'changeFeeRate', e.target.value.replace(/[^0-9]/g, ''))}
                                      />
                                  </TableCell>
                                  {/* 자동계산: 변경원가 */}
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-red-600 bg-red-50/30">
                                      {row.changeCost > 0 ? `${row.changeCost.toLocaleString()}원` : '-'}
                                  </TableCell>
                                  {/* 입력: 변경사유 */}
                                  <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/20">
                                      <Select value={row.changeReason} onValueChange={(val) => handleRowChange(row.id, 'changeReason', val)}>
                                          <SelectTrigger className="h-full w-full border-none text-[11px] bg-transparent rounded-none focus:ring-1 focus:ring-blue-500 justify-center">
                                              <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="업체요청">업체요청</SelectItem>
                                              <SelectItem value="기타">기타</SelectItem>
                                          </SelectContent>
                                      </Select>
                                  </TableCell>

                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.modDate}</TableCell>
                                  <TableCell className="text-center text-gray-500">{row.modEmp}</TableCell>
                              </TableRow>
                          );
                      })}
                      
                      {listData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 14 }).map((_, j) => (
                              <TableCell key={j} className={j < 13 ? "border-r border-gray-200" : ""}></TableCell>
                            ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
       </div>
      </div>

      <SupplierSearchModal 
          isOpen={isSuppModalOpen} 
          onClose={() => setIsSuppModalOpen(false)} 
          initialSearchName={searchSuppName}
          customData={specificSuppliers}
          onSelect={(item) => { setSuppCode(item.code); setSuppName(item.name); }} 
      />
      <SupplierItemSearchModal 
          isOpen={isSuppItemModalOpen} 
          onClose={() => setIsSuppItemModalOpen(false)} 
          supplierCode={suppCode}
          initialSearchName={suppItemName || suppItemCode} 
          onSelect={(item) => { setSuppItemCode(item.code); setSuppItemName(item.name); }} 
      />
      
      <ProductSearchModal 
          isOpen={isProdModalOpen} 
          onClose={() => setIsProdModalOpen(false)} 
          initialSearchName={prodModalTarget === 'search' ? pName || pCode : infoPName || infoPCode} 
          onSelect={(item) => { 
              if (prodModalTarget === 'search') {
                  setPCode(item.productCode); setPName(item.productName);
              } else {
                  setInfoPCode(item.productCode); setInfoPName(item.productName);
                  addProductToGrid(item);
              }
          }} 
      />
    </div>
  );
}