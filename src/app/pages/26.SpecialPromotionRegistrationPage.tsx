import React, { useState, useRef } from 'react';
import { Calendar, Search, Download, Save, FileUp, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, addDays } from 'date-fns';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { ProductCodeSearchField } from '../components/ProductCodeSearchField';

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

const headerBtnClass = "erp-btn-header";
const actionBtnClass = "erp-btn-action";

type MasterData = {
    id: string;
    name: string;
    discType: string;
    target: string;
    start: string;
    end: string;
    ignoreMargin: string;
    note: string;
    regDate: string;
    regEmp: string;
};

type GridData = {
    id: string;
    pCode: string;
    pName: string;
    status: string;
    suppCode: string;     
    suppName: string;
    suppItemCode: string;
    baseCost: number;     
    listPrice: number;    
    baseFeeRate: number;     
    changeFeeRate: string;   
    changeCost: number;   
    discountRate: string; 
    discountAmt: string;  
    discountPrice: string; 
};

export default function SpecialPromotionRegistrationPage() {
  const { products, suppliers } = useMockData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 조회 영역 State
  const [sPromoCode, setSPromoCode] = useState('');
  const [sPromoName, setSPromoName] = useState('');
  const [sProdCode, setSProdCode] = useState('');
  const [sProdName, setSProdName] = useState('');
  const [sDateStart, setSDateStart] = useState('');
  const [sDateEnd, setSDateEnd] = useState('');
  const [sDiscType, setSDiscType] = useState('전체');

  // 2. 마스터 영역 State
  const [masterList, setMasterList] = useState<MasterData[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  const [promoProductsMap, setPromoProductsMap] = useState<Record<string, GridData[]>>({});

  // 3. 기획특가프로모션정보 폼 State
  const initialForm = {
      id: '', name: '', discType: '정율할인', target: '전체',
      start: format(new Date(), 'yyyy-MM-dd'), end: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      ignoreMargin: 'N', note: ''
  };
  const [promoForm, setPromoForm] = useState(initialForm);

  // 4. 상품 그리드 영역 State
  const [gridData, setGridData] = useState<GridData[]>([]);
  const [selectedGridRows, setSelectedGridRows] = useState<string[]>([]);
  
  // 5. 상품 일괄적용 State (체크박스 제어 추가)
  const [batchPCode, setBatchPCode] = useState('');
  const [batchPName, setBatchPName] = useState('');
  
  const [isApplyFeeRate, setIsApplyFeeRate] = useState(false);
  const [batchChangeFeeRate, setBatchChangeFeeRate] = useState('');
  
  const [isApplyDiscRate, setIsApplyDiscRate] = useState(false);
  const [batchDiscRate, setBatchDiscRate] = useState('');
  
  const [isApplyDiscAmt, setIsApplyDiscAmt] = useState(false);
  const [batchDiscAmt, setBatchDiscDiscAmt] = useState('');
  
  const [isApplyDiscPrice, setIsApplyDiscPrice] = useState(false);
  const [batchDiscPrice, setBatchDiscPrice] = useState('');

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodModalTarget, setProdModalTarget] = useState<'search'|'batch'|null>(null);

  const handleSearch = () => {
      const mockMasters: MasterData[] = [
          { id: '1578612841231', name: '여름맞이 특가전', discType: '정율할인', target: '전체', start: '2026-06-01', end: '2026-06-30', ignoreMargin: 'N', note: '여름 시즌 기획', regDate: '2026-05-15', regEmp: '홍길동' },
          { id: '1578612841232', name: '신학기 균일가', discType: '균일가', target: '회원전체', start: '2026-02-20', end: '2026-03-10', ignoreMargin: 'Y', note: '신학기 프로모션', regDate: '2026-02-01', regEmp: '김철수' }
      ];
      setMasterList(mockMasters);
      handleMasterFormReset(); 
  };

  const handleSearchReset = () => {
      setSPromoCode(''); setSPromoName(''); setSProdCode(''); setSProdName('');
      setSDateStart(''); setSDateEnd(''); setSDiscType('전체');
      setMasterList([]);
      handleMasterFormReset();
  };

  const handleMasterSelect = (master: MasterData) => {
      setSelectedMasterId(master.id);
      setPromoForm({
          id: master.id, name: master.name, discType: master.discType, target: master.target,
          start: master.start, end: master.end, ignoreMargin: master.ignoreMargin, note: master.note
      });
      setGridData(promoProductsMap[master.id] || []);
      setSelectedGridRows([]);
  };

  const handleMasterFormReset = () => {
      setSelectedMasterId(null);
      setPromoForm(initialForm);
      setGridData([]);
      setSelectedGridRows([]);
  };

  const handleMasterFormExcelDownload = () => {
      if (!promoForm.id) return alert("다운로드할 프로모션 정보가 없습니다.");
      alert(`[${promoForm.name}] ���보 엑셀 다운로드 (모의)`);
  };

  const handleMasterFormDelete = () => {
      if (!selectedMasterId) return alert("삭제할 프로모션을 상단 리스트에서 선택해주세요.");
      if (confirm(`선택한 [${promoForm.name}] 프로모션을 삭제하시겠습니까?`)) {
          setMasterList(prev => prev.filter(m => m.id !== selectedMasterId));
          handleMasterFormReset();
      }
  };

  const handleMasterFormSave = () => {
      if (!promoForm.name) return alert("기획특가프로모션명을 입력해주세요.");
      let savedId = promoForm.id;
      if (!savedId) {
          savedId = Date.now().toString();
          const newMaster: MasterData = {
              id: savedId, name: promoForm.name, discType: promoForm.discType, target: promoForm.target,
              start: promoForm.start, end: promoForm.end, ignoreMargin: promoForm.ignoreMargin, note: promoForm.note,
              regDate: format(new Date(), 'yyyy-MM-dd'), regEmp: '12951'
          };
          setMasterList(prev => [newMaster, ...prev]);
          setPromoForm(p => ({ ...p, id: savedId }));
      } else {
          setMasterList(prev => prev.map(m => m.id === savedId ? { ...m, name: promoForm.name, target: promoForm.target, start: promoForm.start, end: promoForm.end, ignoreMargin: promoForm.ignoreMargin, note: promoForm.note } : m));
      }
      setSelectedMasterId(savedId);
      alert(`[${promoForm.name}] 기획특가프로모션정보가 저장되었습니다.`);
  };

  const handleGridReset = () => {
      setGridData([]);
      setSelectedGridRows([]);
  };

  const handleGridExcelDownload = () => {
      if (gridData.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const ws = XLSX.utils.json_to_sheet(gridData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "특가프로모션상품");
      XLSX.writeFile(wb, `기획특가프로모션상품_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleDeleteGridRows = () => {
      if (selectedGridRows.length === 0) return alert("삭제할 상품을 선택해주세요.");
      setGridData(prev => prev.filter(r => !selectedGridRows.includes(r.id)));
      setSelectedGridRows([]);
  };

  const handleGridSave = () => {
      if (!selectedMasterId) return alert("상단의 기획특가프로모션 정보를 먼저 저장하거나 선택해주세요.");
      if (gridData.length === 0) return alert("저장할 상품 정보가 없습니다.");
      
      setPromoProductsMap(prev => ({ ...prev, [selectedMasterId]: gridData }));
      alert(`총 ${gridData.length}건의 상품 정보가 [${promoForm.name}] 프로모션에 저장되었습니다.`);
  };

  const createGridRow = (p: any, s: any): GridData => {
      const baseFeeRate = Math.round((Math.random() * 20 + 50) * 100) / 100; 
      const listPrice = p.listPrice || 10000;
      const baseCost = Math.round(listPrice * (baseFeeRate / 100));

      return {
          id: `row-${Date.now()}-${p.productCode}-${Math.random()}`,
          pCode: p.productCode, pName: p.productName, status: p.productStatus || '정상',
          suppCode: s.code, suppName: s.name, suppItemCode: p.supplierItemCode || '001',
          listPrice, baseFeeRate, baseCost,
          changeFeeRate: '', changeCost: 0, discountRate: '', discountAmt: '', discountPrice: ''
      };
  };

  const validateAndAddProduct = (p: any) => {
      if (!selectedMasterId) {
          alert("상품을 추가하기 전에 상단 프로모션 정보를 먼저 등록 및 선택해주세요.");
          return false;
      }
      
      const s = suppliers.find(x => x.code === p.supplierCode);
      if (!s || s.purchaseTypeCode !== 503) {
          alert("해당 상품의 매입처는 특정매입이 아닙니다. 등록 불가합니다.");
          return false;
      }
      if (gridData.length > 0 && gridData[0].suppCode !== s.code) {
          alert("동일한 매입처의 상품만 등록 가능합니다.");
          return false;
      }
      if (gridData.some(g => g.pCode === p.productCode)) {
          alert("이미 등록된 상품입니다.");
          return false;
      }
      setGridData(prev => [createGridRow(p, s), ...prev]);
      return true;
  };

  const handleBatchPCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          if (!batchPCode.trim()) return;
          const p = products.find(x => x.productCode === batchPCode.trim());
          if (!p) return alert("해당 상품을 찾을 수 없습니다.");
          if (validateAndAddProduct(p)) {
              setBatchPName(p.productName);
              setTimeout(() => { setBatchPCode(''); setBatchPName(''); }, 500);
          } else {
              setBatchPCode(''); setBatchPName('');
          }
      }
  };

  const recalcRow = (r: GridData, field: string, val: string): GridData => {
      const updated = { ...r, [field]: val };
      const numVal = Number(val) || 0;
      const lp = r.listPrice;

      if (field === 'changeFeeRate') { 
          updated.changeCost = numVal > 0 ? Math.round(lp * (numVal / 100)) : 0;
      } else if (field === 'discountRate') {
          updated.discountPrice = numVal > 0 ? String(Math.round(lp * (1 - numVal / 100))) : '';
          updated.discountAmt = numVal > 0 ? String(lp - Number(updated.discountPrice)) : '';
      } else if (field === 'discountAmt') {
          updated.discountPrice = numVal > 0 ? String(lp - numVal) : '';
          updated.discountRate = numVal > 0 ? ((numVal / lp) * 100).toFixed(1) : '';
      } else if (field === 'discountPrice') {
          updated.discountAmt = numVal > 0 ? String(lp - numVal) : '';
          updated.discountRate = numVal > 0 ? ((Number(updated.discountAmt) / lp) * 100).toFixed(1) : '';
      }
      return updated;
  };

  const handleGridRowChange = (id: string, field: string, val: string) => {
      setGridData(prev => prev.map(r => r.id === id ? recalcRow(r, field, val) : r));
  };

  const handleBatchApply = () => {
      if (selectedGridRows.length === 0) return alert("일괄 적용할 항목을 체크해주세요.");
      if (!isApplyFeeRate && !isApplyDiscRate && !isApplyDiscAmt && !isApplyDiscPrice) {
          return alert("일괄 적용할 항목의 체크박스를 선택해주세요.");
      }

      setGridData(prev => prev.map(r => {
          if (selectedGridRows.includes(r.id)) {
              let updated = { ...r };
              // ★ 체크된 항목만 선별적으로 일괄 적용
              if (isApplyFeeRate && batchChangeFeeRate) updated = recalcRow(updated, 'changeFeeRate', batchChangeFeeRate);
              if (isApplyDiscRate && batchDiscRate) updated = recalcRow(updated, 'discountRate', batchDiscRate);
              if (isApplyDiscAmt && batchDiscAmt) updated = recalcRow(updated, 'discountAmt', batchDiscAmt);
              if (isApplyDiscPrice && batchDiscPrice) updated = recalcRow(updated, 'discountPrice', batchDiscPrice);
              return updated;
          }
          return r;
      }));
  };

  const handleSelectAllGrid = (checked: boolean) => {
      if (checked) setSelectedGridRows(gridData.map(r => r.id));
      else setSelectedGridRows([]);
  };

  const handleSelectGridRow = (id: string, checked: boolean) => {
      if (checked) setSelectedGridRows(prev => [...prev, id]);
      else setSelectedGridRows(prev => prev.filter(rId => rId !== id));
  };

  const handleExcelUploadClick = () => {
      if (!selectedMasterId) return alert("상품을 등록할 프로모션 정보를 먼저 저장하거나 위에서 선택해주세요.");
      fileInputRef.current?.click();
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const data = XLSX.utils.sheet_to_json(ws);

              let successCount = 0, failCount = 0, failReason = '';
              const newRows: GridData[] = [];
              let currentSuppCode = gridData.length > 0 ? gridData[0].suppCode : null;

              data.forEach((row: any) => {
                  const code = row['상품코드'] || row['상품코드 '] || Object.values(row)[0];
                  if (!code) return;

                  const p = products.find(x => x.productCode === String(code).trim());
                  if (!p) { failCount++; return; }

                  const s = suppliers.find(x => x.code === p.supplierCode);
                  if (!s || s.purchaseTypeCode !== 503) { failCount++; failReason = '특정매입 아님'; return; }
                  if (currentSuppCode && currentSuppCode !== s.code) { failCount++; failReason = '동일 매입처 아님'; return; }
                  
                  if (!currentSuppCode) currentSuppCode = s.code;
                  if (gridData.some(g => g.pCode === p.productCode) || newRows.some(g => g.pCode === p.productCode)) {
                      failCount++; failReason = '중복 상품'; return;
                  }

                  newRows.push(createGridRow(p, s));
                  successCount++;
              });

              if (newRows.length > 0) setGridData(prev => [...newRows, ...prev]);
              alert(`[파일 업로드 결과]\n성공: ${successCount}건\n실패: ${failCount}건${failCount > 0 ? ` (${failReason} 등)` : ''}`);
          } catch (error) {
              console.error(error); alert("엑셀 파일 파싱 중 오류가 발생했습니다.");
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-4">
      {/* 페이지 타이틀 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">기획특가프로모션등록</h2>
      </div>

      {/* 1. 상단 조회 영역 */}
      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             <Label className="border-b border-gray-200">기획특가프로모션코드</Label>
             <div className="p-1 border-b border-r border-gray-200">
                 <Input className="h-6 w-[200px] text-[11px] font-bold bg-white" value={sPromoCode} onChange={e => setSPromoCode(e.target.value.replace(/[^0-9]/g, ''))} />
             </div>
             
             <Label className="border-b border-gray-200">기획특가프로모션명</Label>
             <div className="p-1 border-b border-r border-gray-200">
                 <Input className="h-6 w-full text-[11px] bg-white" value={sPromoName} onChange={e => setSPromoName(e.target.value)} />
             </div>

             <Label className="border-b border-gray-200">상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-b border-gray-200">
                 <ProductCodeSearchField
                   productCode={sProdCode}
                   setProductCode={setSProdCode}
                   productName={sProdName}
                   setProductName={setSProdName}
                 />
             </div>

             <Label className="border-gray-200" required>행사기간</Label>
             <div className="flex items-center p-1 border-r border-gray-200 px-3">
                 <DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} />
             </div>

             <Label className="border-gray-200">기획특가할인종류</Label>
             <div className="p-1 col-span-3">
                 <Select value={sDiscType} onValueChange={setSDiscType}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem><SelectItem value="정율할인">정율할인</SelectItem>
                         <SelectItem value="정액할인">정액할인</SelectItem><SelectItem value="균일가">균일가</SelectItem>
                     </SelectContent>
                 </Select>
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
             <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
             <Button className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>

      {/* 2. 마스터 목록 */}
      <div className="erp-section-group flex-shrink-0">
       <div className="erp-section-toolbar">
          <div className="erp-section-title">기획특가프로모션 내역</div>
       </div>
       <div className="border border-gray-300 bg-white flex flex-col">
           <div className="overflow-auto bg-white max-h-[150px] custom-scrollbar">
              <Table className="table-fixed min-w-[1000px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8 border-b border-gray-300">
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">프로모션코드</TableHead>
                          <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300">프로모션명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">할인종류</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">대상고객</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">행사시작일</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">행사종료일</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">등록일자</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">등록자</TableHead>
                          <TableHead className="text-center font-bold text-gray-900">비고</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {masterList.map((row) => (
                          <TableRow 
                              key={row.id} 
                              className={cn("h-7 cursor-pointer border-b border-gray-200 transition-colors", selectedMasterId === row.id ? "bg-blue-100/50" : "hover:bg-gray-50")}
                              onClick={() => handleMasterSelect(row)}
                          >
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.id}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2 font-bold text-blue-800">{row.name}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.discType}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.target}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.start}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.end}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.regDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.regEmp}</TableCell>
                              <TableCell className="text-left truncate pl-2 text-gray-600">{row.note}</TableCell>
                          </TableRow>
                      ))}
                      {masterList.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-m-${i}`} className="h-7 border-b border-gray-200 bg-white">
                            {Array.from({ length: 9 }).map((_, j) => (
                              <TableCell key={j} className={j < 8 ? "border-r border-gray-200" : ""}></TableCell>
                            ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
           </div>
       </div>
      </div>

      {/* 3. 기획특가프로모션 정보 (마스터 폼) */}
      <div className="erp-section-group flex-shrink-0">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">기획특가프로모션정보</span>
          <div className="flex gap-1">
              <Button variant="outline" className={actionBtnClass} onClick={handleMasterFormReset}>초기화</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleMasterFormExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleMasterFormDelete}>삭제</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleMasterFormSave}>저장</Button>
          </div>
       </div>
       <div className="flex flex-col border border-gray-300 bg-[#fefefe]">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             <Label className="border-b border-gray-200">기획특가프로모션코드</Label>
             <div className="p-1 border-b border-r border-gray-200 flex items-center px-2">
                 <span className="text-[11px] font-bold text-gray-500">{promoForm.id || '자동채번'}</span>
             </div>
             
             <Label className="border-b border-gray-200" required>기획특가프로션명</Label>
             <div className="p-1 border-b border-r border-gray-200 col-span-3">
                 <Input className="h-6 w-full text-[11px] bg-white border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500" value={promoForm.name} onChange={e => setPromoForm(p => ({...p, name: e.target.value}))} />
             </div>

             <Label className="border-b border-gray-200" required>기획특가할인종류</Label>
             <div className="p-1 border-b border-r border-gray-200">
                 <Select value={promoForm.discType} onValueChange={v => setPromoForm(p => ({...p, discType: v}))} disabled={!!selectedMasterId}>
                     <SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="정율할인">정율할인</SelectItem><SelectItem value="정액할인">정액할인</SelectItem><SelectItem value="균일가">균일가</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-b border-gray-200" required>대상고객</Label>
             <div className="p-1 border-b border-r border-gray-200">
                 <Select value={promoForm.target} onValueChange={v => setPromoForm(p => ({...p, target: v}))}>
                     <SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         <SelectItem value="비회원">비회원</SelectItem>
                         <SelectItem value="회원전체">회원전체</SelectItem>
                         <SelectItem value="프렌즈">프렌즈</SelectItem>
                         <SelectItem value="실버">실버</SelectItem>
                         <SelectItem value="골드">골드</SelectItem>
                         <SelectItem value="플레티늄">플레티늄</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-b border-gray-200" required>행사기간</Label>
             <div className="flex items-center p-1 border-b border-gray-200 px-3">
                 <DateRangeInput startVal={promoForm.start} endVal={promoForm.end} onStartChange={(v: string) => setPromoForm(p => ({...p, start: v}))} onEndChange={(v: string) => setPromoForm(p => ({...p, end: v}))} />
             </div>

             <Label className="border-gray-200">최소마진율 무시</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={promoForm.ignoreMargin} onValueChange={v => setPromoForm(p => ({...p, ignoreMargin: v}))}>
                     <SelectTrigger className="h-6 w-[80px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                 </Select>
             </div>

             <Label className="border-gray-200">비고</Label>
             <div className="p-1 col-span-3">
                 <Input className="h-6 w-full text-[11px] bg-white" value={promoForm.note} onChange={e => setPromoForm(p => ({...p, note: e.target.value}))} />
             </div>
          </div>
       </div>
      </div>

      {/* 4. 기획특가프로모션상품정보 (그리드 및 일괄적용 툴바) */}
      <div className="erp-section-group min-h-0 flex-1">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">기획특가프로모션상품정보</span>
          <div className="flex gap-1">
              <Button variant="outline" className={actionBtnClass} onClick={handleGridReset}>초기화</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleGridExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleDeleteGridRows}>삭제</Button>
              <Button variant="outline" className={actionBtnClass} onClick={handleGridSave}>저장</Button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
              <Button variant="outline" className={actionBtnClass} onClick={handleExcelUploadClick}>파일등록</Button>
          </div>
       </div>
       <div className="flex flex-col flex-1 border border-gray-300 bg-white overflow-hidden">
          
          <div className="flex items-center p-1.5 border-b border-gray-300 bg-[#eef3f8] gap-4">
             <div className="flex items-center gap-1 ml-2">
                 <Label className="border-b border-gray-200">상품코드</Label>
                 <Input className="h-6 w-[100px] text-[11px] bg-white font-bold" maxLength={13} placeholder="입력 후 엔터" value={batchPCode} onChange={e => setBatchPCode(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={handleBatchPCodeKeyDown} />
                 <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0" onClick={() => { setProdModalTarget('batch'); setIsProdModalOpen(true); }}><Search className="w-3.5 h-3.5 text-white" /></Button>
                 <Input className="h-6 w-[120px] text-[11px] bg-gray-100" readOnly tabIndex={-1} value={batchPName} />
             </div>
             
             <div className="w-[1px] h-4 bg-gray-400"></div>

             <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1">
                     <Checkbox checked={isApplyFeeRate} onCheckedChange={(c) => setIsApplyFeeRate(!!c)} className="rounded-[2px]" />
                     <span className="text-gray-700 font-bold ml-1">변경수수료율(%)</span>
                     <Input 
                         className="h-6 w-[50px] text-[11px] bg-white text-right font-bold disabled:bg-gray-100 disabled:opacity-70" 
                         maxLength={5} 
                         value={batchChangeFeeRate} 
                         onChange={e => {
                             let v = e.target.value.replace(/[^0-9.]/g, '');
                             if (v.includes('.')) {
                                 const parts = v.split('.');
                                 v = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
                             }
                             setBatchChangeFeeRate(v);
                         }} 
                         disabled={!isApplyFeeRate}
                     />
                 </div>
                 <div className="flex items-center gap-1">
                     <Checkbox checked={isApplyDiscRate} onCheckedChange={(c) => setIsApplyDiscRate(!!c)} className="rounded-[2px]" disabled={promoForm.discType !== '정율할인'} />
                     <span className={cn("text-gray-700 font-bold ml-1", promoForm.discType !== '정율할인' && "text-gray-400")}>할인율(%)</span>
                     <Input className="h-6 w-[50px] text-[11px] bg-white text-right font-bold disabled:bg-gray-100 disabled:opacity-70" maxLength={3} value={batchDiscRate} onChange={e => setBatchDiscRate(e.target.value.replace(/[^0-9]/g, ''))} disabled={!isApplyDiscRate || promoForm.discType !== '정율할인'} />
                 </div>
                 <div className="flex items-center gap-1">
                     <Checkbox checked={isApplyDiscAmt} onCheckedChange={(c) => setIsApplyDiscAmt(!!c)} className="rounded-[2px]" disabled={promoForm.discType !== '정액할인'} />
                     <span className={cn("text-gray-700 font-bold ml-1", promoForm.discType !== '정액할인' && "text-gray-400")}>할인금액</span>
                     <Input className="h-6 w-[70px] text-[11px] bg-white text-right font-bold disabled:bg-gray-100 disabled:opacity-70" value={batchDiscAmt} onChange={e => setBatchDiscDiscAmt(e.target.value.replace(/[^0-9]/g, ''))} disabled={!isApplyDiscAmt || promoForm.discType !== '정액할인'} />
                 </div>
                 <div className="flex items-center gap-1">
                     <Checkbox checked={isApplyDiscPrice} onCheckedChange={(c) => setIsApplyDiscPrice(!!c)} className="rounded-[2px]" disabled={promoForm.discType !== '균일가'} />
                     <span className={cn("text-gray-700 font-bold ml-1", promoForm.discType !== '균일가' && "text-gray-400")}>할인판매가</span>
                     <Input className="h-6 w-[70px] text-[11px] bg-white text-right font-bold disabled:bg-gray-100 disabled:opacity-70" value={batchDiscPrice} onChange={e => setBatchDiscPrice(e.target.value.replace(/[^0-9]/g, ''))} disabled={!isApplyDiscPrice || promoForm.discType !== '균일가'} />
                 </div>
                 <Button className="erp-btn-action" onClick={handleBatchApply}>
                     <CheckCircle className="w-3 h-3 mr-1"/> 일괄적용
                 </Button>
             </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
              <Table className="table-fixed min-w-[1500px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8 border-b border-gray-300">
                          <TableHead className="w-[40px] text-center border-r border-gray-300 p-0">
                              <Checkbox checked={gridData.length > 0 && selectedGridRows.length === gridData.length} onCheckedChange={handleSelectAllGrid} className="rounded-[2px]" />
                          </TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">상품상태</TableHead>
                          <TableHead className="w-[130px] text-center font-bold text-gray-900 border-r border-gray-300">매입처</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목코드</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 text-blue-700">원가</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">정가</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">수수료율</TableHead>
                          
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">변경수수료율</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 text-red-600 bg-red-50">변경원가</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">할인율</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">할인금액</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-white bg-blue-600">할인판매가</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => {
                          const isSelected = selectedGridRows.includes(row.id);
                          return (
                              <TableRow key={row.id} className={cn("h-8 border-b border-gray-200 transition-colors", isSelected ? "bg-blue-50/50" : "bg-white hover:bg-gray-50")}>
                                  <TableCell className="text-center border-r border-gray-200 p-0">
                                      <Checkbox checked={isSelected} onCheckedChange={(c) => handleSelectGridRow(row.id, c as boolean)} className="rounded-[2px]" />
                                  </TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2 font-bold" title={row.pName}>{row.pName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.status}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.suppName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.suppItemCode}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-blue-700">{row.baseCost.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.listPrice.toLocaleString()}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.baseFeeRate.toFixed(2)}%</TableCell>
                                  
                                  <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/20">
                                      <Input 
                                          className="h-full w-full border-none text-right pr-2 text-[12px] font-bold text-gray-800 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                          maxLength={5} 
                                          value={row.changeFeeRate} 
                                          onChange={e => {
                                              let v = e.target.value.replace(/[^0-9.]/g, '');
                                              if (v.includes('.')) {
                                                  const parts = v.split('.');
                                                  v = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
                                              }
                                              handleGridRowChange(row.id, 'changeFeeRate', v);
                                          }}
                                      />
                                  </TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-red-600 bg-red-50/30">
                                      {row.changeCost > 0 ? row.changeCost.toLocaleString() : '-'}
                                  </TableCell>
                                  <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/20">
                                      <Input 
                                          className="h-full w-full border-none text-right pr-2 text-[12px] font-bold text-gray-800 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50" 
                                          maxLength={5} 
                                          value={row.discountRate} 
                                          onChange={e => {
                                              let v = e.target.value.replace(/[^0-9.]/g, '');
                                              if (v.includes('.')) {
                                                  const parts = v.split('.');
                                                  v = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
                                              }
                                              handleGridRowChange(row.id, 'discountRate', v);
                                          }}
                                          disabled={promoForm.discType !== '정율할인'}
                                      />
                                  </TableCell>
                                  <TableCell className="p-0 border-r border-gray-200 bg-yellow-50/20">
                                      <Input 
                                          className="h-full w-full border-none text-right pr-2 text-[12px] font-bold text-gray-800 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50" 
                                          value={row.discountAmt ? Number(row.discountAmt).toLocaleString() : ''} onChange={e => handleGridRowChange(row.id, 'discountAmt', e.target.value.replace(/[^0-9]/g, ''))}
                                          disabled={promoForm.discType !== '정액할인'}
                                      />
                                  </TableCell>
                                  <TableCell className="p-0 bg-yellow-50/20">
                                      <Input 
                                          className="h-full w-full border-none text-right pr-2 text-[12px] font-bold text-blue-700 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50" 
                                          value={row.discountPrice ? Number(row.discountPrice).toLocaleString() : ''} onChange={e => handleGridRowChange(row.id, 'discountPrice', e.target.value.replace(/[^0-9]/g, ''))}
                                          disabled={promoForm.discType !== '균일가'}
                                      />
                                  </TableCell>
                              </TableRow>
                          );
                      })}
                      {gridData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-g-${i}`} className="h-8 border-b border-gray-200 bg-white">
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

      <ProductSearchModal 
          isOpen={isProdModalOpen} 
          onClose={() => setIsProdModalOpen(false)} 
          initialSearchName={prodModalTarget === 'search' ? sProdName || sProdCode : batchPName || batchPCode} 
          onSelect={(item) => { 
              if (prodModalTarget === 'search') {
                  setSProdCode(item.productCode); setSProdName(item.productName);
              } else {
                  if (validateAndAddProduct(item)) {
                      setBatchPCode(''); setBatchPName('');
                  }
              }
          }} 
      />
    </div>
  );
}