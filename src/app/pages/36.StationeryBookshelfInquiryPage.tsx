import React, { useState } from 'react';
import { Calendar, Search, Download, Printer } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format, subDays } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
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
type BookshelfData = {
    id: string;
    no: number;
    inboundDate: string;
    expectedDate: string;
    facilityType: string;
    inboundType: string;
    bookshelfNo: string;
    productType: string;
    pCode: string;
    pName: string;
    suppCode: string;
    suppName: string;
    inQty: number;
    unitStr: string;
    totalQty: number;
    partnerLoc: string;
    workerId: string;
    workerName: string;
    workDateTime: string;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function StationeryBookshelfInquiryPage() {
  const { products = [], suppliers = [] } = useMockData();

  // 1. 조회 조건 State
  const [sLoc, setSLoc] = useState('009 파주센터'); // [cite: 26]
  const [sPurchaseType, setSPurchaseType] = useState('전체'); // [cite: 28]
  const [sProdCode, setSProdCode] = useState('');
  const [sProdName, setSProdName] = useState('');
  
  const [sBookshelfArea, setSBookshelfArea] = useState('전체'); // [cite: 31]
  const [sSuppCode, setSSuppCode] = useState('');
  const [sSuppName, setSSuppName] = useState('');
  
  const [sDateType, setSDateType] = useState<'입고' | '예정'>('입고'); // [cite: 113]
  const [sDateStart, setSDateStart] = useState(format(subDays(new Date(), 3), 'yyyy-MM-dd'));
  const [sDateEnd, setSDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 2. 그리드 데이터 State
  const [gridData, setGridData] = useState<BookshelfData[]>([]);

  // 3. 팝업 상태
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 4. 데이터 핸들러
  // -------------------------------------------------------------------
  const handleSearch = () => {
      // 실제 상품 정보를 바탕으로 더미 데이터 생성 로직 적용
      let targetProducts = products;
      if (sProdCode) {
          targetProducts = products.filter(p => p.productCode.includes(sProdCode));
      }
      
      if (targetProducts.length === 0) targetProducts = products; // 방어코드
      
      const sampleSize = Math.min(targetProducts.length, 10);
      const shuffled = [...targetProducts].sort(() => 0.5 - Math.random()).slice(0, sampleSize);

      const mockData: BookshelfData[] = shuffled.map((p, i) => {
          const supplier = suppliers.find(s => s.code === p.supplierCode) || { code: p.supplierCode || '1311222', name: '스테들러코리아' }; // [cite: 66, 67]
          
          // 물류사용단위 포맷 구성 e.g., DZ(12), BOX(10) [cite: 15]
          const unitTypes = [{ name: 'DZ', qty: 12 }, { name: 'BOX', qty: 10 }, { name: 'EA', qty: 1 }, { name: 'SET', qty: 5 }];
          const unit = unitTypes[i % unitTypes.length];
          const unitStr = `${unit.name}(${unit.qty})`;
          
          const inQty = Math.floor(Math.random() * 20) + 5;
          const totalQty = inQty * unit.qty; // [cite: 15]

          return {
              id: `BS-${i}`,
              no: i + 1,
              inboundDate: sDateStart, // [cite: 16]
              expectedDate: sDateStart, // [cite: 16]
              facilityType: '일반서가', // [cite: 60]
              inboundType: '거래처입고', // [cite: 61]
              bookshelfNo: `10101${i + 1}`, // [cite: 62]
              productType: '문구', // [cite: 63]
              pCode: p.productCode,
              pName: p.productName,
              suppCode: supplier.code,
              suppName: supplier.name,
              inQty: inQty,
              unitStr: unitStr,
              totalQty: totalQty,
              partnerLoc: sLoc.includes('파주') ? '파주센터' : '북시티센터', // [cite: 71]
              workerId: '12951', // [cite: 72]
              workerName: '권예림', // [cite: 73]
              workDateTime: `${sDateStart} 10:36:38` // [cite: 17, 74]
          };
      });

      setGridData(mockData);
  };

  const handleReset = () => {
      setSLoc('009 파주센터'); setSPurchaseType('전체');
      setSProdCode(''); setSProdName('');
      setSBookshelfArea('전체'); setSSuppCode(''); setSSuppName('');
      setSDateType('입고'); 
      setSDateStart(format(subDays(new Date(), 3), 'yyyy-MM-dd')); 
      setSDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setGridData([]);
  };

  const handleExcelDownload = () => {
      if (gridData.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const data = gridData.map(d => ({
          'NO': d.no, '입고일자': d.inboundDate, '예정일자': d.expectedDate, '설비구분': d.facilityType,
          '입고구분': d.inboundType, '서가번호': d.bookshelfNo, '상품구분': d.productType,
          '상품코드': d.pCode, '상품명': d.pName, '매입처': d.suppCode, '매입처명': d.suppName,
          '입고수량': d.inQty, '물류사용단위': d.unitStr, '총입고수량': d.totalQty,
          '상대처': d.partnerLoc, '작업자ID': d.workerId, '작업자': d.workerName, '작업일시': d.workDateTime
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "서가번호조회");
      XLSX.writeFile(wb, `서가번호조회.xlsx`);
  };

  return (
    <div className="erp-page">
      <div className="erp-page-title flex items-center">
        <h2>문구 서가번호조회</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 온라인 직매입 및 배송대행 상품을 위한 서가번호 조회 화면입니다.
        </span>
      </div>

      

      {/* 1. 조회 조건 영역 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
          </div>
          <div className="border border-gray-300 bg-white">
              <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr] border-b border-gray-300">
                 
                 {/* 1 Row */}
                 <Label required>수불처</Label>
                 <div className="p-1 border-r border-gray-200">
                     <Select value={sLoc} onValueChange={setSLoc}>
                         <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="009 파주센터">009 파주센터</SelectItem>
                             <SelectItem value="020 북시티">020 북시티</SelectItem>
                         </SelectContent>
                     </Select>
                 </div>

                 <Label>매입구분</Label>
                 <div className="p-1 border-r border-gray-200">
                     <Select value={sPurchaseType} onValueChange={setSPurchaseType}>
                         <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="전체">전체</SelectItem>
                             <SelectItem value="직매입">직매입</SelectItem>
                             <SelectItem value="특정매입">특정매입</SelectItem>
                         </SelectContent>
                     </Select>
                 </div>

                 <Label>상품코드</Label>
                 <div className="flex items-center gap-1 p-1 border-r border-gray-200">
                     <ProductCodeSearchField
                       productCode={sProdCode}
                       setProductCode={setSProdCode}
                       productName={sProdName}
                       setProductName={setSProdName}
                       codePlaceholder="미입력시 전체"
                     />
                 </div>

                 {/* 2 Row */}
                 <Label className="border-t border-gray-200">서가지역</Label>
                 <div className="p-1 border-r border-t border-gray-200">
                     <Select value={sBookshelfArea} onValueChange={setSBookshelfArea}>
                         <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="전체">전체</SelectItem>
                             <SelectItem value="일반서가">일반서가</SelectItem>
                             <SelectItem value="특별서가">특별서가</SelectItem>
                         </SelectContent>
                     </Select>
                 </div>

                 <Label className="border-t border-gray-200">매입처</Label>
                 <div className="flex items-center gap-1 p-1 border-r border-t border-gray-200">
                     <Input className="h-6 w-[100px] text-[11px] font-bold bg-white" placeholder="매입처코드" value={sSuppCode} readOnly />
                     <Button variant="outline" className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsSuppModalOpen(true)}>
                         <Search className="w-3.5 h-3.5 text-white" />
                     </Button>
                     <Input className="h-6 flex-1 text-[11px] bg-gray-100" readOnly tabIndex={-1} value={sSuppName} placeholder="미입력시 전체" />
                 </div>

                 <Label required className="border-t border-gray-200">조회일자</Label>
                 <div className="p-1 border-t border-gray-200 flex items-center gap-3 pl-3">
                     <div className="flex items-center gap-3 mr-2 text-[11px] font-bold text-gray-700">
                         <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name="dateType" checked={sDateType === '입고'} onChange={() => setSDateType('입고')} className="cursor-pointer"/> 입고
                         </label>
                         <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name="dateType" checked={sDateType === '예정'} onChange={() => setSDateType('예정')} className="cursor-pointer"/> 예정
                         </label>
                     </div>
                     <DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} />
                 </div>
              </div>
           </div>{/* close border div */}
           <div className="erp-search-actions">
              <Button className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
              <Button className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
           </div>
      </div>

      {/* 2. 입고내역 그리드 */}
      <div className="erp-section-group flex-1 flex flex-col min-h-0">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">입고내역 [총 {gridData.length} 건]</span>
             
             <div className="flex gap-1 pr-1">
                 <Button className="erp-btn-action" onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운(F1)</Button>
                 <Button className="erp-btn-action" onClick={() => alert('출력 기능 호출 (모의)')}><Printer className="w-3.5 h-3.5 mr-1"/>출력(F8)</Button>
             </div>
          </div>
          <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[1800px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          {/* 기획서 순서 매핑  */}
                          <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300">NO</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">입고일자</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">예정일자</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">설비구분</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">입고구분</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">서가번호</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">상품구분</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[250px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">매입처</TableHead>
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">매입처명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">입고수량</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">물류사용단위</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">총입고수량</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">상대처</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">작업자ID</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">작업자</TableHead>
                          <TableHead className="text-center font-bold text-gray-900">작업일시</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                              <TableCell className="text-center border-r border-gray-200">{row.no}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.inboundDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.expectedDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.facilityType}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.inboundType}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold text-blue-700">{row.bookshelfNo}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.productType}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.pName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.suppCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.suppName}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold">{row.inQty.toLocaleString()}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.unitStr}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-blue-700 bg-blue-50/20">{row.totalQty.toLocaleString()}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.partnerLoc}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.workerId}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.workerName}</TableCell>
                              <TableCell className="text-center text-gray-500">{row.workDateTime}</TableCell>
                          </TableRow>
                      ))}

                      {gridData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 18 }).map((_, j) => (
                              <TableCell key={j} className={j < 17 ? "border-r border-gray-200" : ""}></TableCell>
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
          initialSearchName={sProdName} 
          onSelect={(item) => { setSProdCode(item.productCode); setSProdName(item.productName); }} 
      />
      <SupplierSearchModal 
          isOpen={isSuppModalOpen} 
          onClose={() => setIsSuppModalOpen(false)} 
          initialSearchName={sSuppName} 
          onSelect={(item) => { setSSuppCode(item.code); setSSuppName(item.name); }} 
      />

    </div>
  );
}