import React, { useState } from 'react';
import { Calendar, Search, FileSearch } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { format, subDays } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';

import { ProductSearchModal } from '../components/ProductSearchModal';

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

// ★ 해외문구 매입처 전용 코드 목록
const OVERSEAS_SUPPLIERS = ['0900216', '0900224', '0900252'];

// -------------------------------------------------------------------
// 2. 타입 정의
// -------------------------------------------------------------------
type ArrivalOrderData = {
    id: string;
    suppName: string;
    pCode: string;
    pName: string;
    foreignCost: number;
    foreignListPrice: number;
    availableQty: number; // 입하가능수량
    arrivalQty: number;   // 입하수량
    unconfirmedQty: number; // 미확인수량
    isDamaged: boolean;   // 파손
    invoiceNo: string;
    orderUser: string;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function OverseasStationeryArrivalPage() {
  const { products = [], suppliers = [] } = useMockData();

  // 1. 조회 조건 State
  const [sLoc, setSLoc] = useState('부곡리');
  const [sProdCode, setSProdCode] = useState('');
  const [sProdName, setSProdName] = useState('');
  const [sInvoiceNo, setSInvoiceNo] = useState('');
  const [sDateStart, setSDateStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [sDateEnd, setSDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 2. 그리드 및 등록내역 State
  const [gridData, setGridData] = useState<ArrivalOrderData[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  
  // 등록내역(상단 폼) 제어용
  const [formInvoice, setFormInvoice] = useState('');
  const [formUnconfirmedReason, setFormUnconfirmedReason] = useState('전체');

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 4. 데이터 핸들러
  // -------------------------------------------------------------------
  const handleSearch = () => {
      // ★ 실제 DB(Mock Data)에서 해외문구 매입처 3곳의 상품만 정확히 추출 (더미 데이터 조작 방지)
      const targetProducts = products.filter(p => OVERSEAS_SUPPLIERS.includes(p.supplierCode));

      const resultData: ArrivalOrderData[] = targetProducts.map((product, i) => {
          // 실제 매입처 정보 조회
          const supplier = suppliers.find(s => s.code === product.supplierCode);
          const suppName = supplier ? supplier.name : '해외문구업체';

          return {
              id: `ARR-${i}`,
              suppName: `${suppName}(${product.supplierCode})`,
              pCode: product.productCode,
              pName: product.productName,
              foreignCost: Math.floor(product.listPrice * 0.5 / 1300), // 임의 환율(1300) 달러 계산
              foreignListPrice: Math.floor(product.listPrice / 1300),
              availableQty: Math.floor(Math.random() * 50) + 10,
              arrivalQty: 0,
              unconfirmedQty: 0,
              isDamaged: false,
              invoiceNo: sInvoiceNo || `INV-24100${i}`,
              orderUser: '권예림 (12951)'
          };
      });

      setGridData(resultData);
      setSelectedRowId(null);
  };

  const handleReset = () => {
      setSLoc('부곡리'); setSProdCode(''); setSProdName(''); setSInvoiceNo('');
      setSDateStart(format(subDays(new Date(), 7), 'yyyy-MM-dd')); setSDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setGridData([]); setSelectedRowId(null);
  };

  // 행 선택 시 상단 등록내역 폼에 데이터 연동
  const handleRowClick = (row: ArrivalOrderData) => {
      setSelectedRowId(row.id);
      setFormInvoice(row.invoiceNo);
      setFormUnconfirmedReason('전체');
  };

  // 그리드 입력 제어 (입하수량, 미확인수량, 파손)
  const handleGridChange = (id: string, field: keyof ArrivalOrderData, value: any) => {
      setGridData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
      if (!selectedRowId) return alert('저장할 내역을 선택해주세요.');
      alert('입하검수 내역이 성공적으로 저장되었습니다.');
  };

  const handleUnconfirmedSave = () => {
      alert('미확인상품으로 등록되었습니다.');
  };

  const handleOrderSearch = () => {
      alert('이전 발주정보 조회 팝업을 띄웁니다. (발주정보조회로 기간 넣어서 조회)');
  };

  // 선택된 행 데이터 추출 (상단 등록내역에 바인딩)
  const selectedRow = gridData.find(item => item.id === selectedRowId);

  return (
    <div className="erp-page">
      <div className="erp-page-title flex items-center">
        <h2>해외문구 입하등록</h2>
      </div>

      {/* 1. 상단 조회 조건 영역 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
          </div>
          <div className="border border-gray-300 bg-[#fefefe]">
             {/* 1 Row */}
             <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr] border-b border-gray-300">
             <Label required>수불처</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={sLoc} onValueChange={setSLoc}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="부곡리">부곡리</SelectItem>
                         <SelectItem value="북시티">북시티</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label required>상품구분</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-[150px] text-[11px] bg-gray-200 font-bold text-gray-700" value="해외문구" readOnly />
             </div>

             <Label>인보이스번호</Label>
             <div className="p-1">
                 <Input className="h-6 w-full text-[11px]" value={sInvoiceNo} onChange={e => setSInvoiceNo(e.target.value)} />
             </div>
             </div>

             {/* 2 Row */}
             <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             <Label>상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-r border-gray-200">
                 <Input className="h-6 w-[80px] text-[11px] bg-white" placeholder="ISBN" value={sProdCode} readOnly />
                 <Button variant="outline" className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsProdModalOpen(true)}>
                     <Search className="w-3.5 h-3.5 text-white" />
                 </Button>
                 <Input className="h-6 flex-1 text-[11px]" placeholder="상품명" value={sProdName} onChange={e => setSProdName(e.target.value)} />
             </div>

             <Label>입하일자</Label>
             <div className="p-1 flex items-center px-2 col-span-3">
                 <DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} />
             </div>
             </div>
          </div>
          <div className="erp-search-actions">
             <Button className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
             <Button className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
          </div>
      </div>

      {/* 2. 등록내역 영역 (폼 + 이미지) */}
      <div className="erp-section-group">
          {/* ★ 다른 화면과 동일한 ERP 기본 섹션 헤더 스타일 적용 */}
          <div className="erp-section-toolbar">
             <span className="erp-section-title">등록내역</span>
             
             {/* 모든 액션 버튼 룰 적용 */}
             <div className="flex gap-1 pr-1">
                 <Button className="erp-btn-action" onClick={handleOrderSearch}><FileSearch className="w-3.5 h-3.5 mr-1"/>발주정보조회</Button>
                 <Button className="erp-btn-action" onClick={handleUnconfirmedSave}>미확인상품등록</Button>
                 <div className="w-[1px] h-4 bg-gray-300 self-center mx-1"></div>
                 <Button className="erp-btn-action" onClick={() => alert('항목 추가')}>추가</Button>
                 <Button className="erp-btn-action" onClick={handleSave}>저장(F6)</Button>
             </div>
          </div>
          <div className="border border-gray-300 bg-white">
          <div className="p-3 bg-white flex gap-6 border-b border-gray-300">
              {/* 좌측 폼 영역 */}
              <div className="grid grid-cols-[100px_1fr_100px_1fr] border border-gray-300 w-[700px] h-fit">
                  
                  <Label className="border-b">상품명</Label>
                  <div className="p-1 border-b border-r border-gray-200">
                      <Input className="h-6 w-full text-[11px] bg-gray-100 font-bold" readOnly value={selectedRow?.pName || ''} />
                  </div>

                  <Label className="border-b">인보이스번호</Label>
                  <div className="p-1 border-b border-gray-200">
                      <Input className="h-6 w-full text-[11px]" value={formInvoice} onChange={e => setFormInvoice(e.target.value)} disabled={!selectedRow} />
                  </div>

                  <Label className="border-b">매입처</Label>
                  <div className="p-1 border-b border-r border-gray-200">
                      <Input className="h-6 w-full text-[11px] bg-gray-100" readOnly value={selectedRow?.suppName || ''} />
                  </div>

                  <Label className="border-b">미확인사유</Label>
                  <div className="p-1 border-b border-gray-200">
                      <Select value={formUnconfirmedReason} onValueChange={setFormUnconfirmedReason} disabled={!selectedRow}>
                         <SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="전체">선택하세요</SelectItem>
                             <SelectItem value="오배송">오배송</SelectItem>
                             <SelectItem value="파손">파손</SelectItem>
                             <SelectItem value="수량부족">수량부족</SelectItem>
                         </SelectContent>
                      </Select>
                  </div>

                  <Label className="border-b">외화원가</Label>
                  <div className="p-1 border-b border-r border-gray-200 flex items-center gap-1 bg-[#eef3f8]">
                      <span className="font-bold text-gray-700 ml-1">$</span>
                      <Input className="h-6 w-[100px] text-[11px] text-right bg-white" readOnly value={selectedRow?.foreignCost || ''} />
                  </div>
                  <div className="col-span-2 border-b border-gray-200 bg-[#eef3f8]"></div>

                  <Label>발주자</Label>
                  <div className="p-1 border-r border-gray-200 flex gap-1 bg-[#eef3f8]">
                      <Input className="h-6 w-[80px] text-[11px] bg-gray-100 text-center" readOnly value={selectedRow ? selectedRow.orderUser.split(' ')[1].replace(/[()]/g, '') : ''} />
                      <Input className="h-6 flex-1 text-[11px] bg-gray-100 text-center" readOnly value={selectedRow ? selectedRow.orderUser.split(' ')[0] : ''} />
                  </div>
                  <div className="col-span-2 bg-[#eef3f8]"></div>
              </div>

              {/* 우측 이미지 영역 (펜/문구류 고정 이미지 적용) */}
              <div className="flex-shrink-0 w-[180px] h-[180px] border border-gray-300 rounded-sm bg-gray-50 flex items-center justify-center overflow-hidden">
                  {selectedRowId ? (
                      <img src={`https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=200&h=200&fit=crop`} alt="상품 대표이미지" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-gray-400 text-[11px]">상품을 선택하세요</span>
                  )}
              </div>
          </div>
          </div>
      </div>

      {/* 3. 하단 발주목록 그리드 */}
      <div className="erp-section-group flex-1 flex flex-col min-h-0">
          {/* ★ 다른 화면과 동일한 ERP 기본 섹션 헤더 스타일 적용 */}
          <div className="erp-section-toolbar">
             <span className="erp-section-title">발주목록</span>
          </div>
          <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[1200px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">매입처</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          {/* ★ 상품명 폭 확대 (450px) */}
                          <TableHead className="w-[450px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">외화원가</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">외화정가</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">입하가능수량</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">입하수량</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">미확인수량</TableHead>
                          {/* ★ 파손 폭 축소 (60px) */}
                          <TableHead className="w-[60px] text-center font-bold text-gray-900">파손</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => {
                          const isSelected = selectedRowId === row.id;
                          return (
                              <TableRow 
                                  key={row.id} 
                                  className={cn("h-8 border-b border-gray-200 cursor-pointer", isSelected ? "bg-blue-100/50" : "bg-white hover:bg-blue-50")}
                                  onClick={() => handleRowClick(row)}
                              >
                                  <TableCell className="text-left border-r border-gray-200 pl-2">{row.suppName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.pName}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.foreignCost}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.foreignListPrice}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-4 font-bold">{row.availableQty}</TableCell>
                                  
                                  {/* 입력 가능 영역: 노란색 배경 */}
                                  <TableCell className="text-center border-r border-gray-200 p-0">
                                      <input 
                                          type="number" min="0" 
                                          className="w-full h-full text-right px-2 font-bold text-[12px] bg-yellow-100 outline-none focus:bg-yellow-200 border-2 border-transparent focus:border-blue-400" 
                                          value={row.arrivalQty === 0 ? '' : row.arrivalQty} 
                                          onChange={e => handleGridChange(row.id, 'arrivalQty', parseInt(e.target.value) || 0)}
                                      />
                                  </TableCell>
                                  <TableCell className="text-center border-r border-gray-200 p-0">
                                      <input 
                                          type="number" min="0" 
                                          className="w-full h-full text-right px-2 font-bold text-[12px] bg-yellow-100 outline-none focus:bg-yellow-200 border-2 border-transparent focus:border-blue-400" 
                                          value={row.unconfirmedQty === 0 ? '' : row.unconfirmedQty} 
                                          onChange={e => handleGridChange(row.id, 'unconfirmedQty', parseInt(e.target.value) || 0)}
                                      />
                                  </TableCell>
                                  
                                  <TableCell className="text-center p-0 flex items-center justify-center h-8">
                                      <Checkbox 
                                          checked={row.isDamaged} 
                                          onCheckedChange={(checked) => handleGridChange(row.id, 'isDamaged', checked)}
                                          className="w-4 h-4"
                                      />
                                  </TableCell>
                              </TableRow>
                          );
                      })}
                      {gridData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
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

      {/* ★ 해외문구 매입처 전용 검증 로직이 포함된 상품 검색 팝업 */}
      <ProductSearchModal 
          isOpen={isProdModalOpen} 
          onClose={() => setIsProdModalOpen(false)} 
          initialSearchName={sProdName} 
          onSelect={(item) => { 
              if (!OVERSEAS_SUPPLIERS.includes(item.supplierCode)) {
                  alert('해외문구 매입처(0900216, 0900224, 0900252) 상품만 조회/선택이 가능합니다.');
                  return;
              }
              setSProdCode(item.productCode); 
              setSProdName(item.productName); 
          }} 
      />
    </div>
  );
}