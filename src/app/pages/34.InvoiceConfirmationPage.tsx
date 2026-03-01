import React, { useState, useMemo } from 'react';
import { Calendar, Search, Download, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { useMockData } from '../../context/MockDataContext';

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
type InvoiceIssueData = {
    id: string;
    no: number;
    issueDate: string;
    amount: number;
};

type InvoiceReceiptData = {
    id: string;
    issueMonth: string;
    suppCode: string;
    suppName: string;
    suppItemCode: string;
    suppItemName: string;
    ledgerAmtA: number;     // 교보문고 매입장부(A)
    taxInvoiceAmtB: number; // 출판사 세금계산서발행내역(B)
    invoiceAmtB: number;    // 출판사 계산서발행내역(B)
    diffAmt: number;        // 차액(A-B)
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
const InvoiceConfirmationPage = () => {
  const { suppliers = [], products = [] } = useMockData();

  // ★ SCM 매입처 조회 (상단 헤더)
  const [scmSupplierCode, setScmSupplierCode] = useState('');
  const [scmSupplierName, setScmSupplierName] = useState('');
  const [isScmSuppModalOpen, setIsScmSuppModalOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [sDateStart, setSDateStart] = useState(today);
  const [sDateEnd, setSDateEnd] = useState(today);
  const [sSuppItemCode, setSSuppItemCode] = useState('');
  const [sSuppItemName, setSSuppItemName] = useState('');

  const [issueData, setIssueData] = useState<InvoiceIssueData[]>([]);
  const [receiptData, setReceiptData] = useState<InvoiceReceiptData[]>([]);
  
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 4. 데이터 연산 및 핸들러
  // -------------------------------------------------------------------
  const handleSearch = () => {
      if (!scmSupplierCode) {
          alert('매입처를 먼저 조회해주세요.');
          return;
      }
      // ★ 선택된 매입처의 실제 상품 기반으로 계산서 데이터 생성
      const suppProducts = products.filter(p => p.supplierCode === scmSupplierCode);
      const suppName = scmSupplierName || scmSupplierCode;
      const suppItemCode = suppProducts.length > 0 ? ((suppProducts[0] as any).supplierItemCode || '001') : '001';
      const suppItemName = suppProducts.length > 0 ? ((suppProducts[0] as any).supplierItemName || '기본') : '기본';

      // 상품 가격 기반으로 계산서 금액 산출
      const totalListAmt = suppProducts.reduce((acc, p) => {
          const price = typeof p.listPrice === 'string' ? parseInt(p.listPrice) || 0 : p.listPrice;
          const rate = typeof p.purchaseRate === 'string' ? parseFloat(p.purchaseRate) || 50 : p.purchaseRate;
          return acc + Math.floor(price * (rate / 100)) * 10;
      }, 0) || 4500000;

      const mockIssue: InvoiceIssueData[] = [
          { id: 'IS-1', no: 1, issueDate: sDateEnd, amount: totalListAmt },
          { id: 'IS-2', no: 2, issueDate: sDateStart, amount: Math.floor(totalListAmt * 0.7) }
      ];
      setIssueData(mockIssue);

      const mockReceipt: InvoiceReceiptData[] = [
          { 
            id: 'RC-1', issueMonth: sDateEnd.slice(0, 7).replace('-', ''), 
            suppCode: scmSupplierCode, suppName: suppName, 
            suppItemCode: suppItemCode, suppItemName: suppItemName, 
            ledgerAmtA: totalListAmt, taxInvoiceAmtB: totalListAmt, invoiceAmtB: 0, diffAmt: 0 
          },
          { 
            id: 'RC-2', issueMonth: sDateStart.slice(0, 7).replace('-', ''), 
            suppCode: scmSupplierCode, suppName: suppName, 
            suppItemCode: suppItemCode, suppItemName: suppItemName, 
            ledgerAmtA: Math.floor(totalListAmt * 0.7), taxInvoiceAmtB: Math.floor(totalListAmt * 0.7), invoiceAmtB: 0, diffAmt: 0 
          },
      ];
      setReceiptData(mockReceipt);
  };

  const handleReset = () => {
      setSDateStart(today); setSDateEnd(today);
      setSSuppItemCode(''); setSSuppItemName('');
      setIssueData([]); setReceiptData([]);
  };

  const handleExcelDownload = () => {
      if (receiptData.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const data = receiptData.map(d => ({
          '발행월': d.issueMonth, '거래처코드': d.suppCode, '거래처': d.suppName, 
          '매입처품목코드': d.suppItemCode, '매입처품목코드명': d.suppItemName,
          '교보문고 매입장부(A)': d.ledgerAmtA, '출판사 세금계산서발행내역(B)': d.taxInvoiceAmtB,
          '출판사 계산서발행내역(B)': d.invoiceAmtB, '차액(A-B)': d.diffAmt
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "계산서접수내역");
      XLSX.writeFile(wb, `계산서접수내역_${today}.xlsx`);
  };

  const issueTotal = useMemo(() => issueData.reduce((acc, cur) => acc + cur.amount, 0), [issueData]);
  const receiptTotals = useMemo(() => {
      return receiptData.reduce((acc, curr) => {
          acc.ledgerAmtA += curr.ledgerAmtA;
          acc.taxInvoiceAmtB += curr.taxInvoiceAmtB;
          acc.invoiceAmtB += curr.invoiceAmtB;
          acc.diffAmt += curr.diffAmt;
          return acc;
      }, { ledgerAmtA: 0, taxInvoiceAmtB: 0, invoiceAmtB: 0, diffAmt: 0 });
  }, [receiptData]);

  const openExternalLink = (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="erp-page">
      <div className="erp-page-title flex items-center">
        <h2>계산서 확인</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 계산서 발행 및 접수내역을 확인할 수 있습니다.
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-gray-300 rounded-[2px] bg-white px-2 py-1">
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">매입처</span>
            <Input className="h-5 w-[70px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="코드" value={scmSupplierCode} onChange={(e) => setScmSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierCode.trim()) { const found = suppliers.find(s => s.code === scmSupplierCode.trim()); if (found) setScmSupplierName(found.name); else alert('해당 매입처를 찾을 수 없습니다.'); }}} />
            <Input className="h-5 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="매입처명" value={scmSupplierName} onChange={(e) => setScmSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierName.trim()) { const found = suppliers.find(s => s.name.includes(scmSupplierName.trim())); if (found) { setScmSupplierCode(found.code); setScmSupplierName(found.name); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Search className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800 flex-shrink-0" onClick={() => setIsScmSuppModalOpen(true)} />
        </div>
      </div>

      <div className="bg-[#fcf8e3] border border-[#f0e3ab] p-3 mb-4 rounded-sm text-[11px] text-gray-800 leading-relaxed">
          <p className="font-bold text-[#8a6d3b] mb-1">*계산서 확인 이용안내</p>
          <p>- SCM 계약조건 <b className="text-blue-700">직매입</b>만 노출됩니다.</p>
          <p className="text-gray-500">- 특정매입 / 오픈마켓 경우 협력사네트워크에 구축되어 있지 않으며, 재고에 대한 개념이 없으므로 장부관리가 필요 없습니다.</p>
      </div>

      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
          </div>
          <div className="border border-gray-300 bg-white">
             <div className="grid grid-cols-[120px_1fr_120px_1fr] border-b border-gray-300">
                <Label required>조회기간</Label>
                <div className="p-1 border-r border-gray-200 px-3 flex items-center">
                    <DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} />
                </div>
                
                <Label>매입처품목</Label>
                <div className="flex items-center gap-1 p-1">
                    <Input className="h-6 w-[100px] text-[11px] font-bold bg-white" placeholder="매입처품목코드" value={sSuppItemCode} readOnly />
                    <Button variant="outline" className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsSuppModalOpen(true)}>
                        <Search className="w-3.5 h-3.5 text-white" />
                    </Button>
                    <Input className="h-6 w-[200px] text-[11px] bg-gray-100" readOnly tabIndex={-1} value={sSuppItemName} placeholder="미입력시 전체" />
                </div>
             </div>
           </div>{/* close border div */}
           <div className="erp-search-actions">
                <Button className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
                <Button className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
           </div>
      </div>

      <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          <div className="erp-section-group flex flex-col flex-shrink-0" style={{ height: '300px' }}>
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">계산서 발행내역</span>
                 <div className="flex gap-1 pr-1">
                     {/* ★ 엑셀다운로드 버튼 이동 완료 */}
                     <Button className="erp-btn-action" onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운로드</Button>
                     <div className="w-[1px] h-4 bg-gray-300 self-center mx-1"></div>
                     <Button className="erp-btn-action bg-[#2563eb] hover:bg-[#1d4ed8] text-white" onClick={() => openExternalLink('https://www.hometax.go.kr/')}>
                         <ExternalLink className="w-3.5 h-3.5 mr-1"/>홈택스 바로가기
                     </Button>
                     <Button className="erp-btn-action bg-[#475569] hover:bg-[#334155] text-white" onClick={() => openExternalLink('https://www.hometax.go.kr/')}>
                         <ExternalLink className="w-3.5 h-3.5 mr-1"/>EDI 바로가기
                     </Button>
                 </div>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[600px] border-collapse text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">No.</TableHead>
                              {/* ★ 칼럼 크기 50:50 조절 료 */}
                              <TableHead className="w-1/2 text-center font-bold text-gray-900 border-r border-gray-300">발행일자</TableHead>
                              <TableHead className="w-1/2 text-center font-bold text-gray-900">(세금)계산서 금액</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {issueData.map((row) => (
                              <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                                  <TableCell className="text-center border-r border-gray-200">{row.no}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.issueDate}</TableCell>
                                  <TableCell className="text-center pr-4 font-bold text-gray-800">{row.amount.toLocaleString()}</TableCell>
                              </TableRow>
                          ))}
                          
                          {issueData.length > 0 && (
                              <TableRow className="h-8 bg-[#dfe7f0] border-t border-gray-300 font-bold sticky bottom-0 z-10 shadow-[0_-1px_0_0_#d1d5db]">
                                  <TableCell colSpan={2} className="text-center border-r border-gray-300 text-gray-800">합 계</TableCell>
                                  <TableCell className="text-center pr-4 text-blue-800">{issueTotal.toLocaleString()}</TableCell>
                              </TableRow>
                          )}

                          {issueData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                              <TableRow key={`empty-i-${i}`} className="h-8 border-b border-gray-200 bg-white">
                                {Array.from({ length: 3 }).map((_, j) => (
                                  <TableCell key={j} className={j < 2 ? "border-r border-gray-200" : ""}></TableCell>
                                ))}
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
              </div>
          </div>

          <div className="erp-section-group flex-1 flex flex-col min-h-[300px]">
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">계산서 접수내역</span>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[1400px] border-collapse text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                          {/* ★ 컬러풀한 색상 모두 제거 완료 (기본 ERP 양식 복원) */}
                          <TableRow className="h-8">
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">발행월</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">거래처코드</TableHead>
                              <TableHead className="w-[160px] text-center font-bold text-gray-900 border-r border-gray-300">거래처명</TableHead>
                              <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목코드</TableHead>
                              <TableHead className="w-[160px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목코드명</TableHead>
                              <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">교보문고 매입장부(A)</TableHead>
                              <TableHead className="w-[160px] text-center font-bold text-gray-900 border-r border-gray-300">출판사 세금계산서발행내역(B)</TableHead>
                              <TableHead className="w-[160px] text-center font-bold text-gray-900 border-r border-gray-300">출판사 계산서발행내역(B)</TableHead>
                              <TableHead className="w-[150px] text-center font-bold text-gray-900">차액(A-B)</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {receiptData.map((row) => (
                              <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                                  <TableCell className="text-center border-r border-gray-200">{row.issueMonth}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.suppCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 pl-2">{row.suppName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.suppItemCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 pl-2 truncate">{row.suppItemName}</TableCell>
                                  
                                  {/* ★ 배경색 제거 및 기본 폰트 색상 반영 */}
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-gray-800">{row.ledgerAmtA.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-gray-800">{row.taxInvoiceAmtB.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-gray-800">{row.invoiceAmtB.toLocaleString()}</TableCell>
                                  
                                  <TableCell className={cn("text-right pr-2 font-bold", row.diffAmt !== 0 ? "text-red-600" : "text-gray-800")}>
                                      {row.diffAmt.toLocaleString()}
                                  </TableCell>
                              </TableRow>
                          ))}
                          
                          {receiptData.length > 0 && (
                              <TableRow className="h-8 bg-[#dfe7f0] border-t border-gray-300 font-bold sticky bottom-0 z-10 shadow-[0_-1px_0_0_#d1d5db]">
                                  <TableCell colSpan={5} className="text-center border-r border-gray-300 text-gray-800">합 계</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-gray-800">{receiptTotals.ledgerAmtA.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-gray-800">{receiptTotals.taxInvoiceAmtB.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-gray-800">{receiptTotals.invoiceAmtB.toLocaleString()}</TableCell>
                                  <TableCell className={cn("text-right pr-2", receiptTotals.diffAmt !== 0 ? "text-red-600" : "text-gray-800")}>
                                      {receiptTotals.diffAmt.toLocaleString()}
                                  </TableCell>
                              </TableRow>
                          )}

                          {receiptData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                              <TableRow key={`empty-r-${i}`} className="h-8 border-b border-gray-200 bg-white">
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
      </div>

      <SupplierItemSearchModal 
          isOpen={isSuppModalOpen} 
          onClose={() => setIsSuppModalOpen(false)} 
          supplierCode={scmSupplierCode} 
          initialSearchName={sSuppItemName} 
          onSelect={(item) => { setSSuppItemCode(item.code); setSSuppItemName(item.name); }} 
      />

      <SupplierSearchModal 
          isOpen={isScmSuppModalOpen} 
          onClose={() => setIsScmSuppModalOpen(false)} 
          initialSearchName="" 
          excludedCodes={['0900216', '0900224', '0900252']}
          onSelect={(item) => { setScmSupplierCode(item.code); setScmSupplierName(item.name); }} 
      />

    </div>
  );
};

export default InvoiceConfirmationPage;