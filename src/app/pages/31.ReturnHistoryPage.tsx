import React, { useState } from 'react';
import { Calendar, Search, Download, CheckCircle, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format, subMonths } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { ProductCodeSearchField } from '../components/ProductCodeSearchField';
import { SupplierSearchModal } from '../components/SupplierSearchModal';

// -------------------------------------------------------------------
// 1. 공통 헬퍼 컴포넌트
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// 2. 타입 정의
// -------------------------------------------------------------------
type ReturnMaster = {
    id: string; no: number;
    suppCode: string; suppItemName: string;
    returnDate: string; ledgerDate: string; returnNo: string;
    typesCount: number; totalQty: number;
    totalCostAmt: number; totalListAmt: number;
    partnerConfirmed: '확정' | '미확정';
    centerConfirmed: '확정' | '미확정';
};

type ReturnDetail = {
    id: string; masterId: string; no: number;
    returnDate: string; ledgerDate: string;
    orderNo: string; pCode: string; pName: string; 
    purchaseType: string;
    listPrice: number; costPrice: number; purchaseRate: number;
    returnQty: number; unitStr: string; 
    listAmt: number; costAmt: number;
    returnReason: string; returnLoc: string;
};

export default function ReturnHistoryPage() {
  const { products = [], suppliers = [], commonCodes = [] } = useMockData();

  const directSuppliers = suppliers.filter(s => s.purchaseTypeCode !== 503);
  const validCommonCodes = Array.isArray(commonCodes) ? commonCodes : [];
  const filteredReasons = validCommonCodes.filter(c => c.groupCode === 'RTN_REASON');
  
  const returnReasons = filteredReasons.length > 0 
    ? filteredReasons 
    : [
        { codeValue: '01', codeName: '파손/불량' },
        { codeValue: '02', codeName: '오배송/미주문' },
        { codeValue: '03', codeName: '재고조정(단종)' },
        { codeValue: '04', codeName: '과다재고 반품' }
      ];

  const [sProdCode, setSProdCode] = useState('');
  const [sProdName, setSProdName] = useState('');
  const [sOrderNo, setSOrderNo] = useState(''); 
  const [sReturnNo, setSReturnNo] = useState('');
  const [sConfirmStatus, setSConfirmStatus] = useState('전체');
  
  const [sReturnDateStart, setSReturnDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [sReturnDateEnd, setSReturnDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sLedgerDateStart, setSLedgerDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [sLedgerDateEnd, setSLedgerDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [sSuppItemCode, setSSuppItemCode] = useState('');
  const [sSuppItemName, setSSuppItemName] = useState('');
  const [sReturnReason, setSReturnReason] = useState('전체');

  const [masterData, setMasterData] = useState<ReturnMaster[]>([]);
  const [detailData, setDetailData] = useState<ReturnDetail[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);

  // ★ SCM 매입처 조회 (상단 헤더)
  const [scmSupplierCode, setScmSupplierCode] = useState('');
  const [scmSupplierName, setScmSupplierName] = useState('');
  const [isScmSuppModalOpen, setIsScmSuppModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 3. 데이터 제어 함수
  // -------------------------------------------------------------------

  // 상세 데이터를 결정적으로(Deterministic) 생성하는 헬퍼 함수 (엑셀 전체 다운로드를 위해 분리)
  const getDeterministicDetails = (master: ReturnMaster): ReturnDetail[] => {
      const suppProducts = products.filter(p => p.supplierCode === master.suppCode).slice(0, master.typesCount);
      const targetProducts = suppProducts.length > 0 ? suppProducts : products.slice(0, master.typesCount);

      const isAlbum = master.suppCode.startsWith('01B'); 
      const reasons = returnReasons.map(r => r.codeName);

      return targetProducts.map((p, i) => {
          const qty = (i + 1) * 10;
          const cost = Math.floor(p.listPrice * 0.65);
          
          let unitStr = 'EA/1';
          if (!isAlbum) {
              const units = ['BOX/10', 'SET/5', 'EA/1', 'PACK/12'];
              unitStr = units[i % units.length];
          }

          return {
              id: `RD-${master.id}-${i}`,
              masterId: master.id,
              no: i + 1,
              returnDate: master.returnDate,
              ledgerDate: master.ledgerDate,
              orderNo: `ORD-${p.productCode.slice(-5)}`,
              pCode: p.productCode,
              pName: p.productName,
              purchaseType: '외상매입',
              listPrice: p.listPrice,
              costPrice: cost,
              purchaseRate: 65.0,
              returnQty: qty,
              unitStr: unitStr,
              listAmt: p.listPrice * qty,
              costAmt: cost * qty,
              returnReason: reasons[i % reasons.length],
              returnLoc: '부곡리류센터'
          };
      });
  };

  const handleSearch = () => {
      if (!scmSupplierCode) {
          alert('매입처를 먼저 조회해주세요.');
          return;
      }
      // ★ 선택된 매입처 기반 반품 마스터 생성
      const suppProducts = products.filter(p => p.supplierCode === scmSupplierCode);
      const suppName = scmSupplierName || scmSupplierCode;
      const masterCount = Math.min(Math.max(suppProducts.length > 0 ? 3 : 1, 2), 5);
      
      const masters: ReturnMaster[] = Array.from({ length: masterCount }).map((_, idx) => {
          const typesCount = Math.min(suppProducts.length, Math.floor(Math.random() * 4) + 1);
          const totalQty = (idx + 1) * 15 + Math.floor(Math.random() * 30);
          const totalListAmt = totalQty * 8500;
          const totalCostAmt = Math.floor(totalListAmt * 0.65);
          return {
              id: `RM-${idx}`,
              no: idx + 1,
              suppCode: scmSupplierCode,
              suppItemName: suppName,
              returnDate: format(subMonths(new Date(), idx), 'yyyy-MM-dd'),
              ledgerDate: format(subMonths(new Date(), idx), 'yyyy-MM-dd'),
              returnNo: `RTN-${format(new Date(), 'yyMM')}0${idx + 1}`,
              typesCount,
              totalQty,
              totalListAmt,
              totalCostAmt,
              partnerConfirmed: '미확정',
              centerConfirmed: '확정'
          };
      });

      setMasterData(masters);
      setDetailData([]);
      setSelectedMasterId(null);
  };

  const handleReset = () => {
      setSProdCode(''); setSProdName(''); setSOrderNo(''); setSReturnNo('');
      setSConfirmStatus('전체'); setSReturnReason('전체');
      setSSuppItemCode(''); setSSuppItemName('');
      setMasterData([]); setDetailData([]); setSelectedMasterId(null);
  };

  const handleMasterClick = (master: ReturnMaster) => {
      setSelectedMasterId(master.id);
      setDetailData(getDeterministicDetails(master));
  };

  const handleConfirm = () => {
      if (!selectedMasterId) return alert('반품내역을 선택해주세요.');
      const selected = masterData.find(m => m.id === selectedMasterId);
      if (selected?.partnerConfirmed === '확정') return alert('이미 확정된 내역입니다.');
      
      setMasterData(prev => prev.map(m => m.id === selectedMasterId ? { ...m, partnerConfirmed: '확정' } : m));
      alert('협력사 확정 처리되었습니다.');
  };

  // -------------------------------------------------------------------
  // 4. 엑셀 다운로드 로직
  // -------------------------------------------------------------------
  const handleMasterExcelDownload = () => {
      if (masterData.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const data = masterData.map(m => ({
          'NO': m.no,
          '매입처품목명': m.suppItemName,
          '반품일자': m.returnDate,
          '장부반영일': m.ledgerDate,
          '반품번호': m.returnNo,
          '종수': m.typesCount,
          '수량': m.totalQty,
          '원가합계': m.totalCostAmt,
          '정가합계': m.totalListAmt
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "반품내역");
      XLSX.writeFile(wb, "반품내역.xlsx");
  };

  const handleDetailExcelDownload = () => {
      if (detailData.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const data = detailData.map(d => ({
          'NO': d.no,
          '반품일자': d.returnDate,
          '장부반영일': d.ledgerDate,
          '제품번호(주문)': d.orderNo,
          '상품코드': d.pCode,
          '상품명': d.pName,
          '매입구분': d.purchaseType,
          '정가': d.listPrice,
          '원가': d.costPrice,
          '매입율(%)': d.purchaseRate,
          '반품수량': d.returnQty,
          '물류사용단위': d.unitStr,
          '정가합계': d.listAmt,
          '원가합계': d.costAmt,
          '반품사유': d.returnReason,
          '반품처': d.returnLoc
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "선택상세내역");
      XLSX.writeFile(wb, "반품상세내역(단건).xlsx");
  };

  const handleAllDetailExcelDownload = () => {
      if (masterData.length === 0) return alert('다운로드할 데이터가 없습니다. 먼저 조회를 진행해주세요.');
      const allDetails = masterData.flatMap(m => getDeterministicDetails(m).map(d => ({ ...d, _returnNo: m.returnNo })));
      const data = allDetails.map((d, idx) => ({
          'NO': idx + 1,
          '반품일자': d.returnDate,
          '장부반영일': d.ledgerDate,
          '제품번호(주문)': d.orderNo,
          '상품코드': d.pCode,
          '상품명': d.pName,
          '매입구분': d.purchaseType,
          '정가': d.listPrice,
          '원가': d.costPrice,
          '매입율(%)': d.purchaseRate,
          '반품수량': d.returnQty,
          '물류사용단위': d.unitStr,
          '정가합계': d.listAmt,
          '원가합계': d.costAmt,
          '반품사유': d.returnReason,
          '반품처': d.returnLoc,
          '반품번호': d._returnNo
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "전체상세내역");
      XLSX.writeFile(wb, "반품상세내역(전체).xlsx");
  };

  const selectedMaster = masterData.find(m => m.id === selectedMasterId);
  const isConfirmed = selectedMaster?.partnerConfirmed === '확정';

  return (
    <div className="erp-page">
      <div className="erp-page-title">
        <h2>반품내역(문구/음반)</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 교보문고에서 반품한 내역을 조회, 확인하는 메뉴입니다.
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-gray-300 rounded-[2px] bg-white px-2 py-1">
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">매입처</span>
            <Input className="h-5 w-[70px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="코드" value={scmSupplierCode} onChange={(e) => setScmSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierCode.trim()) { const found = suppliers.find(s => s.code === scmSupplierCode.trim()); if (found) setScmSupplierName(found.name); else alert('해당 매입처를 찾을 수 없습니다.'); }}} />
            <Input className="h-5 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="매입처명" value={scmSupplierName} onChange={(e) => setScmSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierName.trim()) { const found = suppliers.find(s => s.name.includes(scmSupplierName.trim())); if (found) { setScmSupplierCode(found.code); setScmSupplierName(found.name); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Search className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800 flex-shrink-0" onClick={() => setIsScmSuppModalOpen(true)} />
        </div>
      </div>

      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
          </div>
          <div className="border border-gray-300 bg-white">
          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr] border-b border-gray-300">
             <Label>상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-r border-gray-200">
                 <ProductCodeSearchField
                   productCode={sProdCode}
                   setProductCode={setSProdCode}
                   productName={sProdName}
                   setProductName={setSProdName}
                 />
             </div>

             <Label>제품번호</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-full text-[11px]" placeholder="주문번호 입력" value={sOrderNo} onChange={e => setSOrderNo(e.target.value)} />
             </div>

             <Label>반품번호</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-full text-[11px]" placeholder="반품번호 입력" value={sReturnNo} onChange={e => setSReturnNo(e.target.value)} />
             </div>

             <Label>확정여부</Label>
             <div className="p-1">
                 <Select value={sConfirmStatus} onValueChange={setSConfirmStatus}>
                     <SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         <SelectItem value="확정">확정</SelectItem>
                         <SelectItem value="미확정">미확정</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-t border-gray-200">반품일자</Label>
             <div className="p-1 border-r border-t border-gray-200 flex items-center px-2">
                 <DateRangeInput startVal={sReturnDateStart} endVal={sReturnDateEnd} onStartChange={setSReturnDateStart} onEndChange={setSReturnDateEnd} />
             </div>

             <Label className="border-t border-gray-200">매입처품목</Label>
             <div className="flex items-center gap-1 p-1 border-r border-t border-gray-200">
                 <Input className="h-6 w-[80px] text-[11px]" placeholder="매입처품목코드" value={sSuppItemCode} readOnly />
                 <Button variant="outline" className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsSuppModalOpen(true)}><Search className="w-3.5 h-3.5 text-white" /></Button>
                 <Input className="h-6 flex-1 text-[11px] bg-gray-100" readOnly tabIndex={-1} value={sSuppItemName} />
             </div>

             <Label className="border-t border-gray-200">반품사유</Label>
             <div className="p-1 border-r border-t border-gray-200">
                 <Select value={sReturnReason} onValueChange={setSReturnReason}>
                     <SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         {returnReasons.map(r => (
                             <SelectItem key={r.codeValue} value={r.codeName}>{r.codeName}</SelectItem>
                         ))}
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-t border-gray-200">장부반영일</Label>
             <div className="p-1 border-t border-gray-200 flex items-center px-2">
                 <DateRangeInput startVal={sLedgerDateStart} endVal={sLedgerDateEnd} onStartChange={setSLedgerDateStart} onEndChange={setSLedgerDateEnd} />
             </div>
          </div>
          </div>{/* close border div */}
          <div className="erp-search-actions">
             <Button className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
             <Button className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
          </div>
      </div>

      <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          {/* 마스터 (반품내역) */}
          <div className="erp-section-group flex-1 flex flex-col min-h-[250px]">
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">반품내역</span>
                 <div className="flex gap-1 pr-1">
                     <Button className="erp-btn-action" onClick={handleMasterExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
                     <div className="w-[1px] h-4 bg-gray-300 self-center mx-1"></div>
                     <Button className="erp-btn-action" disabled={!selectedMasterId || isConfirmed} onClick={handleConfirm}><CheckCircle className="w-3.5 h-3.5 mr-1"/>확정</Button>
                 </div>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[1200px] border-collapse text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300">NO</TableHead>
                              <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목명</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">반품일자</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">장부반영일</TableHead>
                              <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300">반품번호</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">종수</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">수량</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">원가합계</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">정가합계</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">협력사<br/>확정</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">물류센터<br/>확정</TableHead>
                              <TableHead className="w-[70px] text-center font-bold text-gray-900">명세서</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {masterData.map((row) => {
                              const isSelected = selectedMasterId === row.id;
                              return (
                                  <TableRow 
                                      key={row.id} 
                                      className={cn("h-8 border-b border-gray-200 cursor-pointer", isSelected ? "bg-blue-100/50" : "bg-white hover:bg-blue-50/30")}
                                      onClick={() => handleMasterClick(row)}
                                  >
                                      <TableCell className="text-center border-r border-gray-200 font-bold">{row.no}</TableCell>
                                      <TableCell className="text-left border-r border-gray-200 truncate pl-3">{row.suppItemName}</TableCell>
                                      <TableCell className="text-center border-r border-gray-200">{row.returnDate}</TableCell>
                                      <TableCell className="text-center border-r border-gray-200">{row.ledgerDate}</TableCell>
                                      <TableCell className="text-center border-r border-gray-200 font-bold text-blue-700">{row.returnNo}</TableCell>
                                      <TableCell className="text-center border-r border-gray-200">{row.typesCount}</TableCell>
                                      <TableCell className="text-right border-r border-gray-200 pr-3 font-bold bg-yellow-50/30">{row.totalQty.toLocaleString()}</TableCell>
                                      <TableCell className="text-right border-r border-gray-200 pr-3 font-bold">{row.totalCostAmt.toLocaleString()}</TableCell>
                                      <TableCell className="text-right border-r border-gray-200 pr-3 font-bold">{row.totalListAmt.toLocaleString()}</TableCell>
                                      <TableCell className="text-center border-r border-gray-200">
                                          <span className={cn("px-2 py-0.5 rounded-[2px] font-bold text-[10px]", row.partnerConfirmed === '확정' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>{row.partnerConfirmed}</span>
                                      </TableCell>
                                      <TableCell className="text-center border-r border-gray-200">
                                          <span className={cn("px-2 py-0.5 rounded-[2px] font-bold text-[10px]", row.centerConfirmed === '확정' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>{row.centerConfirmed}</span>
                                      </TableCell>
                                      <TableCell className="text-center p-1">
                                          <Button variant="outline" className="h-6 px-2 text-[10px] bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm" onClick={(e) => { e.stopPropagation(); alert('명세서 조회 (모의)'); }}>
                                              <FileText className="w-3 h-3 mr-0.5 text-gray-500"/>명세서
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                          {masterData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                              <TableRow key={`empty-m-${i}`} className="h-8 border-b border-gray-200 bg-white">
                                {Array.from({ length: 12 }).map((_, j) => (
                                  <TableCell key={j} className={j < 11 ? "border-r border-gray-200" : ""}></TableCell>
                                ))}
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
              </div>
          </div>

          {/* 디테일 (상세내역) */}
          <div className="erp-section-group flex-1 flex flex-col min-h-[300px]">
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">상세내역</span>
                 <div className="flex gap-1 pr-1">
                     <Button className="erp-btn-action" onClick={handleDetailExcelDownload} disabled={!selectedMasterId}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
                     <div className="w-[1px] h-4 bg-gray-300 self-center mx-1"></div>
                     <Button className="erp-btn-action" onClick={handleAllDetailExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>전체엑셀다운</Button>
                 </div>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[1800px] border-collapse text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[40px] text-center font-bold text-gray-900 border-r border-gray-300">NO</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">반품일자</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">장부반영일</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">제품번호(주문)</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                              <TableHead className="w-[250px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">매입구분</TableHead>
                              <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">정가</TableHead>
                              <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">원가</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">매입율(%)</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 bg-red-50">반품수량<br/><span className="text-[9px] font-normal text-gray-600">(물류사용단위)</span></TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">정가합계</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">원가합계</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">반품사유</TableHead>
                              <TableHead className="text-center font-bold text-gray-900">반품처</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {detailData.map((row) => (
                              <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                                  <TableCell className="text-center border-r border-gray-200">{row.no}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.returnDate}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.ledgerDate}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold text-gray-600">{row.orderNo}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2" title={row.pName}>{row.pName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.purchaseType}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.listPrice.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.costPrice.toLocaleString()}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200">{row.purchaseRate}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 leading-tight font-bold text-red-600 bg-red-50/30">
                                      {row.returnQty.toLocaleString()}
                                      <br/>
                                      <span className="text-[9px] font-normal text-gray-500">{row.unitStr}</span>
                                  </TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold">{row.listAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold">{row.costAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.returnReason}</TableCell>
                                  <TableCell className="text-left pl-2 text-gray-500 truncate">{row.returnLoc}</TableCell>
                              </TableRow>
                          ))}
                          {detailData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                              <TableRow key={`empty-d-${i}`} className="h-8 border-b border-gray-200 bg-white">
                                {Array.from({ length: 15 }).map((_, j) => (
                                  <TableCell key={j} className={j < 14 ? "border-r border-gray-200" : ""}></TableCell>
                                ))}
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
              </div>
          </div>
      </div>

      {/* ProductSearchModal은 ProductCodeSearchField 내부에서 관리 */}
      <SupplierSearchModal isOpen={isSuppModalOpen} onClose={() => setIsSuppModalOpen(false)} initialSearchName={sSuppItemName} onSelect={(item) => { setSSuppItemCode(item.code); setSSuppItemName(item.name); }} />
      <SupplierSearchModal isOpen={isScmSuppModalOpen} onClose={() => setIsScmSuppModalOpen(false)} initialSearchName="" excludedCodes={['0900216', '0900224', '0900252']} onSelect={(item) => { setScmSupplierCode(item.code); setScmSupplierName(item.name); }} />

    </div>
  );
}