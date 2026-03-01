import React, { useState, useMemo } from 'react';
import { Calendar, Search, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

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
type LedgerData = {
    id: string;
    no: number;
    ledgerDate: string;
    inboundDate: string;
    loc: string;
    purchaseType: string;
    inQty: number;
    inAmt: number;
    returnQty: number;
    returnAmt: number;
    payAmt: number;
    unpaidAmt: number;
    payDate: string;
    payType: string;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function LedgerInquiryPage() {
  const { suppliers, products } = useMockData();

  // 조회 조건 State
  const today = format(new Date(), 'yyyy-MM-dd');
  const [sDateStart, setSDateStart] = useState(today);
  const [sDateEnd, setSDateEnd] = useState(today);
  const [sLoc, setSLoc] = useState('전체');
  const [sPurchaseType, setSPurchaseType] = useState('전체');
  const [sSuppCode, setSSuppCode] = useState('');
  const [sSuppName, setSSuppName] = useState('');

  // ★ SCM 매입처 조회 (상단 헤더)
  const [scmSupplierCode, setScmSupplierCode] = useState('');
  const [scmSupplierName, setScmSupplierName] = useState('');
  const [isScmSuppModalOpen, setIsScmSuppModalOpen] = useState(false);
  const scmSupplier = suppliers.find(s => s.code === scmSupplierCode);
  
  // 데이터 State
  const [gridData, setGridData] = useState<LedgerData[]>([]);
  
  // 팝업 State
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 4. 데이터 연산 및 핸들러 (수불처별 다채로운 로직 적용)
  // -------------------------------------------------------------------
  const handleSearch = () => {
      if (!scmSupplierCode) {
          alert('매입처를 먼저 조회해주세요.');
          return;
      }
      // ★ 선택된 매입처의 상품 기반으로 장부 데이터 생성
      const suppProducts = products.filter(p => p.supplierCode === scmSupplierCode);
      const avgPrice = suppProducts.length > 0 
          ? Math.floor(suppProducts.reduce((acc, p) => acc + (typeof p.listPrice === 'string' ? parseInt(p.listPrice) || 0 : p.listPrice), 0) / suppProducts.length)
          : 5000;
      const avgRate = suppProducts.length > 0
          ? suppProducts.reduce((acc, p) => acc + (typeof p.purchaseRate === 'string' ? parseFloat(p.purchaseRate) || 50 : p.purchaseRate), 0) / suppProducts.length
          : 50;
      const avgCost = Math.floor(avgPrice * (avgRate / 100));

      // 1. 기초 데이터 생성
      const baseData: Omit<LedgerData, 'id' | 'no'>[] = [];
      const locations = ['매장(부곡리)', '온라인(북시티)'];
      const purchaseTypes = scmSupplier?.purchaseType === '위탁' ? ['특정매입'] : ['직매입'];

      locations.forEach((loc, lIdx) => {
          purchaseTypes.forEach((pType, pIdx) => {
              // 구분되는 시드값 생성
              const seedQty = (lIdx + 1) * (pIdx === 0 ? 150 : 350); 
              const seedAmt = pIdx === 0 ? 4000 : 7500;
              
              const inQty = seedQty + Math.floor(Math.random() * 50);
              const inAmt = inQty * seedAmt;
              const returnQty = Math.floor(inQty * 0.1);
              const returnAmt = returnQty * seedAmt;
              const payAmt = Math.floor(inAmt * 0.6);
              const unpaidAmt = inAmt - returnAmt - payAmt;

              baseData.push({
                  ledgerDate: sDateStart,
                  inboundDate: sDateStart,
                  loc,
                  purchaseType: pType,
                  inQty, inAmt, returnQty, returnAmt, payAmt, unpaidAmt,
                  payDate: lIdx === 0 ? sDateEnd : '',
                  payType: lIdx === 0 ? '현금지급' : '미지급'
              });
          });
      });

      // 2. 매입구분 필터링
      let filteredByPurchaseType = baseData;
      if (sPurchaseType !== '전체') {
          filteredByPurchaseType = filteredByPurchaseType.filter(d => d.purchaseType === sPurchaseType);
      }

      // 3. 수불처 필터링 및 합산 로직 (★ 지시사항 완벽 반영)
      let finalData: Omit<LedgerData, 'id' | 'no'>[] = [];

      if (sLoc === '매장') {
          finalData = filteredByPurchaseType.filter(d => d.loc.includes('매장'));
      } 
      else if (sLoc === '온라인') {
          finalData = filteredByPurchaseType.filter(d => d.loc.includes('온라인'));
      } 
      else if (sLoc === '구분없음') {
          // 구분없음: 합치지 않고 매장/온라인 내역을 각각 보여줌
          finalData = [...filteredByPurchaseType];
      } 
      else if (sLoc === '전체') {
          // 전체: 매장+온라인 수불처 구분없이 합산하여 단일 행으로 노출
          const aggregated = filteredByPurchaseType.reduce((acc, curr) => {
              const key = curr.purchaseType; // 매입구분별로만 합산
              if (!acc[key]) {
                  acc[key] = { ...curr, loc: '통합(구분없음)' };
              } else {
                  acc[key].inQty += curr.inQty;
                  acc[key].inAmt += curr.inAmt;
                  acc[key].returnQty += curr.returnQty;
                  acc[key].returnAmt += curr.returnAmt;
                  acc[key].payAmt += curr.payAmt;
                  acc[key].unpaidAmt += curr.unpaidAmt;
              }
              return acc;
          }, {} as Record<string, Omit<LedgerData, 'id' | 'no'>>);
          
          finalData = Object.values(aggregated);
      }

      // 최종 데이터에 ID와 No 부여
      const mappedData: LedgerData[] = finalData.map((d, index) => ({
          ...d,
          id: `LDG-${index}`,
          no: index + 1
      }));

      setGridData(mappedData);
  };

  const handleReset = () => {
      setSDateStart(today); setSDateEnd(today);
      setSLoc('전체'); setSPurchaseType('전체');
      setSSuppCode(''); setSSuppName('');
      setGridData([]);
  };

  const handleExcelDownload = () => {
      if (gridData.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const data = gridData.map(d => ({
          'No.': d.no, '장부일자': d.ledgerDate, '입고일자': d.inboundDate, '수불처': d.loc,
          '매입구분': d.purchaseType, '입고수량': d.inQty, '입고금액': d.inAmt,
          '반품수량': d.returnQty, '반품금액': d.returnAmt, '지불금액': d.payAmt,
          '미지급액': d.unpaidAmt, '지불일자': d.payDate, '지불구분': d.payType
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "장부조회");
      XLSX.writeFile(wb, `장부조회_${today}.xlsx`);
  };

  // 소계 및 합계 계산
  const totals = useMemo(() => {
      return gridData.reduce((acc, curr) => {
          acc.inQty += curr.inQty;
          acc.inAmt += curr.inAmt;
          acc.returnQty += curr.returnQty;
          acc.returnAmt += curr.returnAmt;
          acc.payAmt += curr.payAmt;
          acc.unpaidAmt += curr.unpaidAmt;
          return acc;
      }, { inQty: 0, inAmt: 0, returnQty: 0, returnAmt: 0, payAmt: 0, unpaidAmt: 0 });
  }, [gridData]);

  return (
    <div className="erp-page">
      <div className="erp-page-title">
        <h2>장부조회(문구/음반)</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 일자별 입고, 반품, 지급, 미지급잔액을 확인하는 메뉴입니다.
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-gray-300 rounded-[2px] bg-white px-2 py-1">
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">매입처</span>
            <Input className="h-5 w-[70px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="코드" value={scmSupplierCode} onChange={(e) => setScmSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierCode.trim()) { const found = suppliers.find(s => s.code === scmSupplierCode.trim()); if (found) setScmSupplierName(found.name); else alert('해당 매입처를 찾을 수 없습니다.'); }}} />
            <Input className="h-5 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="매입처명" value={scmSupplierName} onChange={(e) => setScmSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierName.trim()) { const found = suppliers.find(s => s.name.includes(scmSupplierName.trim())); if (found) { setScmSupplierCode(found.code); setScmSupplierName(found.name); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Search className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800 flex-shrink-0" onClick={() => setIsScmSuppModalOpen(true)} />
        </div>
      </div>

      {/* 대조확인 이용안내 */}
      <div className="border border-gray-300 bg-gray-50 rounded-[2px] px-4 py-3 text-[11px] text-gray-600 leading-relaxed">
        <p className="font-bold text-gray-800 mb-1">+대조확인 이용안내</p>
        <p>- 마감월기준으로 귀사의 장부잔액을 확인합니다.</p>
        <p>- 수시로 입력가능하며, 당사 요청시에도 입력할 수 있습니다.</p>
        <p>- 장부조회 기간 신규 거래일로부터 조회 가능합니다.</p>
      </div>

      {/* 1. 조회 조건 영역 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
          </div>
          <div className="border border-gray-300 bg-white">
          <div className="grid grid-cols-[120px_1fr_120px_1fr] border-b border-gray-300">
             {/* 1 Row */}
             <Label required>조회기간</Label>
             <div className="p-1 border-r border-gray-200 px-3 flex items-center">
                 <DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} />
             </div>
             
             <Label>수불처</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={sLoc} onValueChange={setSLoc}>
                     <SelectTrigger className="h-6 w-[180px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         <SelectItem value="매장">매장</SelectItem>
                         <SelectItem value="온라인">온라인</SelectItem>
                         <SelectItem value="구분없음">구분없음</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             {/* 2 Row */}
             <Label className="border-t border-gray-200">매입구분</Label>
             <div className="p-1 border-r border-t border-gray-200">
                 <Select value={sPurchaseType} onValueChange={setSPurchaseType}>
                     <SelectTrigger className="h-6 w-[180px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         <SelectItem value="직매입">직매입</SelectItem>
                         <SelectItem value="특정매입">특정매입</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label className="border-t border-gray-200">매입처</Label>
             <div className="flex items-center gap-1 p-1 border-t border-gray-200">
                 <Input className="h-6 w-[100px] text-[11px] font-bold bg-white" placeholder="매입처코드" value={sSuppCode} readOnly />
                 <Button variant="outline" className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsSuppModalOpen(true)}><Search className="w-3.5 h-3.5 text-white" /></Button>
                 <Input className="h-6 w-[200px] text-[11px] bg-gray-100" readOnly tabIndex={-1} value={sSuppName} placeholder="미입력시 전체" />
             </div>
          </div>
          </div>{/* close border div */}
          <div className="erp-search-actions">
             <Button className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
             <Button className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
          </div>
      </div>

      {/* 2. 장부 내역 그리드 */}
      <div className="erp-section-group flex-1 flex flex-col min-h-0">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">장부조회 내역</span>
             <div className="flex gap-1 pr-1">
                 <Button className="erp-btn-action" onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운로드</Button>
             </div>
          </div>
          <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[1400px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300">No.</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">장부일자</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">입고일자</TableHead>
                          <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300">수불처</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">매입구분</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">입고수량</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">입고금액</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">반품수량</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">반품금액</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">지불금액</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">미지급액</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">지불일자</TableHead>
                          <TableHead className="text-center font-bold text-gray-900">지불구분</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                              <TableCell className="text-center border-r border-gray-200">{row.no}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.ledgerDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.inboundDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.loc}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.purchaseType}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-blue-700">{row.inQty.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-gray-800">{row.inAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-red-600 bg-red-50/20">{row.returnQty.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-red-600 bg-red-50/20">{row.returnAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-gray-800">{row.payAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-orange-600">{row.unpaidAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.payDate}</TableCell>
                              <TableCell className="text-center text-gray-600">{row.payType}</TableCell>
                          </TableRow>
                      ))}
                      
                      {gridData.length > 0 && (
                          <>
                              <TableRow className="h-8 bg-[#eef3f8] border-t-2 border-gray-300 font-bold sticky bottom-8 z-10">
                                  <TableCell colSpan={5} className="text-center border-r border-gray-300 text-gray-800">소 계</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-blue-700">{totals.inQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-gray-800">{totals.inAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-red-600">{totals.returnQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-red-600">{totals.returnAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-gray-800">{totals.payAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-orange-600">{totals.unpaidAmt.toLocaleString()}</TableCell>
                                  <TableCell colSpan={2} className="border-r border-gray-300"></TableCell>
                              </TableRow>
                              
                              <TableRow className="h-8 bg-[#dfe7f0] border-t border-gray-300 font-bold sticky bottom-0 z-10 shadow-[0_-1px_0_0_#d1d5db]">
                                  <TableCell colSpan={5} className="text-center border-r border-gray-300 text-gray-800">합 계</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-blue-800">{totals.inQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-gray-800">{totals.inAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-red-700">{totals.returnQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-red-700">{totals.returnAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-gray-800">{totals.payAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-orange-700">{totals.unpaidAmt.toLocaleString()}</TableCell>
                                  <TableCell colSpan={2} className="border-r border-gray-300"></TableCell>
                              </TableRow>
                          </>
                      )}

                      {gridData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 13 }).map((_, j) => (
                              <TableCell key={j} className={j < 12 ? "border-r border-gray-200" : ""}></TableCell>
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
          initialSearchName={sSuppName} 
          onSelect={(item) => { setSSuppCode(item.code); setSSuppName(item.name); }} 
      />
      <SupplierSearchModal isOpen={isScmSuppModalOpen} onClose={() => setIsScmSuppModalOpen(false)} initialSearchName="" excludedCodes={['0900216', '0900224', '0900252']} onSelect={(item) => { setScmSupplierCode(item.code); setScmSupplierName(item.name); }} />

    </div>
  );
}