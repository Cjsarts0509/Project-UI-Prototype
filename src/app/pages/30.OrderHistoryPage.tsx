import React, { useState, useMemo } from 'react';
import { Calendar, Search, Download, Printer, CheckCircle, Copy, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format, subDays } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';
import { STORE_CODES } from './19.ProductInfoMainPage';

import * as XLSX from 'xlsx';

import { SupplierItemSearchModal } from '../components/SupplierItemSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { getProductCategory, type ProductCategoryType } from '../../utils/productCategoryUtils';

// -------------------------------------------------------------------
// 1. 헬퍼 컴포넌트
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
// 2. 데이터 타입 정의
// -------------------------------------------------------------------
type OrderMaster = {
    id: string; no: number;
    orderDate: string; orderNo: string; 
    loc: string; inLoc: string; 
    suppItemName: string; purchaseTypeCode: string; 
    supplierCode: string;
    status: '미확정' | '확정';
};

type OrderDetail = {
    id: string; masterId: string; no: number;
    suppItemName: string; itemCode: string; pCode: string; pName: string;
    pStatus: string; brand: string; label: string; artist: string;
    supplyPrice: number; retailPrice: number; 
    orderQty: number; unitStr: string; unitQty: number; 
    deliveryQty: number; deliveryNote: string;
    _touched?: boolean;
};

// -------------------------------------------------------------------
// 3. 메인 화면 컴포넌트
// -------------------------------------------------------------------
export default function OrderHistoryPage() {
  const { products, suppliers } = useMockData();

  const [sDateStart, setSDateStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [sDateEnd, setSDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sLoc, setSLoc] = useState('전체');
  const [sSuppItemCode, setSSuppItemCode] = useState('');
  const [sSuppItemName, setSSuppItemName] = useState('');

  // ★ SCM 매입처 조회 (상단 헤더)
  const [scmSupplierCode, setScmSupplierCode] = useState('');
  const [scmSupplierName, setScmSupplierName] = useState('');
  const [isScmSuppModalOpen, setIsScmSuppModalOpen] = useState(false);

  // ★ 매입처 코드 기준으로 음반/문구 자동 판별
  const scmSupplier = suppliers.find(s => s.code === scmSupplierCode);
  const scmCategory: ProductCategoryType = scmSupplier ? getProductCategory(scmSupplier.categoryCode, scmSupplierCode) : 'stationery';
  const isAlbumMode = scmCategory === 'album';

  const [masterData, setMasterData] = useState<OrderMaster[]>([]);
  const [detailData, setDetailData] = useState<OrderDetail[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  const [isSuppModalOpen, setIsSuppModalOpen] = useState(false);
  const [isSupplierSearchModalOpen, setIsSupplierSearchModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState<'직매입' | '특정매입'>('직매입');

  const selectedMaster = masterData.find(m => m.id === selectedMasterId);
  const isSpecificPurchase = selectedMaster?.purchaseTypeCode === '6';
  const isConfirmed = selectedMaster?.status === '확정';

  // 상세 데이터 자동 계산 메모이제이션
  const calculatedDetailData = useMemo(() => {
      return detailData.map(d => ({
          ...d,
          totalOrderQty: d.orderQty * d.unitQty,
          totalOrderAmt: (d.orderQty * d.unitQty) * d.supplyPrice,
          totalDeliveryQty: d.deliveryQty * d.unitQty,
          totalDeliveryAmt: (d.deliveryQty * d.unitQty) * d.supplyPrice
      }));
  }, [detailData]);

  const currentMasterTotalQty = calculatedDetailData.reduce((acc, cur) => acc + cur.totalOrderQty, 0);

  // -------------------------------------------------------------------
  // 4. 핸들러 함수
  // -------------------------------------------------------------------
  const handleSearch = () => {
      if (!scmSupplierCode) {
          alert('매입처를 먼저 조회해주세요.');
          return;
      }
      // ★ 선택된 매입처의 실제 상품 기반으로 발주 마스터 생성
      const suppProducts = products.filter(p => p.supplierCode === scmSupplierCode);
      const suppName = scmSupplierName || scmSupplierCode;
      const inLocs = ['점포(부곡리)', '인터넷(북시티)', '납품'];
      const storeNames = STORE_CODES.slice(0, 10).map(s => s.name);

      // 해당 매입처 기준 발주건 3~5건 생성
      const masterCount = Math.min(Math.max(suppProducts.length > 0 ? 3 : 1, 2), 5);
      const allMasters: OrderMaster[] = Array.from({ length: masterCount }).map((_, i) => ({
          id: `M${i + 1}`, no: i + 1,
          orderDate: format(subDays(new Date(), i * 2), 'yyyy-MM-dd'),
          orderNo: `ORD-${format(subDays(new Date(), i * 2), 'yyMMdd')}-${String(i + 1).padStart(3, '0')}`,
          loc: storeNames[i % storeNames.length], inLoc: inLocs[i % 3],
          suppItemName: suppName,
          purchaseTypeCode: scmSupplier?.purchaseType === '위탁' ? '6' : '1',
          supplierCode: scmSupplierCode,
          status: (i === 1 ? '확정' : '미확정') as '미확정' | '확정'
      }));

      // ★ 수불처(영업점코드) 조건 필터링
      const filtered = sLoc === '전체' ? allMasters : allMasters.filter(m => m.loc === sLoc);

      setMasterData(filtered);
      setDetailData([]);
      setSelectedMasterId(null);
  };

  const handleReset = () => {
      setSDateStart(format(subDays(new Date(), 7), 'yyyy-MM-dd')); setSDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setSLoc('전체'); setSSuppItemCode(''); setSSuppItemName('');
      setMasterData([]); setDetailData([]); setSelectedMasterId(null);
  };

  const handleMasterClick = (master: OrderMaster) => {
      setSelectedMasterId(master.id);
      
      const isAlbum = master.supplierCode.startsWith('01B');
      const isSpec = master.purchaseTypeCode === '6';

      // ★ 해당 매입처의 실제 상품을 필터링해서 가져옴
      const supplierProducts = products.filter(p => p.supplierCode === master.supplierCode);
      // 상품이 있으면 그중 3~5개, 없으면 전체에서 랜덤 4개
      const targetProducts = supplierProducts.length > 0
          ? [...supplierProducts].sort(() => 0.5 - Math.random()).slice(0, Math.min(supplierProducts.length, 5))
          : [...products].sort(() => 0.5 - Math.random()).slice(0, 4);

      // ★ 다채로운 발주수량 목록
      const orderQtys = [3, 7, 12, 25, 50, 8, 15, 30, 2, 20];
      // ★ 다채로운 문구 물류사용단위
      const stationeryUnits = [
          { str: 'EA/1', qty: 1 }, { str: 'BOX/10', qty: 10 }, { str: 'SET/5', qty: 5 },
          { str: 'PK/3', qty: 3 }, { str: 'BOX/12', qty: 12 }, { str: 'EA/1', qty: 1 },
          { str: 'SET/6', qty: 6 }, { str: 'BOX/24', qty: 24 }
      ];

      const details: OrderDetail[] = targetProducts.map((p, i) => {
          let unitStr = 'EA/1';
          let unitQty = 1;

          if (isAlbum) {
              // 음반은 항상 EA/1
              unitStr = 'EA/1';
              unitQty = 1;
          } else {
              // 문구는 다채롭게
              const u = stationeryUnits[i % stationeryUnits.length];
              unitStr = u.str;
              unitQty = u.qty;
          }

          const listPrice = typeof p.listPrice === 'string' ? parseInt(p.listPrice) || 0 : p.listPrice;
          const purchaseRate = typeof p.purchaseRate === 'string' ? parseFloat(p.purchaseRate) || 50 : p.purchaseRate;

          return {
              id: `D${master.id}-${i}`, masterId: master.id, no: i + 1,
              suppItemName: master.suppItemName,
              itemCode: p.orderNo && p.orderNo.trim() ? p.orderNo.trim() : (p as any).supplierItemCode || '-',
              pCode: p.productCode,
              pName: p.productName,
              pStatus: p.productStatus || '정상',
              brand: p.groupCategory || (isSpec ? '특정매입' : '직매입'),
              label: isAlbum ? (p.labelName && p.labelName !== '#' ? p.labelName : master.suppItemName.split('(')[0]) : (p.hdcName && p.hdcName !== '#' ? p.hdcName : '-'),
              artist: isAlbum ? (p.artistName && p.artistName !== '#' ? p.artistName : '-') : '',
              supplyPrice: Math.floor(listPrice * (purchaseRate / 100)),
              retailPrice: listPrice,
              orderQty: orderQtys[i % orderQtys.length],
              unitStr, unitQty,
              deliveryQty: 0,
              deliveryNote: ''
          };
      });
      setDetailData(details);
  };

  const handleDetailChange = (id: string, field: keyof OrderDetail, value: any) => {
      if (isConfirmed) return;
      setDetailData(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleBatchInput = () => {
      if (isConfirmed) return alert('이미 확정된 발주내역은 수정할 수 없습니다.');
      setDetailData(prev => prev.map(d => ({ ...d, deliveryQty: d.orderQty })));
      alert('납품수량이 발주수량과 동일하게 일괄 입력되었습니다.');
  };

  const handleConfirm = () => {
      if (!selectedMasterId) return alert('발주내역을 선택해주세요.');
      if (isConfirmed) return alert('이미 확정된 상태입니다.');
      
      setMasterData(prev => prev.map(m => m.id === selectedMasterId ? { ...m, status: '확정' } : m));
      alert('발주확정이 완료되었습니다. 이후 납품수량 및 비고는 수정할 수 없습니다.');
  };

  const openPrintModal = (type: '직매입' | '특정매입') => {
      setPrintType(type);
      setIsPrintModalOpen(true);
  };

  const handleExcelDownload = () => {
      const excelData = masterData.map(m => {
          const base: any = {
              'NO': m.no,
              '매입처품목명': m.suppItemName,
              '발주번호': m.orderNo,
              '발주일자': m.orderDate,
          };
          if (!isAlbumMode) {
              base['수불처'] = m.loc;
          }
          base['입하처'] = m.inLoc;
          base['수량'] = currentMasterTotalQty;
          base['업체확인'] = m.status;
          return base;
      });
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '발주내역');
      XLSX.writeFile(workbook, `발주내역_${isAlbumMode ? '음반영상' : '문구'}.xlsx`);
  };

  const handleDetailExcelDownload = () => {
      const excelData = calculatedDetailData.map(d => {
          const base: any = {
              'NO': d.no,
              '매입처품목명': d.suppItemName,
              '제품번호': d.itemCode,
              '상품코드': d.pCode,
              '상품명': d.pName,
              '상품상태': d.pStatus,
          };
          if (!isAlbumMode) {
              base['브랜드'] = d.brand;
          }
          if (isAlbumMode) {
              base['레이블'] = d.label;
          }
          base['출고가'] = d.supplyPrice;
          base['발주수량'] = d.orderQty;
          base['물류사용단위'] = d.unitStr;
          base['총발주수량'] = d.totalOrderQty;
          base['총발주금액'] = d.totalOrderAmt;
          base['납품수량'] = d.deliveryQty;
          base['총납품수량'] = d.totalDeliveryQty;
          base['총납품금액'] = d.totalDeliveryAmt;
          base['납품비고'] = d.deliveryNote;
          return base;
      });
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '발주상세내역');
      XLSX.writeFile(workbook, `발주상세내역_${isAlbumMode ? '음반영상' : '문구'}.xlsx`);
  };

  return (
    <div className="erp-page">
      <div className="erp-page-title">
        <h2>발주내역(문구/음반)</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 주문내역을 조회하고 발주확인을 할 수 있는 메뉴입니다.
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-gray-300 rounded-[2px] bg-white px-2 py-1">
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">매입처</span>
            <Input className="h-5 w-[70px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="코드" value={scmSupplierCode} onChange={(e) => setScmSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierCode.trim()) { const found = suppliers.find(s => s.code === scmSupplierCode.trim()); if (found) { setScmSupplierName(found.name); setMasterData([]); setDetailData([]); setSelectedMasterId(null); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Input className="h-5 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="매입처명" value={scmSupplierName} onChange={(e) => setScmSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierName.trim()) { const found = suppliers.find(s => s.name.includes(scmSupplierName.trim())); if (found) { setScmSupplierCode(found.code); setScmSupplierName(found.name); setMasterData([]); setDetailData([]); setSelectedMasterId(null); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Search className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800 flex-shrink-0" onClick={() => setIsScmSuppModalOpen(true)} />
            {scmSupplierCode && <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-[2px]", isAlbumMode ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700")}>{isAlbumMode ? '음반/영상' : '문구'}</span>}
        </div>
      </div>

      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <span className="erp-section-title">조회조건</span>
             <span className="text-gray-500 font-normal text-[11px] tracking-tight flex-1 text-right"></span>
          </div>
          <div className="border border-gray-300 bg-white">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr] border-b border-gray-300">
             <Label required>발주일자</Label>
             <div className="p-1 border-r border-gray-200 px-3 flex items-center">
                 <DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} />
             </div>
             
             <Label>수불처</Label>
             <div className="p-1 border-r border-gray-200">
                 <Select value={sLoc} onValueChange={setSLoc}>
                     <SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger>
                     <SelectContent className="max-h-[300px]">
                         <SelectItem value="전체">전체</SelectItem>
                         {STORE_CODES.map(s => (
                             <SelectItem key={s.code} value={s.name}>{s.name}</SelectItem>
                         ))}
                     </SelectContent>
                 </Select>
             </div>

             <Label>매입처품목</Label>
             <div className="flex items-center gap-1 p-1">
                 <Input className="h-6 w-[100px] text-[11px] bg-white font-bold" placeholder="매입처품목코드" value={sSuppItemCode} readOnly />
                 <Button className="h-6 w-6 p-0 bg-gray-500 hover:bg-gray-600 flex-shrink-0 border-none" onClick={() => setIsSuppModalOpen(true)}><Search className="w-3.5 h-3.5 text-white" /></Button>
                 <Input 
                     className="h-6 w-[180px] text-[11px] bg-white" 
                     value={sSuppItemName} 
                     onChange={(e) => setSSuppItemName(e.target.value)} 
                     onKeyDown={(e) => {
                         if (e.key === 'Enter' && sSuppItemName.trim() && !sSuppItemCode) {
                             setIsSupplierSearchModalOpen(true);
                         }
                     }}
                     placeholder="매입처명 입력 후 Enter" 
                 />
             </div>
          </div>
          </div>{/* close border div */}
          <div className="erp-search-actions">
             <Button className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
             <Button className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
          </div>
      </div>{/* close erp-section-group */}

      <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          {/* 마스터 영역 */}
          <div className="erp-section-group flex-1 flex flex-col min-h-[250px]">
              <div className="erp-section-toolbar">
                 <div className="flex items-center gap-2">
                     <span className="erp-section-title">발주내역</span>
                     <span className="text-gray-500 font-normal text-[11px] ml-1">
                         | ※단종상품 처리 희망시 메일요청 바랍니다. kji8598@kyobobook.co.kr (☎ 02-2076-0304)
                     </span>
                 </div>
                 <div className="flex gap-1 pr-1">
                     {/* 발주내역 출력 버튼은 하단 상세내역으로 이동됨 */}
                     <Button className="erp-btn-action" onClick={handleExcelDownload}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운로드</Button>
                 </div>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[1000px] border-collapse text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300">NO</TableHead>
                              <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목명</TableHead>
                              <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">발주번호</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">발주일자</TableHead>
                              {!isAlbumMode && <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">수불처</TableHead>}
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">입하처</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">수량</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900">업체확인</TableHead>
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
                                      <TableCell className="text-center border-r border-gray-200 font-bold text-blue-700">{row.orderNo}</TableCell>
                                      <TableCell className="text-center border-r border-gray-200">{row.orderDate}</TableCell>
                                      {!isAlbumMode && <TableCell className="text-center border-r border-gray-200">{row.loc}</TableCell>}
                                      <TableCell className="text-center border-r border-gray-200">{row.inLoc}</TableCell>
                                      <TableCell className="text-right border-r border-gray-200 pr-3 font-bold">{isSelected ? currentMasterTotalQty.toLocaleString() : '-'}</TableCell>
                                      <TableCell className="text-center">
                                          <span className={cn("px-2 py-0.5 rounded-[2px] font-bold", row.status === '확정' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>{row.status}</span>
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                          {masterData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                              <TableRow key={`empty-m-${i}`} className="h-8 border-b border-gray-200 bg-white">
                                {Array.from({ length: isAlbumMode ? 7 : 8 }).map((_, j) => (
                                  <TableCell key={j} className={j < (isAlbumMode ? 6 : 7) ? "border-r border-gray-200" : ""}></TableCell>
                                ))}
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
              </div>
          </div>

          {/* 디테일 영역 */}
          <div className="erp-section-group flex-1 flex flex-col min-h-[300px]">
              <div className="erp-section-toolbar">
                 <span className="erp-section-title">발주상세내역</span>
                 <div className="flex gap-1 pr-1">
                     <Button className="erp-btn-action" onClick={handleBatchInput} disabled={!selectedMasterId || isConfirmed}><Copy className="w-3.5 h-3.5 mr-1"/>일괄입력</Button>
                     <Button className="erp-btn-action" onClick={handleConfirm} disabled={!selectedMasterId || isConfirmed}><CheckCircle className="w-3.5 h-3.5 mr-1"/>확정</Button>
                     <div className="w-[1px] h-4 bg-gray-300 self-center mx-1"></div>
                     <Button className="erp-btn-action" onClick={handleDetailExcelDownload} disabled={!selectedMasterId || isConfirmed}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운로드</Button>
                     
                     {/* ★ 거래명세서 및 발주내역 출력 버튼 분기 */}
                     <Button className="erp-btn-action" disabled={!selectedMasterId || isSpecificPurchase} onClick={() => openPrintModal('직매입')}>
                         <Printer className="w-3.5 h-3.5 mr-1"/>거래명세서 출력
                     </Button>
                     <Button className="erp-btn-action" disabled={!selectedMasterId || !isSpecificPurchase} onClick={() => openPrintModal('특정매입')}>
                         <Printer className="w-3.5 h-3.5 mr-1"/>발주내역 출력
                     </Button>
                 </div>
              </div>
              <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
              <div className="erp-grid-wrapper flex-1">
                  <Table className="table-fixed min-w-[1800px] border-collapse text-[11px]">
                      <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                          <TableRow className="h-8">
                              <TableHead className="w-[40px] text-center font-bold text-gray-900 border-r border-gray-300">NO</TableHead>
                              <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목명</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">제품번호</TableHead>
                              <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                              <TableHead className="w-[250px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">상품상태</TableHead>
                              {!isAlbumMode && <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">브랜드</TableHead>}
                              {isAlbumMode && <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">레이블</TableHead>}
                              <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">출고가</TableHead>
                              <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">발주수량</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">물류사용단위<br/><span className="text-[9px] font-normal">(수량/단위)</span></TableHead>
                              <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 bg-blue-50">총발주수량</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-blue-50">총발주금액</TableHead>
                              <TableHead className="w-[90px] text-center font-bold text-red-600 border-r border-gray-300">납품수량</TableHead>
                              <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">총납품수량</TableHead>
                              <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">총납품금액</TableHead>
                              <TableHead className="text-center font-bold text-gray-900">납품비고</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {calculatedDetailData.map((row) => (
                              <TableRow key={row.id} className="h-8 border-b border-gray-200 bg-white hover:bg-gray-50">
                                  <TableCell className="text-center border-r border-gray-200">{row.no}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.suppItemName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold text-gray-600">{row.itemCode}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                                  <TableCell className="text-left border-r border-gray-200 truncate pl-2 font-bold" title={row.pName}>{row.pName}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.pStatus}</TableCell>
                                  {!isAlbumMode && <TableCell className="text-center border-r border-gray-200">{row.brand}</TableCell>}
                                  {isAlbumMode && <TableCell className="text-center border-r border-gray-200">{row.label}</TableCell>}
                                  <TableCell className="text-right border-r border-gray-200 pr-2">{row.supplyPrice.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold text-blue-700">{row.orderQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.unitStr}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold bg-blue-50/30">{row.totalOrderQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold bg-blue-50/30">{row.totalOrderAmt.toLocaleString()}</TableCell>
                                  
                                  <TableCell className="text-center border-r border-gray-200 p-0.5">
                                      <input 
                                          type="number" 
                                          min="0"
                                          className="w-full h-6 text-right px-2 text-[11px] border border-gray-300 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500" 
                                          value={row.deliveryQty === 0 ? '' : row.deliveryQty} 
                                          onChange={(e) => {
                                              let val = parseInt(e.target.value) || 0;
                                              if (val < 0) val = 0;
                                              handleDetailChange(row.id, 'deliveryQty', val);
                                              if (!row._touched) handleDetailChange(row.id, '_touched', true);
                                          }}
                                          onBlur={(e) => {
                                              const val = parseInt(e.target.value) || 0;
                                              const wasTouched = row._touched || val !== 0;
                                              if (!wasTouched) return;
                                              if (val > row.orderQty) {
                                                  alert(`[경고] 납품수량(${val})이 발주수량(${row.orderQty})을 초과합니다.\n납품비고에 사유를 입력해주세요.`);
                                              } else if (val === 0) {
                                                  alert(`[경고] 납품수량이 0입니다.\n납품비고에 사유를 입력해주세요.`);
                                              }
                                          }}
                                          disabled={isConfirmed}
                                      />
                                  </TableCell>
                                  
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold bg-yellow-50/50">{row.totalDeliveryQty.toLocaleString()}</TableCell>
                                  <TableCell className="text-right border-r border-gray-200 pr-2 font-bold bg-yellow-50/50 text-red-700">{row.totalDeliveryAmt.toLocaleString()}</TableCell>
                                  
                                  <TableCell className="text-center p-0.5">
                                      <input 
                                          type="text" 
                                          className="w-full h-6 px-2 text-left text-[11px] border border-gray-300 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500" 
                                          placeholder="사유 입력 (예: 단종)" 
                                          value={row.deliveryNote} 
                                          onChange={(e) => handleDetailChange(row.id, 'deliveryNote', e.target.value)}
                                          disabled={isConfirmed}
                                      />
                                  </TableCell>
                              </TableRow>
                          ))}
                          {calculatedDetailData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                              <TableRow key={`empty-d-${i}`} className="h-8 border-b border-gray-200 bg-white">
                                {Array.from({ length: 17 }).map((_, j) => (
                                  <TableCell key={j} className={j < 16 ? "border-r border-gray-200" : ""}></TableCell>
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
          isOpen={isSupplierSearchModalOpen} 
          onClose={() => setIsSupplierSearchModalOpen(false)} 
          initialSearchName={sSuppItemName} 
          onSelect={(item) => { 
              setSSuppItemCode(item.code); 
              setSSuppItemName(item.name); 
          }} 
      />

      <SupplierSearchModal
          isOpen={isScmSuppModalOpen}
          onClose={() => setIsScmSuppModalOpen(false)}
          initialSearchName=""
          excludedCodes={['0900216', '0900224', '0900252']}
          onSelect={(item) => {
              setScmSupplierCode(item.code);
              setScmSupplierName(item.name);
              setMasterData([]); setDetailData([]); setSelectedMasterId(null);
          }}
      />

      {isPrintModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6">
              <div className="bg-white w-[1100px] h-full max-h-[95vh] flex flex-col rounded-sm shadow-2xl overflow-hidden">
                  <div className="bg-[#2b2b2b] text-white flex items-center justify-between px-4 py-2.5 flex-shrink-0">
                      <span className="font-bold text-[13px]">OZ Viewer - {printType === '직매입' ? '거래명세서' : '특정매입 거래명세서'}</span>
                      <div className="flex gap-2">
                          <Button className="h-6 px-4 text-[11px] bg-white text-gray-800 hover:bg-gray-200 border border-gray-400 font-bold rounded-[2px]" onClick={() => alert('프린터로 전송합니다.')}>
                              <Printer className="w-3.5 h-3.5 mr-1"/>인쇄
                          </Button>
                          <button onClick={() => setIsPrintModalOpen(false)}><X className="w-5 h-5 text-gray-300 hover:text-white" /></button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-8 bg-[#e8e8e8] flex justify-center custom-scrollbar">
                      <div className="bg-white w-[800px] min-h-[1100px] shadow-sm border border-gray-300 p-10 font-sans text-[11px] text-black">
                          
                          <div className="flex justify-between items-end mb-6">
                              <div className="w-1/3 text-left">
                                  {printType === '직매입' && <div className="text-[14px] font-bold">거래명세서({selectedMaster?.inLoc})</div>}
                                  {printType === '특정매입' && <div className="text-[14px] font-bold mb-1">발주처 : {selectedMaster?.loc}</div>}
                                  {printType === '특정매입' && <div className="text-[14px] font-bold mb-1">발주일자 : {selectedMaster?.orderDate.replace(/-/g, '')}</div>}
                                  {printType === '특정매입' && <div className="text-[14px] font-bold mb-1">매입처 : {selectedMaster?.suppItemName.split('(')[0]}</div>}
                                  
                                  {printType === '직매입' && (
                                      <div className="mt-4 flex flex-col justify-center w-[150px]">
                                          <div className="h-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEwLDBWMTAwaDEwVjBaTTMwLDBWMTAwaDVWMFpNNTAsMFYxMDBoMTVWMFpNODAsMFYxMDBoMTBWMFpNMTA1LDBWMTAwaDVWMFpNMTE1LDBWMTAwaDIwVjBaaC0xMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=')] bg-repeat-x bg-contain" />
                                          <div className="text-center font-mono mt-1 tracking-widest text-[12px]">14287458745213</div>
                                      </div>
                                  )}
                              </div>

                              <div className="w-1/3 text-center">
                                  <h1 className="text-2xl font-bold tracking-widest underline underline-offset-8">
                                      발주내역
                                  </h1>
                              </div>

                              <div className="w-1/3 text-right">
                                  {printType === '직매입' && (
                                      <div className="flex flex-col items-end">
                                          <div className="text-[14px] font-bold mb-1">발주처 : {selectedMaster?.loc}</div>
                                          <div className="text-[14px] font-bold mb-1">발주일자 : {selectedMaster?.orderDate.replace(/-/g, '')}</div>
                                          <div className="text-[14px] font-bold mb-1">매입처 : {selectedMaster?.suppItemName.split('(')[0]}</div>
                                      </div>
                                  )}
                                  {printType === '특정매입' && (
                                      <div className="flex flex-col items-end w-[150px] ml-auto">
                                          <div className="h-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEwLDBWMTAwaDEwVjBaTTMwLDBWMTAwaDVWMFpNNTAsMFYxMDBoMTVWMFpNODAsMFYxMDBoMTBWMFpNMTA1LDBWMTAwaDVWMFpNMTE1LDBWMTAwaDIwVjBaaC0xMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=')] bg-repeat-x bg-contain" />
                                          <div className="text-center font-mono mt-1 tracking-widest text-[12px]">14287458745213</div>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="flex justify-between gap-4 mb-4">
                              <table className="w-1/2 border-collapse border border-black">
                                  <tbody>
                                      <tr>
                                          <td rowSpan={4} className="border border-black w-6 text-center bg-gray-100 font-bold leading-[1.1] text-[12px]">공<br/>급<br/>자</td>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold w-16">등록번호 :</td>
                                          <td className="border border-black px-2 py-1 font-bold">120-81-08227</td>
                                      </tr>
                                      <tr>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold">상호 :</td>
                                          <td className="border border-black px-2 py-1 font-bold">{selectedMaster?.suppItemName.split('(')[0]}</td>
                                      </tr>
                                      <tr>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold">사업장주소 :</td>
                                          <td className="border border-black px-2 py-1 tracking-tighter">경기 용인시 수지구 손곡로 17번지(동천동)</td>
                                      </tr>
                                      <tr>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold">전화번호 :</td>
                                          <td className="border border-black px-2 py-1">031-270-5421<span className="ml-4 mr-2">팩스번호 :</span></td>
                                      </tr>
                                  </tbody>
                              </table>
                              
                              <table className="w-1/2 border-collapse border border-black">
                                  <tbody>
                                      <tr>
                                          <td rowSpan={4} className="border border-black w-6 text-center bg-gray-100 font-bold leading-[1.1] text-[12px]">공<br/>급<br/>받<br/>는<br/>자</td>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold w-16">등록번호 :</td>
                                          <td className="border border-black px-2 py-1 font-bold">102-81-11670</td>
                                      </tr>
                                      <tr>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold">상호 :</td>
                                          <td className="border border-black px-2 py-1 font-bold">㈜교보문고</td>
                                      </tr>
                                      <tr>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold">사업장주소 :</td>
                                          <td className="border border-black px-2 py-0.5 tracking-tighter text-[10px] leading-tight">
                                              {printType === '직매입' ? '경기도 파주시 파주읍 윗가무을길 81-46\n교보문고 부곡리 신물류센터(문구음반파트)' : '울산광역시 남구 화합로 185 업스퀘어 B1\n교보문고 울산점'}
                                          </td>
                                      </tr>
                                      <tr>
                                          <td className="border border-black px-2 py-1 bg-gray-50 font-bold">전화번호 :</td>
                                          <td className="border border-black px-2 py-1">
                                              {printType === '직매입' ? '031-910-6151' : '052-260-9961'}
                                              <span className="ml-4 mr-2">팩스번호 :</span>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>

                          <div className="border-t-2 border-b-2 border-black py-2 mb-4 text-[11px] font-bold space-y-0.5">
                              <p>◆ 상기 양식은 교보문고의 발주서이며 거래명세서로 사용이 가능합니다.</p>
                              <p>◆ 상단에 (부곡리센터) {`->`} 부곡리센터 (북시티센터) {`->`} 북시티센터로 구분하여 출고해 주십시오.</p>
                              <p>◆ 납품시 거래명세서를 반드시 출력해서 함께 동봉 후 납품해 주시기 바랍니다.</p>
                              <p className="text-black">◆ 비고에 "고객" 표시가 있는 상품은 고객의 주문요청 수량을 포함한 발주수량입니다.</p>
                          </div>

                          <table className="w-full border-collapse border border-black text-center text-[10px]">
                              <thead className="bg-gray-100 font-bold text-[11px] border-b-2 border-black">
                                  {printType === '직매입' ? (
                                      <tr>
                                          <th className="border border-black py-1 w-8">번호</th>
                                          <th className="border border-black py-1 w-16">브랜드</th>
                                          <th className="border border-black py-1 w-16">제품번호</th>
                                          <th className="border border-black py-1">상명<br/><span className="text-[9px] font-normal">레이블 / 아티스트</span></th>
                                          <th className="border border-black py-1 w-20">상품코드<br/><span className="text-[9px] font-normal">물류사용단위</span></th>
                                          <th className="border border-black py-1 w-12">납품수량<br/><span className="text-[9px] font-normal">총납품수량</span></th>
                                          <th className="border border-black py-1 w-16">납품단가<br/><span className="text-[9px] font-normal">총납품단가</span></th>
                                          <th className="border border-black py-1 w-16">납품비고</th>
                                      </tr>
                                  ) : (
                                      <tr>
                                          <th className="border border-black py-1 w-8">번호</th>
                                          <th className="border border-black py-1 w-16">브랜드</th>
                                          <th className="border border-black py-1 w-16">제품번호</th>
                                          <th className="border border-black py-1">상품명</th>
                                          <th className="border border-black py-1 w-20">상품코드</th>
                                          <th className="border border-black py-1 w-16">판매가</th>
                                          <th className="border border-black py-1 w-12">발주수량</th>
                                          <th className="border border-black py-1 w-12">납품수량</th>
                                          <th className="border border-black py-1 w-16">비고</th>
                                      </tr>
                                  )}
                              </thead>
                              <tbody>
                                  {calculatedDetailData.map((d, i) => (
                                      <tr key={i}>
                                          {printType === '직매입' ? (
                                              <>
                                                  <td className="border border-black py-1">{d.no}</td>
                                                  <td className="border border-black py-1 truncate max-w-[60px]">{d.brand}</td>
                                                  <td className="border border-black py-1">{d.itemCode}</td>
                                                  <td className="border border-black py-1 text-left px-2 leading-tight">{d.pName}<br/><span className="text-gray-600 text-[9px]">{d.label} / {d.artist}</span></td>
                                                  <td className="border border-black py-1 leading-tight">{d.pCode}<br/><span className="text-gray-600 text-[9px]">{d.unitStr}</span></td>
                                                  <td className="border border-black py-1 leading-tight font-bold">{d.deliveryQty.toLocaleString()}<br/><span className="text-[9px] font-normal text-gray-600">{d.totalDeliveryQty.toLocaleString()}</span></td>
                                                  <td className="border border-black py-1 leading-tight text-right pr-1">{d.supplyPrice.toLocaleString()}<br/><span className="text-[9px] font-normal text-gray-600">{d.totalDeliveryAmt.toLocaleString()}</span></td>
                                                  <td className="border border-black py-1">{d.deliveryNote}</td>
                                              </>
                                          ) : (
                                              <>
                                                  <td className="border border-black py-1.5">{d.no}</td>
                                                  <td className="border border-black py-1.5 truncate max-w-[60px]">{d.brand}</td>
                                                  <td className="border border-black py-1.5">{d.itemCode}</td>
                                                  <td className="border border-black py-1.5 text-left px-2">{d.pName}</td>
                                                  <td className="border border-black py-1.5">{d.pCode}</td>
                                                  <td className="border border-black py-1.5 text-right pr-1">{d.retailPrice.toLocaleString()}</td>
                                                  <td className="border border-black py-1.5 font-bold">{d.orderQty.toLocaleString()}</td>
                                                  <td className="border border-black py-1.5 font-bold">{d.deliveryQty.toLocaleString()}</td>
                                                  <td className="border border-black py-1.5">{d.deliveryNote}</td>
                                              </>
                                          )}
                                      </tr>
                                  ))}
                                  
                                  {Array.from({ length: Math.max(0, 15 - calculatedDetailData.length) }).map((_, i) => (
                                      <tr key={`empty-${i}`} className="h-7">
                                          {Array.from({ length: printType === '직매입' ? 8 : 9 }).map((_, j) => <td key={j} className="border border-black"></td>)}
                                      </tr>
                                  ))}
                                  
                                  <tr className="bg-gray-100 font-bold border-t-2 border-black">
                                      <td colSpan={printType === '직매입' ? 5 : 6} className="border border-black py-2 text-center text-[12px]">총 계</td>
                                      {printType === '직매입' ? (
                                          <>
                                              <td className="border border-black py-2">{calculatedDetailData.reduce((acc, cur) => acc + cur.deliveryQty, 0).toLocaleString()}</td>
                                              <td colSpan={2} className="border border-black py-2"></td>
                                          </>
                                      ) : (
                                          <>
                                              <td className="border border-black py-2">{calculatedDetailData.reduce((acc, cur) => acc + cur.orderQty, 0).toLocaleString()}</td>
                                              <td className="border border-black py-2">{calculatedDetailData.reduce((acc, cur) => acc + cur.deliveryQty, 0).toLocaleString()}</td>
                                              <td className="border border-black py-2"></td>
                                          </>
                                      )}
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}