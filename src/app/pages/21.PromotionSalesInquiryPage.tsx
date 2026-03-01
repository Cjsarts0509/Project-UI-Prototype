import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Download, Send, ChevronDown, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const DateRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 10 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[100px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={endVal} onChange={(e) => onEndChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
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
const subActionBtnClass = "erp-btn-sub";

const BRANCH_LIST = [
  "광화문점", "강남점", "잠실점", "영등포점", "분당점", "목동점", "일산점", 
  "평촌점", "인천점", "천안점", "대구점", "반월당점", "부산점", "센텀시티점", "창원점", "전주점", "온라인"
];

export default function PromotionSalesInquiryPage() {
  const { products, suppliers } = useMockData();

  const [sPromoCode, setSPromoCode] = useState('');
  const [sDateStart, setSDateStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sDateEnd, setSDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['전체']);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const [dbPromos, setDbPromos] = useState<any[]>([]);
  const [dbSalesMap, setDbSalesMap] = useState<Record<string, any[]>>({});

  const [promoData, setPromoData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
              setIsBranchOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
      if (!products || !suppliers) return;

      const stationeryProducts = products.filter(p => {
          const supplierInfo = suppliers.find(s => s.code === p.supplierCode);
          return supplierInfo && String(supplierInfo.categoryCode) === '8';
      });

      const bySupplier: Record<string, typeof products> = {};
      stationeryProducts.forEach(p => {
          if (!bySupplier[p.supplierCode]) bySupplier[p.supplierCode] = [];
          bySupplier[p.supplierCode].push(p);
      });

      const generatedPromos: any[] = [];
      const generatedSales: Record<string, any[]> = {};
      
      let promoIndex = 1;
      
      for (const [sCode, prods] of Object.entries(bySupplier)) {
          if (prods.length === 0) continue;
          
          const promoCode = `${format(new Date(), 'yyyyMMdd')}${String(promoIndex).padStart(5, '0')}`;
          const shareRate = (promoIndex % 3 + 1) * 5; 
          const sInfo = suppliers.find(s => s.code === sCode);

          generatedPromos.push({
              id: promoCode,
              name: `[${sInfo?.name}] 특별 기획전 ${shareRate}%`,
              discType: '정율할인',
              shareRate: shareRate,
              target: '전체',
              start: '2025-01-01',
              end: '2025-12-31',
              regDate: '2025-01-10',
              note: '자동 생성된 더미 매출 데이터'
          });

          generatedSales[promoCode] = prods.map((p, idx) => {
              const listPrice = p.listPrice || 1000;
              const salePrice = Math.round(listPrice * (1 - (shareRate / 100)));
              const qty = Math.floor(Math.random() * 80) + 10; 
              
              // ★ 요청하신 산식 반영
              const salesAmt = listPrice * qty; // 매출금액 = 정가 * 매출수량
              const actualSalesAmt = salePrice * qty; // 실매출금액 = 판매가 * 매출수량
              const shareAmt = Math.round(salesAmt * (shareRate / 100)); // 분담금액 = 매출금액 * 분담율 // 분담금액은 실매출금액 기준으로 세팅

              return {
                  id: `sale-${promoCode}-${idx}`,
                  sCode: p.supplierCode,
                  sName: p.supplierName,
                  sItemCode: p.supplierItemCode || `S-ITM-${p.productCode.slice(-4)}`,
                  sItemName: sInfo?.supplierItemCodeName || '문구품목',
                  group: p.groupCategory || '문구',
                  pCode: p.productCode,
                  pName: p.productName,
                  brand: p.brand || '-',
                  listPrice: listPrice,
                  discountRate: shareRate, // ★ 할인율 항목 추가
                  salePrice: salePrice,
                  qty: qty,
                  salesAmt: salesAmt,
                  actualSalesAmt: actualSalesAmt,
                  shareAmt: shareAmt
              };
          });
          
          promoIndex++;
      }

      setDbPromos(generatedPromos);
      setDbSalesMap(generatedSales);

      if (generatedPromos.length > 0) {
          setSPromoCode(generatedPromos[0].id);
      }
  }, [products, suppliers]);

  const handleBranchToggle = (branch: string) => {
      if (branch === '전체') {
          setSelectedBranches(['전체']);
      } else {
          let newSelected = selectedBranches.filter(b => b !== '전체');
          if (newSelected.includes(branch)) {
              newSelected = newSelected.filter(b => b !== branch);
          } else {
              newSelected.push(branch);
          }
          if (newSelected.length === 0) newSelected = ['전체'];
          setSelectedBranches(newSelected);
      }
  };

  const handleSearch = () => {
      if (!sPromoCode.trim()) return alert('분담프로모션코드를 입력해주세요. (필수)');
      if (!sDateStart || !sDateEnd) return alert('매출일자를 입력해주세요. (필수)');

      const targetPromo = dbPromos.find(p => p.id === sPromoCode.trim());
      
      if (targetPromo) {
          setPromoData([targetPromo]);
          setSalesData(dbSalesMap[targetPromo.id] || []);
      } else {
          alert('해당 프로모션 코드로 조회된 내역이 없습니다.');
          setPromoData([]);
          setSalesData([]);
      }
  };

  const handleReset = () => {
      setSPromoCode(dbPromos.length > 0 ? dbPromos[0].id : '');
      setSDateStart(format(new Date(), 'yyyy-MM-dd'));
      setSDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setSelectedBranches(['전체']);
      setPromoData([]);
      setSalesData([]);
  };

  const handleFinanceTransfer = () => {
      if (salesData.length === 0) return alert('전송할 매출 데이터가 없습니다.');
      if (confirm(`조회된 총 ${salesData.length}건의 분담프로모션매출정보를 IFAS(재무) 시스템으로 전송하시겠습니까?`)) {
          alert('재무전송 완료: IFAS 시스템으로 정산 데이터가 성공적으로 이관되었습니다.');
      }
  };

  const handleExcelDownload = () => {
      if (salesData.length === 0) return alert("다운로드할 매출 데이터가 없습니다.");
      const exportData = salesData.map(r => ({
          '매입처코드': r.sCode, '매입처명': r.sName, '매입처품목코드': r.sItemCode, '매입처품목명': r.sItemName,
          '조코드': r.group, '상품코드': r.pCode, '상품명': r.pName, '브랜드': r.brand,
          '정가': r.listPrice, '할인율': `${r.discountRate}%`, '판매가': r.salePrice, '매출수량': r.qty,
          '매출금액': r.salesAmt, '실매출금액': r.actualSalesAmt, '업체분담금액': r.shareAmt
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "매출조회");
      XLSX.writeFile(wb, `분담프모션매출_${sPromoCode}.xlsx`);
  };

  const totalQty = salesData.reduce((sum, r) => sum + r.qty, 0);
  const totalSalesAmt = salesData.reduce((sum, r) => sum + r.salesAmt, 0);
  const totalActualAmt = salesData.reduce((sum, r) => sum + r.actualSalesAmt, 0);
  const totalShareAmt = salesData.reduce((sum, r) => sum + r.shareAmt, 0);

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-4">
      {/* 1. 조회 영역 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">분담프로모션매출조회</h2>
      </div>

      <div className="erp-search-area">
      <div className="flex flex-col border border-gray-300 bg-[#fefefe] flex-shrink-0">
           <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
              <Label className="border-b border-gray-200" required>분담프로모션코드</Label>
              <div className="p-1 border-b border-r border-gray-200">
                  <Input className="h-6 w-[200px] text-[11px] font-bold border-blue-400 focus-visible:ring-blue-500" maxLength={13} value={sPromoCode} onChange={e => setSPromoCode(e.target.value.replace(/[^0-9]/g, ''))} placeholder="숫자 13자리 입력" />
              </div>
              
              <Label className="border-b border-gray-200" required>매출일자</Label>
              <div className="flex items-center p-1 border-b border-r border-gray-200 px-3">
                  <DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} />
              </div>

              <Label className="border-b border-gray-200">영업점</Label>
              <div className="p-1 border-b relative" ref={branchDropdownRef}>
                  <div 
                     className="flex items-center justify-between h-6 w-full px-2 border border-gray-300 bg-white cursor-pointer rounded-[2px] hover:border-gray-400"
                     onClick={() => setIsBranchOpen(!isBranchOpen)}
                  >
                      <span className="text-[11px] truncate text-gray-700 font-medium">
                          {selectedBranches.includes('전체') ? '전체' : selectedBranches.join(', ')}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  
                  {isBranchOpen && (
                      <div className="absolute top-full left-1 mt-1 w-[220px] max-h-[250px] overflow-y-auto bg-white border border-gray-300 shadow-lg z-50 rounded-[2px] p-1 grid grid-cols-2 gap-1 custom-scrollbar">
                          <div className="col-span-2 flex items-center p-1 hover:bg-gray-50 cursor-pointer border-b border-gray-200 pb-1.5 mb-1" onClick={() => handleBranchToggle('전체')}>
                              <Checkbox className="h-3.5 w-3.5 mr-2 rounded-[2px]" checked={selectedBranches.includes('전체')} />
                              <span className="font-bold text-gray-800">전체</span>
                          </div>
                          {BRANCH_LIST.map((branch) => (
                              <div key={branch} className="flex items-center p-1 hover:bg-gray-50 cursor-pointer" onClick={() => handleBranchToggle(branch)}>
                                  <Checkbox className="h-3.5 w-3.5 mr-2 rounded-[2px]" checked={selectedBranches.includes(branch) && !selectedBranches.includes('전체')} />
                                  <span className="text-gray-700">{branch}</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
           </div>
      </div>
      <div className="erp-search-actions">
               <Button variant="outline" className={headerBtnClass} onClick={handleReset}>초기화(F3)</Button>
               <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
       </div>
      </div>

      {/* 2. 프로모션 요약 */}
      <div className="erp-section-group flex-shrink-0">
       <div className="erp-section-toolbar">
              <span className="erp-section-title">분담프로모션정보 내역</span>
       </div>
       <div className="border border-gray-300 bg-white flex flex-col">
          <div className="overflow-auto bg-white">
             <Table className="table-fixed min-w-[1000px] border-collapse text-[11px]">
                 <TableHeader className="bg-[#f4f4f4] border-b border-gray-300">
                     <TableRow className="h-8">
                         <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">분담프로모션코드</TableHead>
                         <TableHead className="w-[220px] text-center font-bold text-gray-900 border-r border-gray-300">분담프로모션명</TableHead>
                         <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">분담프로모션할인종류</TableHead>
                         <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">업체분담율(%)</TableHead>
                         <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">대상고객</TableHead>
                         <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">행사시작일</TableHead>
                         <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">행사종료일</TableHead>
                         <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">등록일자</TableHead>
                         <TableHead className="text-center font-bold text-gray-900">비고</TableHead>
                     </TableRow>
                 </TableHeader>
                 <TableBody>
                     {promoData.map((row) => (
                         <TableRow key={row.id} className="h-7 bg-blue-50/30">
                             <TableCell className="text-center border-r border-gray-200 font-bold">{row.id}</TableCell>
                             <TableCell className="text-left border-r border-gray-200 truncate pl-2 font-bold text-blue-800">{row.name}</TableCell>
                             <TableCell className="text-center border-r border-gray-200 font-medium">{row.discType}</TableCell>
                             <TableCell className="text-right border-r border-gray-200 pr-3 font-bold text-red-600">{row.shareRate}%</TableCell>
                             <TableCell className="text-center border-r border-gray-200">{row.target}</TableCell>
                             <TableCell className="text-center border-r border-gray-200">{row.start}</TableCell>
                             <TableCell className="text-center border-r border-gray-200">{row.end}</TableCell>
                             <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.regDate}</TableCell>
                             <TableCell className="text-left truncate pl-2 text-gray-600">{row.note}</TableCell>
                         </TableRow>
                     ))}
                     {promoData.length === 0 && (
                         <TableRow>
                             <TableCell colSpan={9} className="h-12 text-center text-gray-400 font-medium bg-white">
                                 프로모션 코드를 입력 후 조회하세요. (초기 더미 코드가 자동 세팅되어 있습니다)
                             </TableCell>
                         </TableRow>
                     )}
                 </TableBody>
             </Table>
          </div>
       </div>
      </div>

      {/* 3. 분담프로모션매출정보 영역 */}
      <div className="erp-section-group min-h-0 flex-1">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">분담프로모션매출정보</span>
          <div className="flex gap-1.5">
             <Button className="erp-btn-action" onClick={handleFinanceTransfer}>
                 <Send className="w-3 h-3 mr-1"/> 재무전송
             </Button>
             <Button className="erp-btn-action" onClick={handleExcelDownload}>
                 <Download className="w-3 h-3 mr-1"/> 엑셀다운
             </Button>
         </div>
       </div>
       <div className="flex flex-col flex-1 border border-gray-300 bg-white overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
              <Table className="table-fixed min-w-[1680px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db] border-b border-gray-300">
                      <TableRow className="h-8">
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">매입처코드</TableHead>
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">매입처명</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목코드</TableHead>
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목명</TableHead>
                          <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300">조코드</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[220px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">브랜드</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">정가</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300 text-red-600">할인율</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 text-blue-700">판매가</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">매출수량</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">매출금액</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">실매출금액</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-white bg-red-500">업분담금액</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {salesData.map((row) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 hover:bg-gray-50 transition-colors bg-white">
                              <TableCell className="text-center border-r border-gray-200 font-medium">{row.sCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.sName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-600 font-medium">{row.sItemCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2 text-gray-500">{row.sItemName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.group}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 font-bold truncate pl-2" title={row.pName}>{row.pName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.brand}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2">{row.listPrice.toLocaleString()}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-red-600 font-bold">{row.discountRate}%</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 text-blue-700 font-bold">{row.salePrice.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 bg-yellow-50/30 font-bold">{row.qty.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 bg-yellow-50/30 font-bold">{row.salesAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 bg-yellow-50/30 font-bold text-gray-800">{row.actualSalesAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-2 bg-red-50 font-bold text-red-600 text-[12px]">{row.shareAmt.toLocaleString()}</TableCell>
                          </TableRow>
                      ))}
                      
                      {/* 합계(Total) Row */}
                      {salesData.length > 0 && (
                          <TableRow className="h-9 bg-[#eef3f8] border-t-2 border-gray-300 font-bold sticky bottom-0 z-10 shadow-[0_-1px_0_0_#d1d5db]">
                              <TableCell colSpan={11} className="text-center border-r border-gray-300 text-[12px] text-gray-800">
                                  Total Count: <span className="text-blue-700 ml-1">{salesData.length}</span>
                              </TableCell>
                              <TableCell className="text-right border-r border-gray-300 pr-2 text-blue-700">{totalQty.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-300 pr-2 text-blue-700">{totalSalesAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-300 pr-2 text-blue-700">{totalActualAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-2 text-red-600 text-[13px]">{totalShareAmt.toLocaleString()}</TableCell>
                          </TableRow>
                      )}

                      {salesData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
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
  );
}