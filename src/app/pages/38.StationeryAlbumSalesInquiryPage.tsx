import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format, subMonths } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

// -------------------------------------------------------------------
// 1. 공통 헬퍼 컴포넌트
// -------------------------------------------------------------------
const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-blue-600 whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

// -------------------------------------------------------------------
// 2. 타입 정의
// -------------------------------------------------------------------
type SalesMainData = {
    id: string;
    suppCode: string;
    suppName: string;
    purchaseType: string;
    qty: number;
    costAmt: number;
    costVat: number;
    salesAmt: number;
    salesVat: number;
    marginRate: number;
};

type SalesSummaryData = {
    category: string;
    qty: number;
    costAmt: number;
    costVat: number;
    salesAmt: number;
    salesVat: number;
    marginRate: number;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function StationeryAlbumSalesInquiryPage() {
  const { suppliers = [] } = useMockData();

  // 조회 조건 State
  const [aggType, setAggType] = useState<'년집계' | '월집계'>('년집계');
  
  const currentYear = format(new Date(), 'yyyy');
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [sYear, setSYear] = useState(currentYear);
  const [sMonthStart, setSMonthStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [sMonthEnd, setSMonthEnd] = useState(currentMonth);

  const [sBranch, setSBranch] = useState('전체 영업점');
  const [sProdType, setSProdType] = useState('전체');
  const [sPurchaseType, setSPurchaseType] = useState('전체');
  const [sMall, setSMall] = useState('전체');

  // 데이터 State
  const [mainData, setMainData] = useState<SalesMainData[]>([]);
  const [prodSummaryData, setProdSummaryData] = useState<SalesSummaryData[]>([]);
  const [purchSummaryData, setPurchSummaryData] = useState<SalesSummaryData[]>([]);

  // -------------------------------------------------------------------
  // 4. 데이터 연산 및 핸들러
  // -------------------------------------------------------------------
  const handleSearch = () => {
      const shuffledSuppliers = [...suppliers].sort(() => 0.5 - Math.random()).slice(0, 15);
      
      const newMainData: SalesMainData[] = shuffledSuppliers.map((supp, i) => {
          const qty = Math.floor(Math.random() * 500) + 10;
          const costAmt = qty * (Math.floor(Math.random() * 10000) + 5000);
          const costVat = Math.floor(costAmt * 0.1);
          const salesAmt = Math.floor(costAmt * (1 + (Math.random() * 0.3 + 0.05))); 
          const salesVat = Math.floor(salesAmt * 0.1);
          const marginRate = ((salesAmt - costAmt) / salesAmt) * 100;

          return {
              id: `SL-${i}`,
              suppCode: supp.code,
              suppName: supp.name,
              purchaseType: supp.purchaseTypeCode === 503 ? '특정매입' : '직매입',
              qty, costAmt, costVat, salesAmt, salesVat, marginRate
          };
      });

      setMainData(newMainData);

      const prodCategories = ['문구', '음반', '해외문구'];
      setProdSummaryData(prodCategories.map(cat => generateRandomSummary(cat)));

      const purchCategories = ['직매입', '특정매입'];
      setPurchSummaryData(purchCategories.map(cat => generateRandomSummary(cat)));
  };

  const generateRandomSummary = (category: string): SalesSummaryData => {
      const qty = Math.floor(Math.random() * 5000) + 500;
      const costAmt = qty * 8500;
      const salesAmt = Math.floor(costAmt * 1.15);
      return {
          category, qty, costAmt, costVat: costAmt * 0.1, salesAmt, salesVat: salesAmt * 0.1,
          marginRate: ((salesAmt - costAmt) / salesAmt) * 100
      };
  };

  const handleReset = () => {
      setAggType('년집계');
      setSYear(currentYear); setSMonthStart(format(subMonths(new Date(), 1), 'yyyy-MM')); setSMonthEnd(currentMonth);
      setSBranch('전체 영업점'); setSProdType('전체'); setSPurchaseType('전체'); setSMall('전체');
      setMainData([]); setProdSummaryData([]); setPurchSummaryData([]);
  };

  // 엑셀 다운로드 공통 로직
  const downloadExcel = (data: any[], fileName: string, sheetName: string) => {
      if (data.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleMainExcel = () => {
      const mapped = mainData.map(d => ({
          '매입처코드': d.suppCode, '매입처명': d.suppName, '매입구분': d.purchaseType,
          '매출수량': d.qty, '매출원가': d.costAmt, '매출부가세': d.salesVat,
          '실매출금액': d.salesAmt, '매출원가부가세': d.costVat, '이익율(%)': d.marginRate.toFixed(1)
      }));
      downloadExcel(mapped, '매출집계리스트', '전체리스트');
  };

  const handleProdExcel = () => {
      const mapped = prodSummaryData.map(d => ({
          '상품구분': d.category, '매출수량': d.qty, '매출원가': d.costAmt,
          '매출부가세': d.salesVat, '실매출금액': d.salesAmt, '원가부가세': d.costVat, '이익율(%)': d.marginRate.toFixed(1)
      }));
      downloadExcel(mapped, '상품구분별_매출집계', '상품구분별');
  };

  const handlePurchExcel = () => {
      const mapped = purchSummaryData.map(d => ({
          '매입구분': d.category, '매출수량': d.qty, '매출원가': d.costAmt,
          '매출부가세': d.salesVat, '실매출금액': d.salesAmt, '원가부가세': d.costVat, '이익율(%)': d.marginRate.toFixed(1)
      }));
      downloadExcel(mapped, '매입구분별_매출집계', '매입구분별');
  };

  const calcTotals = (data: any[]) => {
      return data.reduce((acc, curr) => {
          acc.qty += curr.qty || 0;
          acc.costAmt += curr.costAmt;
          acc.costVat += curr.costVat;
          acc.salesAmt += curr.salesAmt;
          acc.salesVat += curr.salesVat;
          return acc;
      }, { qty: 0, costAmt: 0, costVat: 0, salesAmt: 0, salesVat: 0 });
  };

  const mainTotals = calcTotals(mainData);
  const mainMargin = mainTotals.salesAmt ? ((mainTotals.salesAmt - mainTotals.costAmt) / mainTotals.salesAmt) * 100 : 0;
  const prodTotals = calcTotals(prodSummaryData);
  const prodMargin = prodTotals.salesAmt ? ((prodTotals.salesAmt - prodTotals.costAmt) / prodTotals.salesAmt) * 100 : 0;
  const purchTotals = calcTotals(purchSummaryData);
  const purchMargin = purchTotals.salesAmt ? ((purchTotals.salesAmt - purchTotals.costAmt) / purchTotals.salesAmt) * 100 : 0;

  return (
    <div className="erp-page">
      <div className="erp-page-title flex items-center">
        <h2>문구/음반 매출조회</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 조건에 따른 매출집계 및 구분에 따른 집계 결과를 확인합니다.
        </span>
      </div>

      {/* 1. 조회 조건 영역 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
          </div>
          <div className="border border-gray-300 bg-white">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr_120px_1fr] border-b border-gray-200">
             <Label required>집계구분</Label>
             <div className="p-1 border-r border-gray-200 flex items-center gap-3 px-3">
                 <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-gray-700">
                     <input type="radio" checked={aggType === '년집계'} onChange={() => setAggType('년집계')} className="cursor-pointer"/> 년집계
                 </label>
                 <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-gray-700">
                     <input type="radio" checked={aggType === '월집계'} onChange={() => setAggType('월집계')} className="cursor-pointer"/> 월집계
                 </label>
             </div>

             <Label required>매출년월</Label>
             <div className="p-1 border-r border-gray-200 flex items-center px-2 col-span-5">
                 {aggType === '년집계' ? (
                     <Select value={sYear} onValueChange={setSYear}>
                         <SelectTrigger className="h-6 w-[100px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                         <SelectContent>
                             {Array.from({length: 6}).map((_, i) => {
                                 const y = (parseInt(currentYear) - i).toString();
                                 return <SelectItem key={y} value={y}>{y}</SelectItem>
                             })}
                         </SelectContent>
                     </Select>
                 ) : (
                     <div className="flex items-center gap-1">
                         <input type="month" className="h-6 w-[120px] outline-none text-[11px] text-center px-1 border border-gray-300 rounded-[2px]" value={sMonthStart} onChange={(e) => setSMonthStart(e.target.value)} />
                         <span className="text-gray-500 text-[11px]">~</span>
                         <input type="month" className="h-6 w-[120px] outline-none text-[11px] text-center px-1 border border-gray-300 rounded-[2px]" value={sMonthEnd} onChange={(e) => setSMonthEnd(e.target.value)} />
                     </div>
                 )}
             </div>
          </div>
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr_120px_1fr]">
             <Label>영업점</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={sBranch} onValueChange={setSBranch}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체 영업점">전체 영업점</SelectItem>
                         <SelectItem value="오프라인계">오프라인계</SelectItem>
                         <SelectItem value="온라인">온라인</SelectItem>
                         <SelectItem value="본사문구음반">본사문구음반</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label>상품구분</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={sProdType} onValueChange={setSProdType}>
                     <SelectTrigger className="h-6 w-[100px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         <SelectItem value="문구">문구</SelectItem>
                         <SelectItem value="음반">음반</SelectItem>
                         <SelectItem value="해외문구">해외문구</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label>매입구분</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={sPurchaseType} onValueChange={setSPurchaseType}>
                     <SelectTrigger className="h-6 w-[100px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         <SelectItem value="직매입">직매입</SelectItem>
                         <SelectItem value="특정매입">특정매입</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label>제휴몰</Label>
             <div className="p-1">
                 <Select value={sMall} onValueChange={setSMall}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="전체">전체</SelectItem>
                         <SelectItem value="G마켓">G마켓</SelectItem>
                         <SelectItem value="11번가">11번가</SelectItem>
                     </SelectContent>
                 </Select>
             </div>
          </div>
          </div>
          <div className="erp-search-actions">
             <Button className="erp-btn-header w-20" onClick={handleReset}>초기화(F3)</Button>
             <Button className="erp-btn-header w-20" onClick={handleSearch}>조회(F4)</Button>
          </div>
      </div>

      {/* 2. 메인: 매출집계 리스트 */}
      <div className="erp-section-group flex-1 flex flex-col min-h-[250px]">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">매출집계 리스트</span>
             <div className="flex gap-1 pr-1">
                 <Button className="erp-btn-action" onClick={handleMainExcel}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운(F1)</Button>
             </div>
          </div>
          <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[1200px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">매입처코드</TableHead>
                          <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300">매입처명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">매입구분</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">매출수량</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">매출원가</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">매출부가세</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">실매출금액</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">매출원가부가세</TableHead>
                          <TableHead className="text-center font-bold text-gray-900">이익율</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {mainData.map((row) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.suppCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 pl-3">{row.suppName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.purchaseType}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3 font-bold">{row.qty.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3">{row.costAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3">{row.salesVat.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3 font-bold text-blue-700 bg-blue-50/20">{row.salesAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3">{row.costVat.toLocaleString()}</TableCell>
                              <TableCell className="text-center font-bold text-red-600">{row.marginRate.toFixed(1)}%</TableCell>
                          </TableRow>
                      ))}
                      {mainData.length > 0 && (
                          <TableRow className="h-8 bg-[#dfe7f0] border-t border-gray-300 font-bold sticky bottom-0 z-10">
                              <TableCell className="text-center border-r border-gray-200">합 산</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-blue-800">{mainData.length} 건</TableCell>
                              <TableCell className="text-center border-r border-gray-200"></TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3">{mainTotals.qty.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3">{mainTotals.costAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3">{mainTotals.salesVat.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3 text-blue-800">{mainTotals.salesAmt.toLocaleString()}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3">{mainTotals.costVat.toLocaleString()}</TableCell>
                              <TableCell className="text-center text-red-700">{mainMargin.toFixed(1)}%</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
          </div>
      </div>

      {/* 3. 하단 집계 테이블 */}
      <div className="flex gap-4 h-[250px] mb-4">
          {/* 상품구분별 집계 */}
          <div className="erp-section-group flex-1 flex flex-col">
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">상품구분별 집계</span>
                 {/* ★ 버튼 추가 */}
                 <div className="pr-1"><Button className="erp-btn-action" onClick={handleProdExcel}><Download className="w-3 h-3 mr-1"/>엑셀다운</Button></div>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[700px] text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[80px] text-center border-r">상품구분</TableHead>
                              <TableHead className="w-[80px] text-center border-r">매출수량</TableHead>
                              <TableHead className="w-[100px] text-center border-r">매출원가</TableHead>
                              <TableHead className="w-[100px] text-center border-r">실매출금액</TableHead>
                              <TableHead className="text-center">이익율</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {prodSummaryData.map((row, i) => (
                              <TableRow key={i} className="h-8 border-b bg-white">
                                  <TableCell className="text-center border-r font-bold">{row.category}</TableCell>
                                  <TableCell className="text-right border-r pr-2">{row.qty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2">{row.costAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2 font-bold text-blue-700 bg-blue-50/20">{row.salesAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-center font-bold text-red-600">{row.marginRate.toFixed(1)}%</TableCell>
                              </TableRow>
                          ))}
                          {prodSummaryData.length > 0 && (
                              <TableRow className="h-8 bg-[#dfe7f0] font-bold">
                                  <TableCell className="text-center border-r">합 산</TableCell>
                                  <TableCell className="text-right border-r pr-2">{prodTotals.qty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2">{prodTotals.costAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2 text-blue-800">{prodTotals.salesAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-center text-red-700">{prodMargin.toFixed(1)}%</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
              </div>
          </div>

          {/* 매입구분별 집계 */}
          <div className="erp-section-group flex-1 flex flex-col">
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">매입구분별 집계</span>
                 {/* ★ 버튼 추가 */}
                 <div className="pr-1"><Button className="erp-btn-action" onClick={handlePurchExcel}><Download className="w-3 h-3 mr-1"/>엑셀다운</Button></div>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[700px] text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[80px] text-center border-r">매입구분</TableHead>
                              <TableHead className="w-[80px] text-center border-r">매출수량</TableHead>
                              <TableHead className="w-[100px] text-center border-r">매출원가</TableHead>
                              <TableHead className="w-[100px] text-center border-r">실매출금액</TableHead>
                              <TableHead className="text-center">이익율</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {purchSummaryData.map((row, i) => (
                              <TableRow key={i} className="h-8 border-b bg-white">
                                  <TableCell className="text-center border-r font-bold">{row.category}</TableCell>
                                  <TableCell className="text-right border-r pr-2">{row.qty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2">{row.costAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2 font-bold text-blue-700 bg-blue-50/20">{row.salesAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-center font-bold text-red-600">{row.marginRate.toFixed(1)}%</TableCell>
                              </TableRow>
                          ))}
                          {purchSummaryData.length > 0 && (
                              <TableRow className="h-8 bg-[#dfe7f0] font-bold">
                                  <TableCell className="text-center border-r">합 산</TableCell>
                                  <TableCell className="text-right border-r pr-2">{purchTotals.qty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2">{purchTotals.costAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r pr-2 text-blue-800">{purchTotals.salesAmt.toLocaleString()}</TableCell>
                                  <TableCell className="text-center text-red-700">{purchMargin.toFixed(1)}%</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
              </div>
          </div>
      </div>
    </div>
  );
}