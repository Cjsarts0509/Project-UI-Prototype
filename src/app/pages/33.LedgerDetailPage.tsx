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

import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';
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
type LedgerDetailData = {
    id: string;
    no: number;
    ledgerDate: string;
    inboundDate: string;
    issueDate: string;
    loc: string;
    receiptNo: string;
    suppItemCode: string;
    pCode: string;
    pName: string;
    listPrice: number;
    supplyRate: number;
    purchaseType: string;
    qty: number;
    totalAmt: number;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function LedgerDetailPage() {
  const { products = [], suppliers = [] } = useMockData();

  // ★ SCM 매입처 조회 (상단 헤더)
  const [scmSupplierCode, setScmSupplierCode] = useState('');
  const [scmSupplierName, setScmSupplierName] = useState('');
  const [isScmSuppModalOpen, setIsScmSuppModalOpen] = useState(false);

  // 조회 조건 State (최초 일자 설정값 당일) [cite: 41]
  const today = format(new Date(), 'yyyy-MM-dd');
  const [sDateStart, setSDateStart] = useState(today);
  const [sDateEnd, setSDateEnd] = useState(today);
  const [sLoc, setSLoc] = useState('전체');
  const [sSearchType, setSSearchType] = useState('입고');
  const [sSuppItemCode, setSSuppItemCode] = useState('');
  const [sSuppItemName, setSSuppItemName] = useState('');

  // 데이터 State
  const [gridData, setGridData] = useState<LedgerDetailData[]>([]);
  
  // 팝업 State
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 4. 데이터 핸들러
  // -------------------------------------------------------------------
  const handleSearch = () => {
      if (!scmSupplierCode) {
          alert('매입처를 먼저 조회해주세요.');
          return;
      }
      // ★ 선택된 매입처의 실제 상품으로 장부상세 데이터 생성
      const suppProducts = products.filter(p => p.supplierCode === scmSupplierCode);
      const targetProducts = suppProducts.length > 0 ? suppProducts.slice(0, 8) : products.slice(0, 8);

      const result: LedgerDetailData[] = targetProducts.map((product, i) => {
          const isReturn = sSearchType === '반품';
          
          let locStr = isReturn ? '매장(부곡리)' : (i % 2 === 0 ? '매장(부곡리)' : '온라인(북시티)');
          if (sLoc === '매장') locStr = '매장(부곡리)';
          else if (sLoc === '온라인' && !isReturn) locStr = '온라인(북시티)';

          const listPrice = typeof product.listPrice === 'string' ? parseInt(product.listPrice) || 15000 : product.listPrice;
          const supplyRate = typeof product.purchaseRate === 'string' ? parseFloat(product.purchaseRate) || 65 : product.purchaseRate;
          const qty = isReturn ? -(Math.floor(Math.random() * 20) + 5) : Math.floor(Math.random() * 100) + 10;
          const totalAmt = Math.floor(listPrice * (supplyRate / 100)) * qty;

          return {
              id: `LD-${i}`,
              no: i + 1,
              ledgerDate: sDateStart,
              inboundDate: sDateStart,
              issueDate: sDateStart,
              loc: locStr,
              receiptNo: `RC-${today.replace(/-/g, '')}-${i.toString().padStart(3, '0')}`,
              suppItemCode: (product as any).supplierItemCode || `SUP-${i.toString().padStart(4, '0')}`,
              pCode: product.productCode,
              pName: product.productName,
              listPrice: listPrice,
              supplyRate: supplyRate,
              purchaseType: '외상매입',
              qty: qty,
              totalAmt: totalAmt
          };
      });

      setGridData(result);
  };

  const handleReset = () => {
      setSDateStart(today); setSDateEnd(today);
      setSLoc('전체'); setSSearchType('입고');
      setSSuppItemCode(''); setSSuppItemName('');
      setGridData([]);
  };

  const handleExcelDownload = () => {
      if (gridData.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const data = gridData.map(d => ({
          'No.': d.no, '장부일자': d.ledgerDate, '입고일자': d.inboundDate, '거래명세서발행일자': d.issueDate,
          '수불처': d.loc, '인수번호': d.receiptNo, '매입처품목코드': d.suppItemCode,
          '상품코드': d.pCode, '상품명': d.pName, '정가': d.listPrice,
          '공급율': d.supplyRate, '매입구분': d.purchaseType, '수량': d.qty, '합계금액': d.totalAmt
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "장부상세내역");
      XLSX.writeFile(wb, `장부상세내역_${today}.xlsx`); // [cite: 69, 70, 71, 72]
  };

  // 소계 및 합계 계산 [cite: 28, 29]
  const totals = useMemo(() => {
      return gridData.reduce((acc, curr) => {
          acc.qty += curr.qty;
          acc.totalAmt += curr.totalAmt;
          return acc;
      }, { qty: 0, totalAmt: 0 });
  }, [gridData]);

  return (
    <div className="erp-page">
      <div className="erp-page-title flex items-center">
        <h2>장부상세내역</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 상품별 상세정보를 확인하는 메뉴입니다..
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-gray-300 rounded-[2px] bg-white px-2 py-1">
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">매입처</span>
            <Input className="h-5 w-[70px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="코드" value={scmSupplierCode} onChange={(e) => setScmSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierCode.trim()) { const found = suppliers.find(s => s.code === scmSupplierCode.trim()); if (found) setScmSupplierName(found.name); else alert('해당 매입처를 찾을 수 없습니다.'); }}} />
            <Input className="h-5 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="매입처명" value={scmSupplierName} onChange={(e) => setScmSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierName.trim()) { const found = suppliers.find(s => s.name.includes(scmSupplierName.trim())); if (found) { setScmSupplierCode(found.code); setScmSupplierName(found.name); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Search className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800 flex-shrink-0" onClick={() => setIsScmSuppModalOpen(true)} />
        </div>
      </div>

      {/* 기획서 안내문구 영역 [cite: 78, 79] */}
      <div className="bg-[#fcf8e3] border border-[#f0e3ab] p-3 mb-4 rounded-sm text-[11px] text-gray-800 leading-relaxed">
          <p className="font-bold text-[#8a6d3b] mb-1">*장부상세내역 이용안내</p>
          <p>- 장부조회에서 확인되는 금액에 대한, 상품별정보를 확인할 수 있습니다.</p>
          <p>- 조회가능기간 : 신규거래 이후 조회가능</p>
          <p>- 거래명세서발행일자로 조회되지 않는 경우, 장부일자로 조회하여 확인이 가능합니다.(출고월 기준)</p>
          <p className="text-red-600 font-bold">- 거래명세서발행일자는 수정요청 하실 수 없으니 양해바랍니다.</p>
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
                        <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="전체">전체</SelectItem>
                            <SelectItem value="매장">매장</SelectItem>
                            <SelectItem value="온라인">온라인</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 2 Row */}
                <Label className="border-t border-gray-200">조회구분</Label>
                <div className="p-1 border-r border-t border-gray-200">
                    <Select value={sSearchType} onValueChange={setSSearchType}>
                        <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="입고">입고</SelectItem>
                            <SelectItem value="반품">반품</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Label className="border-t border-gray-200">매입처품목</Label>
                <div className="flex items-center gap-1 p-1 border-t border-gray-200">
                    <Input className="h-6 w-[100px] text-[11px] font-bold bg-white" placeholder="매입처품목코드" value={sSuppItemCode} readOnly />
                    <Button variant="outline" className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsSuppModalOpen(true)}><Search className="w-3.5 h-3.5 text-white" /></Button>
                    <Input className="h-6 w-[200px] text-[11px] bg-gray-100" readOnly tabIndex={-1} value={sSuppItemName} placeholder="미입력시 전체" />
                </div>
             </div>
           </div>{/* close border div */}
           <div className="erp-search-actions">
                <Button className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
                <Button className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
           </div>
      </div>

      {/* 2. 장부 상세내역 그리드 */}
      <div className="erp-section-group flex-1 flex flex-col min-h-0">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">장부내역</span>
             <div className="flex gap-1 pr-1">
                 {/* 그리드 버튼 룰: erp-btn-action */}
                 <Button className="erp-btn-action" onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
             </div>
          </div>
          <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[1600px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          {/* */}
                          <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300">No.</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">장부일자</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">입고일자</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">거래명세서발행일자</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">수불처</TableHead>
                          <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300">인수번호</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목코드</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[250px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">정가</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">공급율</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">매입구분</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">수량</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900">합계금액</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                              <TableCell className="text-center border-r border-gray-200">{row.no}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.ledgerDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.inboundDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.issueDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.loc}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-blue-700 font-bold">{row.receiptNo}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold text-gray-800">{row.suppItemCode}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-3">{row.pName}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2">{row.listPrice.toLocaleString()}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.supplyRate}%</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.purchaseType}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-blue-700">{row.qty.toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-2 font-bold text-red-600 bg-red-50/20">{row.totalAmt.toLocaleString()}</TableCell>
                          </TableRow>
                      ))}
                      
                      {gridData.length > 0 && (
                          <>
                              {/* 소계 행 [cite: 28] */}
                              <TableRow className="h-8 bg-[#eef3f8] border-t-2 border-gray-300 font-bold sticky bottom-8 z-10">
                                  <TableCell colSpan={12} className="text-center border-r border-gray-300 text-gray-800">소 계</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-blue-700">{totals.qty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right pr-2 text-red-600">{totals.totalAmt.toLocaleString()}</TableCell>
                              </TableRow>
                              
                              {/* 합계 행 [cite: 29] */}
                              <TableRow className="h-8 bg-[#dfe7f0] border-t border-gray-300 font-bold sticky bottom-0 z-10 shadow-[0_-1px_0_0_#d1d5db]">
                                  <TableCell colSpan={12} className="text-center border-r border-gray-300 text-gray-800">합 계</TableCell>
                                  <TableCell className="text-right border-r border-gray-300 pr-2 text-blue-800">{totals.qty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right pr-2 text-red-700">{totals.totalAmt.toLocaleString()}</TableCell>
                              </TableRow>
                          </>
                      )}

                      {gridData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
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
          initialSearchName={scmSupplierName} 
          excludedCodes={['0900216', '0900224', '0900252']}
          onSelect={(item) => { setScmSupplierCode(item.code); setScmSupplierName(item.name); }} 
      />

    </div>
  );
}