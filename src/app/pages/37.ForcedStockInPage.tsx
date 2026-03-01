import React, { useState } from 'react';
import { Search, Download, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { ProductCodeSearchField } from '../components/ProductCodeSearchField';

// -------------------------------------------------------------------
// 1. 공통 헬퍼 컴포넌트
// -------------------------------------------------------------------
const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 flex items-center justify-end text-[12px] font-bold text-[#1e3a8a] whitespace-nowrap h-full px-[20px] py-[4px] px-[12px]", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

// -------------------------------------------------------------------
// 2. 타입 정의
// -------------------------------------------------------------------
type StockHistoryData = {
    id: string;
    no: number;
    bookshelfType: string;
    bookshelfNo: string;
    productCategory: string;
    pCode: string;
    pName: string;
    pGrade: string;
    logisticsUnitQty: number;  // 물류사용단위수량 = 재고수량 / 물류사용단위
    logisticsUnit: string;     // 물류사용단위 (예: DZ, EA, BOX)
    stockQtyDisplay: string;
    stockQtyRaw: number;
    workerId: string;
    workerName: string;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function ForcedStockInPage() {
  const { products = [] } = useMockData();

  // 1. 조회 조건 State
  const [sLoc, setSLoc] = useState('050 북시티');
  const [sProdCode, setSProdCode] = useState('');
  const [sProdName, setSProdName] = useState('');
  const [sProdGrade, setSProdGrade] = useState(''); // 읽기 전용으로 표시될 상품등급

  // 1-1. 등록내역 (상품 상세 정보) State
  const [detailSupplier, setDetailSupplier] = useState('');
  const [detailSupplierItemCode, setDetailSupplierItemCode] = useState('');
  const [detailPurchaseType, setDetailPurchaseType] = useState('');
  const [detailCenterOrder, setDetailCenterOrder] = useState('');
  const [detailLogisticsUnit, setDetailLogisticsUnit] = useState('');   // 물류사용단위 (DZ, BOX, EA 등)
  const [detailLogisticsUnitVal, setDetailLogisticsUnitVal] = useState(1); // 물류사용단위 수치 (예: DZ=12)
  const [detailProductImage, setDetailProductImage] = useState('');

  // 2. 입고등록 (Form) State
  const [formInboundType] = useState('025 재입고'); // 고정값 (기획서 기준)
  const [formBookshelfNo, setFormBookshelfNo] = useState('');
  const [formLogisticsUnitQty, setFormLogisticsUnitQty] = useState(''); // 물류사용단위입고수량 (사용자 입력)
  const [formExpectedQty, setFormExpectedQty] = useState(''); // 읽기 전용 (기획서 기준)

  // ★ 입고수량 = 물류사용단위입고수량 * 물류사용단위수치 (자동계산)
  const computedInQty = formLogisticsUnitQty && detailLogisticsUnitVal
      ? Number(formLogisticsUnitQty) * detailLogisticsUnitVal
      : 0;

  // 3. 그리드 데이터 State
  const [gridData, setGridData] = useState<StockHistoryData[]>([]);

  // 4. 모달 상태
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 4. 데이터 핸들러
  // -------------------------------------------------------------------
  const handleSearch = () => {
      let targetProducts = products;
      if (sProdCode) {
          targetProducts = products.filter(p => p.productCode.includes(sProdCode));
      }

      if (targetProducts.length === 0) return alert('검색된 상품이 없습니다.');

      const sampleSize = Math.min(targetProducts.length, 5);
      const shuffled = [...targetProducts].sort(() => 0.5 - Math.random()).slice(0, sampleSize);

      const mockData: StockHistoryData[] = shuffled.map((p, i) => {
          const isAlbum = p.supplierCode?.startsWith('01B');
          const luUnit = p.logisticsUnit || 'EA';
          const luQty = p.logisticsUnitQty || 1;
          const baseQty = Math.floor(Math.random() * 5) + 1;
          
          const rawQty = isAlbum ? baseQty * 5 : baseQty * luQty;
          
          let displayQty = `${rawQty}`;
          let logisticsUnitQty = rawQty;
          let logisticsUnit = luUnit;
          if (!isAlbum && luUnit !== 'EA' && luQty > 1) {
              const unitCount = rawQty / luQty;
              displayQty = `${rawQty}EA(${unitCount}${luUnit})`;
              logisticsUnitQty = unitCount;
          } else {
              logisticsUnit = 'EA';
          }

          return {
              id: `FS-${i}`,
              no: i + 1,
              bookshelfType: '일반서가',
              bookshelfNo: `100A${i+1}`,
              productCategory: isAlbum ? '음반' : '문구',
              pCode: p.productCode,
              pName: p.productName,
              pGrade: '정상',
              logisticsUnitQty: logisticsUnitQty,
              logisticsUnit: logisticsUnit,
              stockQtyDisplay: displayQty,
              stockQtyRaw: rawQty,
              workerId: '12951',
              workerName: '권예림'
          };
      });

      setGridData(mockData);
  };

  const handleReset = () => {
      setSLoc('050 북시티');
      setSProdCode(''); setSProdName(''); setSProdGrade('');
      setDetailSupplier(''); setDetailSupplierItemCode(''); setDetailPurchaseType(''); setDetailCenterOrder(''); setDetailLogisticsUnit(''); setDetailLogisticsUnitVal(1); setDetailProductImage('');
      setFormBookshelfNo(''); setFormLogisticsUnitQty(''); setFormExpectedQty('');
      setGridData([]);
  };

  const handleRegister = () => {
      if (!sProdCode) return alert('상품을 먼저 검색 및 선택해주세요.');
      if (!formBookshelfNo || !formLogisticsUnitQty) return alert('서가번호와 입고수량을 모두 입력해주세요.');
      
      alert('일반서가 강제입고 처리가 완료되었습니다.');
      // 실제 환경에서는 여기서 저장 API 호출 후, 그리드를 갱신합니다.
      handleSearch();
  };

  const handleExcelDownload = () => {
      if (gridData.length === 0) return alert('다운로드할 데이터가 없습니다.');
      const data = gridData.map(d => ({
          'No': d.no, '서가구분': d.bookshelfType, '서가번호': d.bookshelfNo,
          '상품구분': d.productCategory, '상품코드': d.pCode, '상품명': d.pName,
          '상품등급': d.pGrade, '물류사용단위수량': d.logisticsUnitQty, '물류사용단위': d.logisticsUnit,
          '재고수량': d.stockQtyRaw,
          '작업자ID': d.workerId, '작업자': d.workerName
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "서가재고내역");
      XLSX.writeFile(wb, `서가재고내역.xlsx`);
  };

  return (
    <div className="erp-page">
      <div className="erp-page-title flex items-center">
        <h2>일반서가강제입고</h2>
      </div>

      {/* 1. 상단 조회 조건 영역 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
          </div>
          <div className="border border-gray-300 bg-white">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             
             <Label required>수불처</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={sLoc} onValueChange={setSLoc}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="050 북시티">050 북시티</SelectItem>
                         <SelectItem value="009 파주센터">009 파주센터</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <Label required>상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-r border-gray-200">
                 <ProductCodeSearchField
                   productCode={sProdCode}
                   setProductCode={setSProdCode}
                   productName={sProdName}
                   setProductName={setSProdName}
                   onSelect={(item) => {
                     setSProdGrade('정상');
                     setDetailSupplier(item.supplierName || '(주)모닝글로리');
                     setDetailSupplierItemCode(item.supplierItemCode ? `SI-${item.supplierItemCode}` : `SI-${item.productCode.slice(-6)}`);
                     setDetailPurchaseType(item.purchaseType || '직매입');
                     setDetailCenterOrder(item.centerOrderYn || 'N');
                     const luUnit = item.logisticsUnit || 'EA';
                     const luQty = item.logisticsUnitQty || 1;
                     setDetailLogisticsUnit(luUnit);
                     setDetailLogisticsUnitVal(luQty);
                     setFormLogisticsUnitQty('');
                     setDetailProductImage('https://images.unsplash.com/photo-1689790428823-7b5e0c5957b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200');
                   }}
                 />
             </div>

             <Label>상품등급</Label>
             <div className="p-1">
                 <Input className="h-6 w-[120px] text-[11px] bg-gray-100 text-center" readOnly tabIndex={-1} value={sProdGrade} />
             </div>
          </div>
          </div>{/* close border div */}
          <div className="erp-search-actions">
             <Button className="erp-btn-header w-20" onClick={handleReset}>초기화(F3)</Button>
             <Button className="erp-btn-header w-20" onClick={handleSearch}>조회(F4)</Button>
          </div>
      </div>

      {/* 1-1. 등록내역 (상품 상세 정보) 영역 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
              <span className="erp-section-title">등록내역</span>
          </div>
          <div className="border border-gray-300 bg-white">
              <div className="p-3 bg-white flex gap-6 border-b border-gray-300">
                  {/* 좌측 폼 영역 */}
                  <div className="grid grid-cols-[100px_1fr_100px_1fr] border border-gray-300 w-[700px] h-fit">
                      <Label className="border-b">상품명</Label>
                      <div className="p-1 border-b border-r border-gray-200">
                          <Input className="h-6 w-full text-[11px] bg-gray-100 font-bold" readOnly value={sProdName} />
                      </div>

                      <Label className="border-b">매입처품목</Label>
                      <div className="p-1 border-b border-gray-200">
                          <Input className="h-6 w-full text-[11px] bg-gray-100" readOnly value={detailSupplierItemCode} />
                      </div>

                      <Label className="border-b">매입처</Label>
                      <div className="p-1 border-b border-r border-gray-200">
                          <Input className="h-6 w-full text-[11px] bg-gray-100" readOnly value={detailSupplier} />
                      </div>

                      <Label className="border-b">매입구분</Label>
                      <div className="p-1 border-b border-gray-200">
                          <Input className="h-6 w-full text-[11px] bg-gray-100" readOnly value={detailPurchaseType} />
                      </div>

                      <Label>센터발주여부</Label>
                      <div className="p-1 border-r border-gray-200">
                          <Input className="h-6 w-full text-[11px] bg-gray-100" readOnly value={detailCenterOrder} />
                      </div>
                      <Label>물류사용단위</Label>
                      <div className="p-1 border-gray-200">
                          <Input className="h-6 w-full text-[11px] bg-gray-100 text-center font-bold" readOnly value={detailLogisticsUnit ? `${detailLogisticsUnit} (${detailLogisticsUnitVal})` : ''} />
                      </div>
                  </div>

                  {/* 우측 상품 이미지 영역 */}
                  <div className="flex-shrink-0 w-[180px] h-[140px] border border-gray-300 rounded-sm bg-gray-50 flex items-center justify-center overflow-hidden">
                      {detailProductImage ? (
                          <img src={detailProductImage} alt="상품 이미지" className="w-full h-full object-cover" />
                      ) : (
                          <span className="text-gray-400 text-[11px]">상품을 선택하세요</span>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* 2. 입고등록 폼 영역 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
              <span className="erp-section-title">입고등록</span>
              
              <div className="flex gap-1 pr-1 py-1">
                 <Button className="erp-btn-action" onClick={handleRegister}><CheckSquare className="w-3.5 h-3.5 mr-1"/>등록(F6)</Button>
             </div>
          </div>

          <div className="border border-gray-300 bg-white">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr_120px_1fr_120px_1fr]">
             <Label required>입고구분</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-[120px] text-[11px] bg-gray-100 text-gray-500" value={formInboundType} readOnly tabIndex={-1} />
             </div>

             <Label required>서가번호</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-[150px] text-[11px]" placeholder="입력" value={formBookshelfNo} onChange={e => setFormBookshelfNo(e.target.value)} />
             </div>

             <Label required>물류사용단위입고수량</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input type="number" className="h-6 w-[100px] text-[11px] text-right" placeholder="0" value={formLogisticsUnitQty} onChange={e => setFormLogisticsUnitQty(e.target.value)} />
             </div>

             <Label>입고수량</Label>
             <div className="p-1 border-r border-gray-200">
                 <Input className="h-6 w-[100px] text-[11px] bg-gray-100 text-right font-bold text-blue-700" readOnly tabIndex={-1} value={computedInQty > 0 ? computedInQty : ''} />
             </div>

             <Label>입고예정수량</Label>
             <div className="p-1">
                 <Input className="h-6 w-[100px] text-[11px] bg-gray-100 text-right" value={formExpectedQty} readOnly tabIndex={-1} />
             </div>
          </div>
          </div>
      </div>

      {/* 3. 하단 서가재고내역 그리드 */}
      <div className="erp-section-group flex-1 flex flex-col min-h-0">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">서가재고내역 [총 {gridData.length}건]</span>
             
             <div className="flex gap-1 pr-1">
                 <Button className="erp-btn-action" onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>Excel Down</Button>
             </div>
          </div>
          <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[1400px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300">No</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">서가구분</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">서가번호</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">상품구분</TableHead>
                          <TableHead className="w-[130px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[250px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">상품등급</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300 bg-blue-50">물류사용단위수량</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-blue-50">물류사용단위</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">재고수량</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">작업자ID</TableHead>
                          <TableHead className="text-center font-bold text-gray-900">작업자</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                              <TableCell className="text-center border-r border-gray-200">{row.no}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.bookshelfType}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold text-blue-700">{row.bookshelfNo}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.productCategory}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-3">{row.pName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.pGrade}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3 font-bold text-blue-700 bg-blue-50/30">{row.logisticsUnitQty}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 bg-blue-50/30">{row.logisticsUnit}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3 font-bold text-red-600 bg-yellow-50/30">{row.stockQtyRaw}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.workerId}</TableCell>
                              <TableCell className="text-center">{row.workerName}</TableCell>
                          </TableRow>
                      ))}

                      {gridData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
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

      <ProductSearchModal 
          isOpen={isProdModalOpen} 
          onClose={() => setIsProdModalOpen(false)} 
          initialSearchName={sProdName} 
          onSelect={(item) => { 
              setSProdCode(item.productCode); 
              setSProdName(item.productName); 
              setSProdGrade('정상');
              setDetailSupplier(item.supplierName || '(주)모닝글로리');
              setDetailSupplierItemCode(item.supplierItemCode ? `SI-${item.supplierItemCode}` : `SI-${item.productCode.slice(-6)}`);
              setDetailPurchaseType(item.purchaseType || '직매입');
              setDetailCenterOrder(item.centerOrderYn || 'N');
              const luUnit = item.logisticsUnit || 'EA';
              const luQty = item.logisticsUnitQty || 1;
              setDetailLogisticsUnit(luUnit);
              setDetailLogisticsUnitVal(luQty);
              setFormLogisticsUnitQty('');
              setDetailProductImage('https://images.unsplash.com/photo-1689790428823-7b5e0c5957b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200');
          }} 
      />
    </div>
  );
}