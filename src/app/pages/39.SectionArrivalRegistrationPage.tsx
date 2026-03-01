import React, { useState, useMemo } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';
import { MOCK_SUPPLIERS } from '../../data/mockSuppliers';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

// -------------------------------------------------------------------
// 1. 공통 헬퍼 컴포넌트
// -------------------------------------------------------------------
const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-[#1e3a8a] whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

const DateInput = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
  <div className="flex items-center h-6 w-[120px] bg-white border border-gray-300 rounded-[2px] overflow-hidden">
      <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder="YYYY-MM-DD" />
      <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
          <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={value.length === 10 ? value : ''} onChange={(e) => onChange(e.target.value)} />
      </div>
  </div>
);

// -------------------------------------------------------------------
// 2. 타입 정의
// -------------------------------------------------------------------
type OrderItemData = {
    id: string;
    no: number;
    pCode: string;
    pName: string;
    productNumber: string;        // ★ 제품번호 (음반주문번호)
    logisticsUnit: string;        // ★ 물류사용단위 (DZ, BOX 등, 없으면 'EA')
    logisticsUnitQty: number;     // ★ 물류사용단위 1단위당 EA수 (없으면 1)
    orderQtyEA: number;           // 발주수량(EA)
    orderQtyLU: number;           // 발주수량(물류단위)
    availQtyLU: number;           // 가능수량(물류단위)
    inQtyLU: number;              // 입고수량(물류단위)
    logisticsInputQty: number;    // ★ 물류사용단위수량 (사용자 입력, 문구만 편집 가능)
    arrivalQtyEA: number;         // ★ 입하량(EA) = logisticsInputQty × logisticsUnitQty
    listPriceInput: number;       // ★ 사용자 입력 정가
    purchaseRate: number;
    costPrice: number;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function SectionArrivalRegistrationPage() {
  const { suppliers = [], products = [] } = useMockData();

  // ★ 제외 조건: 해외문구 매입처, 특정매입(503) 제외
  const EXCLUDED_SUPPLIERS = ['0900216', '0900224', '0900252'];
  const validSuppliers = suppliers.filter(s => s.purchaseTypeCode !== 503 && !EXCLUDED_SUPPLIERS.includes(s.code));

  // --- 메인 화면 상태 ---
  const today = format(new Date(), 'yyyy-MM-dd');
  const [sLoc, setSLoc] = useState('009 파주센터');
  const [sArrivalDate, setSArrivalDate] = useState(today);
  const [sInvoiceIssueDate, setSInvoiceIssueDate] = useState(today);
  const [sSuppCode, setSSuppCode] = useState('');
  const [sSuppName, setSSuppName] = useState('');
  const [sReceiptNo, setSReceiptNo] = useState('00003');
  const [sInvoiceNo, setSInvoiceNo] = useState('');

  // ★ 매입처 코드/이름 입력 후 Enter → 검색 핸들러
  const handleSuppCodeSearch = () => {
      if (!sSuppCode) return;
      const found = MOCK_SUPPLIERS.find(s => s.code === sSuppCode);
      if (found) {
          setSSuppName(found.name);
      } else {
          setIsSuppModalOpen(true);
      }
  };

  const handleSuppNameSearch = () => {
      if (!sSuppName) return;
      const matches = validSuppliers.filter(s => s.name.includes(sSuppName));
      if (matches.length === 1) {
          setSSuppCode(matches[0].code);
          setSSuppName(matches[0].name);
      } else {
          setIsSuppModalOpen(true);
      }
  };

  // ★ 선택된 매입처 전체 정보
  const selectedSupplier = useMemo(() => {
      if (!sSuppCode) return null;
      return MOCK_SUPPLIERS.find(s => s.code === sSuppCode) || null;
  }, [sSuppCode]);

  // ★ 문구매입처 여부 판별 (코드가 '08'로 시작)
  const isStationerySupplier = useMemo(() => sSuppCode.startsWith('08'), [sSuppCode]);

  // 등록내역 Form 상태
  const [fProdCode, setFProdCode] = useState('');
  const [fPublisher, setFPublisher] = useState('');
  const [fListPrice, setFListPrice] = useState('');
  const [fCostPrice, setFCostPrice] = useState('');
  const [fPurchaseRate, setFPurchaseRate] = useState('');
  const [fArrivalQty, setFArrivalQty] = useState('');
  const [fOrderQty, setFOrderQty] = useState('');

  // 메인 하단 그리드 상태
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);

  // 모달 제어 상태
  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);

  // 팝업 내부 상태 (발주목록)
  const [popupOrderData, setPopupOrderData] = useState<OrderItemData[]>([]);

  // -------------------------------------------------------------------
  // 4. 핸들러
  // -------------------------------------------------------------------
  const handleOpenOrderPopup = () => {
      if (!sSuppCode) {
          alert('매입처를 먼저 선택/입력해주세요.');
          return;
      }
      
      // 선택된 매입처의 상품 정보 가져오기
      const targetProducts = products.filter(p => p.supplierCode === sSuppCode);
      
      const popupData: OrderItemData[] = targetProducts.slice(0, 10).map((p, i) => {
          const eaQty = Math.floor(Math.random() * 200) + 1;
          const luQty = p.logisticsUnitQty || 1;
          const unit = p.logisticsUnit || 'EA';
          const orderLU = unit ? Math.ceil(eaQty / luQty) : eaQty;
          return {
              id: `PO-${i}`,
              no: i + 1,
              pCode: p.productCode,
              pName: p.productName,
              productNumber: (p as any).productNumber || '',
              logisticsUnit: unit,
              logisticsUnitQty: luQty,
              orderQtyEA: unit ? orderLU * luQty : eaQty,
              orderQtyLU: orderLU,
              availQtyLU: orderLU,
              inQtyLU: orderLU,
              logisticsInputQty: 0,
              arrivalQtyEA: 0,
              listPriceInput: parseInt(String(p.listPrice)) || 0,
              purchaseRate: parseFloat(String(p.purchaseRate)) || 70,
              costPrice: Math.floor((parseInt(String(p.listPrice)) || 0) * ((parseFloat(String(p.purchaseRate)) || 70) / 100))
          };
      });

      setPopupOrderData(popupData);
      setIsOrderPopupOpen(true);
  };

  const handlePopupGridChange = (id: string, field: 'logisticsInputQty' | 'listPriceInput' | 'arrivalQtyEA', value: number) => {
      setPopupOrderData(prev => prev.map(item => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          // ★ 문구매입처: 물류사용단위입하량 입력 → 입하량(EA) 자동 계산
          if (field === 'logisticsInputQty') {
              updated.arrivalQtyEA = value * item.logisticsUnitQty;
          }
          return updated;
      }));
  };

  const handlePopupSave = () => {
      alert('발주정보 입하등록이 저장되었습니다.');
      setIsOrderPopupOpen(false);
  };

  // 팝업 하단 합계 계산
  const popupTotals = useMemo(() => {
      return popupOrderData.reduce((acc, curr) => {
          acc.orderQtyLU += curr.orderQtyLU;
          acc.availQtyLU += curr.availQtyLU;
          acc.inQtyLU += curr.inQtyLU;
          acc.logisticsInputQty += curr.logisticsInputQty;
          acc.arrivalQtyEA += curr.arrivalQtyEA;
          acc.listPriceTotal += curr.listPriceInput;
          return acc;
      }, { orderQtyLU: 0, availQtyLU: 0, inQtyLU: 0, logisticsInputQty: 0, arrivalQtyEA: 0, listPriceTotal: 0 });
  }, [popupOrderData]);

  return (
    <div className="erp-page">
      <div className="erp-page-title">
        <h2>구간입하등록</h2>
      </div>

      {/* 1. 상단 조회 조건 영역 */}
      <div className="erp-section">
          <div className="grid grid-cols-[100px_1fr_100px_1fr_120px_1fr_100px_1fr] border border-gray-300">
             
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

             <Label required>입하일자</Label>
             <div className="p-1 border-r border-gray-200 flex items-center gap-1">
                 <DateInput value={sArrivalDate} onChange={setSArrivalDate} />
                 <Checkbox className="w-4 h-4 ml-1" />
             </div>

             <Label>거래명세서발행일자</Label>
             <div className="p-1 border-r border-gray-200 flex items-center gap-1">
                 <DateInput value={sInvoiceIssueDate} onChange={setSInvoiceIssueDate} />
                 <Checkbox className="w-4 h-4 ml-1" />
             </div>

             <Label>거래명세서번호</Label>
             <div className="p-1 flex items-center gap-1">
                 <Input className="h-6 w-[150px] text-[11px] bg-white" placeholder="거래명세서번호" value={sInvoiceNo} onChange={e => setSInvoiceNo(e.target.value)} />
             </div>

             {/* 2 Row */}
             <Label required className="border-t border-gray-200">매입처</Label>
             <div className="flex items-center gap-1 p-1 border-r border-t border-gray-200 col-span-3">
                 <Input className="h-6 w-[80px] text-[11px] bg-white" placeholder="매입처코드" value={sSuppCode} onChange={e => setSSuppCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSuppCodeSearch()} />
                 <Input className="h-6 w-[120px] text-[11px] bg-white" placeholder="매입처명" value={sSuppName} onChange={e => setSSuppName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSuppNameSearch()} />
                 <Button variant="outline" className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsSuppModalOpen(true)}>
                     <Search className="w-3.5 h-3.5 text-white" />
                 </Button>
                 <Input className="h-6 w-[80px] text-[11px] bg-gray-100 text-center" placeholder="운송통관사코드" value={selectedSupplier?.customsBrokerCode !== '#' ? selectedSupplier?.customsBrokerCode || '' : ''} readOnly />
                 <Input className="h-6 w-[80px] text-[11px] bg-gray-100 text-center" placeholder="운송통관사명" value={selectedSupplier?.customsBrokerName !== '#' ? selectedSupplier?.customsBrokerName || '' : ''} readOnly />
                 <Input className="h-6 w-[100px] text-[11px] bg-gray-100 text-center" placeholder="대표명" value={selectedSupplier?.ceoName || ''} readOnly />
                 <Input className="h-6 w-[100px] text-[11px] bg-gray-100 text-center" placeholder="전화번호" value={selectedSupplier?.phoneNumber || ''} readOnly />
                 <Input className="h-6 w-[100px] text-[11px] bg-gray-100 text-center" placeholder="사업자번호" value={selectedSupplier?.businessRegistrationNumber !== '#' ? String(selectedSupplier?.businessRegistrationNumber || '') : ''} readOnly />
                 <Input className="h-6 w-[100px] text-[11px] bg-gray-100 text-center" placeholder="매입구분" value={selectedSupplier?.purchaseType || ''} readOnly />
             </div>

             <Label required className="border-t border-gray-200">인수번호</Label>
             <div className="p-1 border-t border-gray-200 col-span-3 flex justify-between items-center pr-2">
                 <Input className="h-6 w-[150px] text-[11px] bg-white" value={sReceiptNo} onChange={e => setSReceiptNo(e.target.value)} />
                 <div className="flex gap-1">
                     <Button className="erp-btn-header w-20 bg-white text-gray-700 border-gray-300">초기화(F3)</Button>
                     <Button className="erp-btn-header w-20">조회(F4)</Button>
                 </div>
             </div>
          </div>
      </div>

      {/* 2. 등록내역 폼 */}
      <div className="erp-section mt-4">
          <div className="erp-section-header justify-between">
             <div className="flex items-center gap-1.5 pl-1">
                 <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                 <span className="font-bold text-[13px] text-[#1e3a8a]">등록내역</span>
             </div>
             
             <div className="flex gap-1 pr-1 py-1">
                 <Button className="erp-btn-action bg-blue-500 hover:bg-blue-600 text-white">잡지초도</Button>
                 <Button className="erp-btn-action bg-blue-500 hover:bg-blue-600 text-white">초과입하등록</Button>
                 {/* ★ 발주정보 버튼 (팝업 오픈) */}
                 <Button className="erp-btn-action bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleOpenOrderPopup}>발주정보</Button>
                 <Button className="erp-btn-action bg-blue-500 hover:bg-blue-600 text-white">입하내역조회</Button>
                 <Button className="erp-btn-action bg-blue-500 hover:bg-blue-600 text-white">입하상세수정</Button>
                 <Button className="erp-btn-action bg-white text-red-600 border border-gray-300">삭제(F7)</Button>
                 <Button className="erp-btn-action bg-white text-gray-700 border border-gray-300">바코드출력(F5)</Button>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_100px_1fr] border border-gray-300 text-[11px]">
             {/* Row 1 */}
             <Label>상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-r border-b border-gray-200 col-span-3">
                 <Input className="h-6 w-[150px] bg-white" value={fProdCode} onChange={e => setFProdCode(e.target.value)} />
                 <Button variant="outline" className="h-6 w-6 p-0 border-gray-300"><Search className="w-3.5 h-3.5 text-gray-500" /></Button>
                 <Select><SelectTrigger className="h-6 w-[100px]"><SelectValue placeholder="-선택-" /></SelectTrigger></Select>
                 <Select><SelectTrigger className="h-6 w-[100px]"><SelectValue placeholder="-선택-" /></SelectTrigger></Select>
                 <label className="flex items-center gap-1 ml-2"><Checkbox className="w-3.5 h-3.5"/> 잡지본문</label>
             </div>
             
             <div className="col-span-4 border-b border-gray-200"></div>

             {/* Row 2 */}
             <Label>출판사</Label>
             <div className="p-1 border-r border-b border-gray-200 flex gap-1">
                 <Input className="h-6 w-[80px] bg-gray-100" readOnly />
                 <Input className="h-6 flex-1 bg-gray-100" readOnly />
             </div>
             <Label>정가/원가/매입율</Label>
             <div className="p-1 border-r border-b border-gray-200 flex gap-1 col-span-3">
                 <Input className="h-6 w-[80px] bg-gray-100 text-right" readOnly />
                 <Input className="h-6 w-[80px] bg-gray-100 text-right" readOnly />
                 <Input className="h-6 w-[60px] bg-gray-100 text-right" readOnly />
                 <Select><SelectTrigger className="h-6 w-[80px]"><SelectValue placeholder="일시" /></SelectTrigger></Select>
                 <Input className="h-6 flex-1 bg-gray-100" readOnly />
             </div>
             <div className="col-span-2 border-b border-gray-200"></div>

             {/* Row 3 */}
             <Label>상품구분</Label>
             <div className="p-1 border-r border-b border-gray-200">
                 <Select><SelectTrigger className="h-6 w-full"><SelectValue placeholder="-선택-" /></SelectTrigger></Select>
             </div>
             <Label>상품분류(조)</Label>
             <div className="p-1 border-r border-b border-gray-200">
                 <Select><SelectTrigger className="h-6 w-full"><SelectValue placeholder="-선택-" /></SelectTrigger></Select>
             </div>
             <Label>상품코드 상태</Label>
             <div className="p-1 border-r border-b border-gray-200">
                 <Select><SelectTrigger className="h-6 w-full"><SelectValue placeholder="-선택-" /></SelectTrigger></Select>
             </div>
             <Label>상품상태</Label>
             <div className="p-1 border-b border-gray-200">
                 <Select><SelectTrigger className="h-6 w-full"><SelectValue placeholder="-선택-" /></SelectTrigger></Select>
             </div>

             {/* Row 4 */}
             <Label>저자명</Label>
             <div className="p-1 border-r border-b border-gray-200 col-span-3">
                 <Input className="h-6 w-full bg-gray-100" readOnly />
             </div>
             <Label>오류도서여부</Label>
             <div className="p-1 border-b border-gray-200 col-span-3 flex items-center gap-1">
                 <Checkbox className="w-3.5 h-3.5"/>
                 <Select defaultValue="없음"><SelectTrigger className="h-6 w-[80px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="없음">없음</SelectItem></SelectContent></Select>
                 <Input className="h-6 flex-1 bg-white" />
             </div>

             {/* Row 5 */}
             <Label>회송사유구분</Label>
             <div className="p-1 border-r border-b border-gray-200">
                 <Select><SelectTrigger className="h-6 w-full"><SelectValue placeholder="-선택-" /></SelectTrigger></Select>
             </div>
             <Label>회송수량</Label>
             <div className="p-1 border-r border-b border-gray-200">
                 <Input className="h-6 w-full bg-gray-100 text-right" readOnly />
             </div>
             <Label>회송사유</Label>
             <div className="p-1 border-b border-gray-200 col-span-3 flex items-center gap-1">
                 <Input className="h-6 flex-1 bg-white" />
                 <Button className="h-6 px-4 bg-white border border-gray-300 text-gray-700 text-[11px]">저장</Button>
             </div>

             {/* Row 6 */}
             <Label>입하수량</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-[80px] bg-white text-right" />
             </div>
             <Label>발주수량</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-[80px] bg-gray-100 text-right" readOnly />
             </div>
             <div className="col-span-4 p-1 flex items-center">
                 <Button className="h-6 px-4 bg-white border border-gray-300 text-gray-700 text-[11px]">명세서라벨출력</Button>
             </div>
          </div>
      </div>

      {/* 3. 하단 그리드 영역 (합계목록 / 재고내역) */}
      <div className="flex gap-4 mt-4 h-[250px] mb-4">
          
          <div className="erp-section flex-[2] flex flex-col">
              <div className="erp-section-header">
                 <div className="flex items-center gap-1.5 pl-1">
                     <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                     <span className="font-bold text-[13px] text-[#1e3a8a]">합계목록 <span className="text-red-600 ml-1">[총 {summaryData.length} 건]</span></span>
                 </div>
                 <span className="text-[10px] text-orange-500 ml-2">※ (거래정보선택) 팝업창에서 조회된 매입구분이 실제 계약된 매입구분과 다른 경우 거래정보 선택이 불가합니다.</span>
              </div>
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[1200px] text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[40px] text-center border-r">No</TableHead>
                              <TableHead className="w-[120px] text-center border-r">출판사명</TableHead>
                              <TableHead className="w-[100px] text-center border-r">상품코드</TableHead>
                              <TableHead className="w-[150px] text-center border-r">상품명</TableHead>
                              <TableHead className="w-[70px] text-center border-r">입하수량</TableHead>
                              <TableHead className="w-[100px] text-center border-r">저자명</TableHead>
                              <TableHead className="w-[80px] text-center border-r">조코드</TableHead>
                              <TableHead className="w-[100px] text-center border-r">매입구분코드</TableHead>
                              <TableHead className="w-[80px] text-center border-r">정가</TableHead>
                              <TableHead className="w-[60px] text-center border-r">매입율</TableHead>
                              <TableHead className="w-[80px] text-center border-r">원가</TableHead>
                              <TableHead className="w-[100px] text-center border-r">입하구분코드</TableHead>
                              <TableHead className="w-[90px] text-center border-r">입하일자</TableHead>
                              <TableHead className="text-center">거래명세서일자</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {summaryData.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={14} className="h-24 text-center text-gray-500">데이터가 없음</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
              <div className="h-8 bg-[#fcf8e3] flex items-center justify-center font-bold border-t border-gray-300">0</div>
          </div>

          <div className="erp-section flex-1 flex flex-col">
              <div className="erp-section-header">
                 <div className="flex items-center gap-1.5 pl-1">
                     <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                     <span className="font-bold text-[13px] text-[#1e3a8a]">재고내역</span>
                 </div>
              </div>
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[50px] text-center border-r">No</TableHead>
                              <TableHead className="w-[150px] text-center border-r">수불처명</TableHead>
                              <TableHead className="text-center">재고수량</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {stockData.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={3} className="h-24 text-center text-gray-500">데이터가 없음</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
          </div>
      </div>

      {/* ★ 전용 매입처 모달 */}
      <SupplierSearchModal 
          isOpen={isSuppModalOpen} 
          onClose={() => setIsSuppModalOpen(false)} 
          initialSearchName={sSuppName} 
          customData={validSuppliers}
          onSelect={(item) => { setSSuppCode(item.code); setSSuppName(item.name); }} 
      />

      {/* ★ 발주정보입하등록 팝업 (슬라이드 2 구현) */}
      {isOrderPopupOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-[1200px] max-h-[90vh] flex flex-col rounded-sm shadow-2xl overflow-hidden border border-gray-400">
                  <div className="bg-[#2563eb] text-white flex items-center justify-between px-4 py-2.5 flex-shrink-0">
                      <span className="font-bold text-[14px]">발주정보입하등록</span>
                      <button onClick={() => setIsOrderPopupOpen(false)}><X className="w-5 h-5 hover:text-gray-200" /></button>
                  </div>
                  
                  <div className="p-3 flex flex-col flex-1 min-h-0 bg-[#f8f9fa]">
                      {/* ★ 조회조건 영역 */}
                      <div className="bg-white border border-gray-300 mb-3 shadow-sm p-3 flex-shrink-0">
                          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr_120px_1fr] gap-y-2 text-[11px]">
                              
                              <div className="text-right pr-3 font-bold text-red-600 self-center">* 수불처</div>
                              <div className="pr-4">
                                  <Input className="h-6 w-full bg-gray-100" readOnly value={sLoc} />
                              </div>

                              <div className="text-right pr-3 font-bold self-center">입하일자</div>
                              <div className="pr-4"><DateInput value={sArrivalDate} onChange={()=>{}} /></div>

                              <div className="text-right pr-3 font-bold self-center">인수번호</div>
                              <div className="pr-4"><Input className="h-6 w-[100px]" value={sReceiptNo} readOnly /></div>

                              <div className="text-right pr-3 font-bold self-center">거래명세서발행일자</div>
                              <div><DateInput value={sInvoiceIssueDate} onChange={()=>{}} /></div>

                              <div className="text-right pr-3 font-bold self-center">상품코드</div>
                              <div className="pr-4 flex gap-1 items-center">
                                  <Input className="h-6 flex-1" />
                                  <Button variant="outline" className="h-6 w-6 p-0 border-gray-300"><Search className="w-3.5 h-3.5 text-gray-500" /></Button>
                              </div>

                              <div className="text-right pr-3 font-bold text-red-600 self-center">* 매입처</div>
                              <div className="pr-4 flex gap-1 items-center">
                                  <Input className="h-6 w-[80px] bg-gray-100" readOnly value={sSuppCode} />
                                  <Input className="h-6 flex-1 bg-gray-100" readOnly value={sSuppName} />
                                  <Button variant="outline" className="h-6 w-6 p-0 border-gray-300"><Search className="w-3.5 h-3.5 text-gray-500" /></Button>
                                  <Input className="h-6 w-[60px] bg-gray-100" value={selectedSupplier?.customsBrokerCode !== '#' ? selectedSupplier?.customsBrokerCode || '' : ''} readOnly />
                                  <Input className="h-6 w-[60px] bg-gray-100" value={selectedSupplier?.customsBrokerName !== '#' ? selectedSupplier?.customsBrokerName || '' : ''} readOnly />
                              </div>

                              <div className="text-right pr-3 font-bold self-center">거래명세서번호</div>
                              <div className="pr-4"><Input className="h-6 w-[150px]" placeholder="거래명세서번호" value={sInvoiceNo} onChange={e => setSInvoiceNo(e.target.value)} /></div>

                              <div className="text-right pr-3 font-bold self-center">종이책상품코드</div>
                              <div><Input className="h-6 w-[120px]" /></div>
                              
                              <div className="col-span-2 flex justify-end gap-1">
                                  <Button className="h-7 px-4 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold">초기화(F3)</Button>
                                  <Button className="h-7 px-4 bg-[#1e3a8a] hover:bg-blue-800 text-white text-[11px] font-bold">조회(F4)</Button>
                              </div>
                          </div>
                      </div>

                      {/* ★ 발주목록 + 입하분배목록 */}
                      <div className="flex gap-3 flex-1 min-h-0">
                          {/* 발주목록 */}
                          <div className="flex-[2] flex flex-col bg-white border border-gray-300 shadow-sm min-h-0">
                              <div className="flex items-center justify-between p-2 border-b border-gray-300 flex-shrink-0">
                                  <div className="flex items-center gap-1.5 pl-1">
                                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                      <span className="font-bold text-[13px] text-[#1e3a8a]">발주목록 <span className="text-gray-500 ml-1 font-normal text-[11px]">[총 {popupOrderData.length} 건]</span></span>
                                  </div>
                                  <div className="flex gap-1">
                                      <Button className="h-6 px-3 bg-blue-500 hover:bg-blue-600 text-white text-[11px]">입하내역조회</Button>
                                      <Button className="h-6 px-3 bg-blue-500 hover:bg-blue-600 text-white text-[11px]">거래정보조회</Button>
                                      <Button className="h-6 px-3 bg-white border border-gray-300 text-gray-700 text-[11px]" onClick={handlePopupSave}>저장(F6)</Button>
                                  </div>
                              </div>
                              <div className="overflow-auto flex-1 custom-scrollbar min-h-0">
                                  <Table className="table-fixed min-w-[1100px] text-[11px]">
                                      <TableHeader className="bg-[#f4f4f4] sticky top-0 shadow-[0_1px_0_0_#d1d5db] z-10">
                                          <TableRow className="h-8">
                                              <TableHead className="w-[35px] text-center border-r">No</TableHead>
                                              <TableHead className="w-[95px] text-center border-r">상품코드</TableHead>
                                              <TableHead className="w-[75px] text-center border-r">제품번호</TableHead>
                                              <TableHead className="w-[140px] text-center border-r">상품명</TableHead>
                                              <TableHead className="w-[75px] text-center border-r">발주</TableHead>
                                              <TableHead className="w-[45px] text-center border-r">가능</TableHead>
                                              <TableHead className="w-[45px] text-center border-r">입고</TableHead>
                                              <TableHead className="w-[65px] text-center border-r">물류사용단위</TableHead>
                                              <TableHead className="w-[80px] text-center border-r text-red-600 font-bold">{isStationerySupplier ? '*물류사용단위입하량' : '물류사용단위입하량'}</TableHead>
                                              <TableHead className="w-[65px] text-center border-r text-red-600 font-bold">{isStationerySupplier ? '입하량' : '*입하량'}</TableHead>
                                              <TableHead className="w-[75px] text-center border-r text-red-600 font-bold">*정가</TableHead>
                                              <TableHead className="w-[50px] text-center border-r">매입율</TableHead>
                                              <TableHead className="w-[65px] text-center">원가</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {popupOrderData.map((row) => {
                                              const hasLU = row.logisticsUnit !== 'EA' && !!row.logisticsUnit;
                                              // 발주 표시: 물류단위 있으면 "24EA(2DZ)" 형식
                                              const orderDisplay = hasLU 
                                                  ? `${row.orderQtyEA}EA(${row.orderQtyLU}${row.logisticsUnit})`
                                                  : String(row.orderQtyEA);
                                              return (
                                              <TableRow key={row.id} className="h-8 border-b">
                                                  <TableCell className="text-center border-r">{row.no}</TableCell>
                                                  <TableCell className="text-center border-r font-medium text-gray-600">{row.pCode}</TableCell>
                                                  <TableCell className="text-center border-r text-gray-500">{row.productNumber || '-'}</TableCell>
                                                  <TableCell className="text-left border-r truncate pl-2" title={row.pName}>{row.pName}</TableCell>
                                                  <TableCell className="text-center border-r text-[10px] whitespace-nowrap">{orderDisplay}</TableCell>
                                                  <TableCell className="text-right border-r pr-2">{hasLU ? row.availQtyLU : row.orderQtyEA}</TableCell>
                                                  <TableCell className="text-right border-r pr-2">{hasLU ? row.inQtyLU : row.orderQtyEA}</TableCell>
                                                  <TableCell className="text-center border-r text-gray-600">{hasLU ? `${row.logisticsUnit}/${row.logisticsUnitQty}` : '-'}</TableCell>
                                                  {isStationerySupplier ? (
                                                      <TableCell className="text-center border-r p-0.5 bg-[#fffde7]">
                                                          <input type="number" className="w-full h-full text-right px-1 font-bold border-2 border-blue-400 outline-none bg-[#fffde7]" value={row.logisticsInputQty || ''} onChange={e => handlePopupGridChange(row.id, 'logisticsInputQty', parseInt(e.target.value)||0)} />
                                                      </TableCell>
                                                  ) : (
                                                      <TableCell className="text-right border-r pr-2 bg-gray-50 text-gray-400">{row.logisticsInputQty || '-'}</TableCell>
                                                  )}
                                                  {isStationerySupplier ? (
                                                      <TableCell className="text-right border-r pr-2 text-blue-700 font-bold bg-gray-50">{row.arrivalQtyEA || ''}</TableCell>
                                                  ) : (
                                                      <TableCell className="text-center border-r p-0.5 bg-[#fffde7]">
                                                          <input type="number" className="w-full h-full text-right px-1 font-bold border-2 border-blue-400 outline-none bg-[#fffde7]" value={row.arrivalQtyEA || ''} onChange={e => handlePopupGridChange(row.id, 'arrivalQtyEA', parseInt(e.target.value)||0)} />
                                                      </TableCell>
                                                  )}
                                                  <TableCell className="text-center border-r p-0.5 bg-[#fffde7]">
                                                      <input type="number" className="w-full h-full text-right px-1 font-bold border border-gray-300 outline-none focus:border-blue-400 bg-[#fffde7]" value={row.listPriceInput || ''} onChange={e => handlePopupGridChange(row.id, 'listPriceInput', parseInt(e.target.value)||0)} />
                                                  </TableCell>
                                                  <TableCell className="text-center border-r">{row.purchaseRate}</TableCell>
                                                  <TableCell className="text-right pr-2">{row.costPrice.toLocaleString()}</TableCell>
                                              </TableRow>
                                              );
                                          })}
                                      </TableBody>
                                  </Table>
                              </div>
                              <div className="h-8 bg-[#fcf8e3] flex items-center font-bold border-t border-gray-300 text-[11px] flex-shrink-0">
                                  <div className="w-[345px] text-center border-r border-gray-300">합계</div>
                                  <div className="w-[75px] text-right pr-2 border-r border-gray-300">{popupTotals.orderQtyLU}</div>
                                  <div className="w-[45px] text-right pr-2 border-r border-gray-300">{popupTotals.availQtyLU}</div>
                                  <div className="w-[45px] text-right pr-2 border-r border-gray-300">{popupTotals.inQtyLU}</div>
                                  <div className="w-[65px] text-center border-r border-gray-300"></div>
                                  <div className="w-[80px] text-right pr-2 border-r border-gray-300 text-red-600">{popupTotals.logisticsInputQty || ''}</div>
                                  <div className="w-[65px] text-right pr-2 border-r border-gray-300 text-blue-700">{popupTotals.arrivalQtyEA || ''}</div>
                                  <div className="w-[75px] text-right pr-2 border-r border-gray-300">{popupTotals.listPriceTotal.toLocaleString()}</div>
                                  <div className="flex-1"></div>
                              </div>
                          </div>

                          {/* 입하분배목록 */}
                          <div className="flex-1 flex flex-col bg-white border border-gray-300 shadow-sm min-h-0">
                              <div className="flex items-center p-2 border-b border-gray-300 h-10 flex-shrink-0">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full ml-1"></div>
                                  <span className="font-bold text-[13px] text-[#1e3a8a] ml-1.5">입하분배목록 <span className="text-gray-500 ml-1 font-normal text-[11px]">[총 0 건]</span></span>
                              </div>
                              <div className="overflow-auto flex-1 custom-scrollbar min-h-0">
                                  <Table className="table-fixed text-[11px]">
                                      <TableHeader className="bg-[#f4f4f4] sticky top-0 shadow-[0_1px_0_0_#d1d5db]">
                                          <TableRow className="h-8">
                                              <TableHead className="w-[40px] text-center border-r">No</TableHead>
                                              <TableHead className="w-[60px] text-center border-r">지시</TableHead>
                                              <TableHead className="w-[100px] text-center border-r">상대처</TableHead>
                                              <TableHead className="w-[60px] text-center border-r">가능</TableHead>
                                              <TableHead className="w-[60px] text-center border-r text-red-600 font-bold">*입하량</TableHead>
                                              <TableHead className="text-center">발주</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          <TableRow>
                                              <TableCell colSpan={6} className="h-32 text-center text-gray-500 border-b">데이터가 없음</TableCell>
                                          </TableRow>
                                      </TableBody>
                                  </Table>
                              </div>
                              <div className="h-8 bg-[#fcf8e3] flex items-center font-bold border-t border-gray-300 text-[11px] flex-shrink-0">
                                  <div className="flex-1 text-center">합계</div>
                              </div>
                          </div>
                      </div>
                      
                      {/* 닫기 버튼 */}
                      <div className="flex justify-center mt-3 flex-shrink-0">
                          <Button className="h-8 w-24 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold border border-gray-400" onClick={() => setIsOrderPopupOpen(false)}>닫기</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}