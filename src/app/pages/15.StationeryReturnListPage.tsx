import React, { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, subDays } from 'date-fns';

import { SupplierSearchModal } from '../components/SupplierSearchModal';

const STATIONERY_SUPPLIERS = ['0800448', '0803124', '0800586', '0800618', '0800666', '0803833', '0811137', '0815165', '0817037'];

const formatDateString = (val: string) => {
  let raw = val.replace(/[^0-9]/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const DateRangeInput = ({ startVal, endVal, onStartChange, onEndChange }: any) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
        <input type="text" maxLength={10} className="h-full flex-1 border-none outline-none text-[11px] text-center px-1 w-full bg-transparent" value={startVal} onChange={(e) => onStartChange(formatDateString(e.target.value))} onFocus={(e) => e.target.select()} placeholder="YYYY-MM-DD" />
        <div className="relative w-6 h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 cursor-pointer hover:bg-gray-200 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={startVal.length === 10 ? startVal : ''} onChange={(e) => onStartChange(e.target.value)} />
        </div>
    </div>
    <span className="text-gray-500 text-[11px]">~</span>
    <div className="flex items-center h-6 w-[110px] bg-white border border-gray-300 rounded-[2px] focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
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

export default function StationeryReturnListPage() {
  // ★ products 추가 호출
  const { suppliers, products } = useMockData();

  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');
  const [searchDateStart, setSearchDateStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [searchDateEnd, setSearchDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchScanYn, setSearchScanYn] = useState('all');
  const [searchReason, setSearchReason] = useState('all');

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const [mockMasterDB, setMockMasterDB] = useState<any[]>([]);
  const [mockDetailDB, setMockDetailDB] = useState<Record<string, any[]>>({});
  
  const [masterData, setMasterData] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  // ★ 체크박스 상태 추가
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // 데이터 생성 (실제 상품 정보 매핑)
  useEffect(() => {
     if (suppliers && suppliers.length > 0 && products && products.length > 0 && mockMasterDB.length === 0) {
         const initialMaster: any[] = [];
         const initialDetail: Record<string, any[]> = {};
         
         const statSuppliers = suppliers.filter(s => STATIONERY_SUPPLIERS.includes(s.code));
         
         statSuppliers.forEach((s, idx) => {
             // ★ 해당 매입처의 실제 상품 데이터 필터링
             let sProducts = products.filter(p => p.supplierCode === s.code);
             if (sProducts.length === 0) {
                 sProducts = products.slice(0, 5); // 데이터가 부족할 경우 임의로 5개 가져옴
             }

             for(let i=0; i<3; i++) {
                 const returnId = `RT-${s.code}-${i}`;
                 const date = format(subDays(new Date(), Math.floor(Math.random() * 14)), 'yyyy-MM-dd');
                 const scan = i % 2 === 0 ? 'Y' : 'N';
                 const reasons = ['불량', '파손', '오배송', '단순변심', '기타'];
                 const reason = reasons[Math.floor(Math.random() * reasons.length)];
                 
                 // ★ 상세 데이터 생성 (단가 = 최초출고가 적용)
                 const detailRows: any[] = [];
                 let masterTotalQty = 0;
                 let masterTotalAmount = 0;

                 const numDetails = Math.floor(Math.random() * 3) + 1; // 1~3개의 상품
                 const pickedProducts = [...sProducts].sort(() => 0.5 - Math.random()).slice(0, numDetails);

                 pickedProducts.forEach((p, pIdx) => {
                     const qty = Math.floor(Math.random() * 50) + 5;
                     // 단가: 최초출고가(initialReleasePrice)를 숫자로 변환
                     const price = Number(String(p.initialReleasePrice).replace(/[^0-9]/g, '')) || 1000;
                     const amount = qty * price;
                     
                     masterTotalQty += qty;
                     masterTotalAmount += amount;

                     detailRows.push({
                         dId: `${returnId}-${pIdx}`,
                         pCode: p.productCode,
                         pName: p.productName,
                         price: price,
                         qty: qty,
                         amount: amount,
                         note: Math.random() > 0.7 ? '포장 훼손' : ''
                     });
                 });

                 initialDetail[returnId] = detailRows;

                 initialMaster.push({
                     id: returnId,
                     returnDate: date,
                     returnNo: `R${date.replace(/-/g,'')}${String(i+1).padStart(3,'0')}`,
                     supplierCode: s.code,
                     supplierName: s.name,
                     scanYn: scan,
                     returnReason: reason,
                     totalQty: masterTotalQty,
                     totalAmount: masterTotalAmount,
                 });
             }
         });
         
         initialMaster.sort((a, b) => b.returnDate.localeCompare(a.returnDate));
         setMockMasterDB(initialMaster);
         setMockDetailDB(initialDetail);
     }
  }, [suppliers, products]);

  const handleSupplierCodeSearch = () => {
    if (!searchSupplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => STATIONERY_SUPPLIERS.includes(s.code) && s.code === searchSupplierCode.trim());
    if (exactMatches.length === 1) setSearchSupplierName(exactMatches[0].name);
    else setIsSupplierModalOpen(true);
  };

  const handleSupplierNameSearch = () => {
    if (!searchSupplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const exactMatches = (suppliers || []).filter(s => STATIONERY_SUPPLIERS.includes(s.code) && s.name.includes(searchSupplierName.trim()));
    if (exactMatches.length === 1) { setSearchSupplierCode(exactMatches[0].code); setSearchSupplierName(exactMatches[0].name); }
    else setIsSupplierModalOpen(true);
  };

  const handleSearchReset = () => {
    setSearchSupplierCode('');
    setSearchSupplierName('');
    setSearchDateStart(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    setSearchDateEnd(format(new Date(), 'yyyy-MM-dd'));
    setSearchScanYn('all');
    setSearchReason('all');
    setMasterData([]);
    setDetailData([]);
    setSelectedMasterId(null);
    setCheckedIds([]); // 체크박스 초기화
  };

  const handleSearch = () => {
    const filtered = mockMasterDB.filter(item => {
        if (searchSupplierCode && item.supplierCode !== searchSupplierCode) return false;
        if (searchDateStart && item.returnDate < searchDateStart) return false;
        if (searchDateEnd && item.returnDate > searchDateEnd) return false;
        if (searchScanYn !== 'all' && item.scanYn !== searchScanYn) return false;
        if (searchReason !== 'all' && item.returnReason !== searchReason) return false;
        return true;
    });

    setMasterData(filtered);
    setCheckedIds([]); // 조회 시 체크박스 초기화
    if (filtered.length > 0) {
        handleRowClick(filtered[0]);
    } else {
        setSelectedMasterId(null);
        setDetailData([]);
    }
  };

  const handleRowClick = (row: any) => {
      setSelectedMasterId(row.id);
      setDetailData(mockDetailDB[row.id] || []);
  };

  // ★ 체크박스 핸들러
  const handleSelectAll = (checked: boolean) => {
      if (checked) setCheckedIds(masterData.map(m => m.id));
      else setCheckedIds([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setCheckedIds(prev => [...prev, id]);
      else setCheckedIds(prev => prev.filter(vid => vid !== id));
  };

  const isAllSelected = masterData.length > 0 && checkedIds.length === masterData.length;

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">문구반품리스트</h2>
      </div>

      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[120px_1fr_120px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">명세서 캔여부</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={searchScanYn} onValueChange={setSearchScanYn}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="Y">Y</SelectItem>
                        <SelectItem value="N">N</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[120px_1fr_120px_1.5fr]">
             <Label className="border-r border-gray-200" required>조회기간</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={searchDateStart} endVal={searchDateEnd} onStartChange={setSearchDateStart} onEndChange={setSearchDateEnd} />
             </div>
             
             <Label className="border-r border-gray-200">반품사유</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={searchReason} onValueChange={setSearchReason}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="불량">불량</SelectItem>
                        <SelectItem value="파손">파손</SelectItem>
                        <SelectItem value="오배송">오배송</SelectItem>
                        <SelectItem value="단순변심">단순변심</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>
      </div>
      <div className="erp-search-actions">
              <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
              <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>
      
      <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          <div className="erp-section-group min-h-0 h-[55%]">
             <div className="erp-section-toolbar">
                <span className="erp-section-title">반품 내역조회</span>
                <div className="flex gap-1">
                    <Button variant="outline" className={actionBtnClass} onClick={() => alert("라벨 출력이 요청되었습니다.")}>라벨출력</Button>
                 </div>
             </div>
             <div className="flex-1 overflow-auto relative">
                <Table className="table-fixed min-w-[1250px] border-collapse text-[11px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="h-8">
                            {/* ★ 선택 체크박스 열 추가 */}
                            <TableHead className="w-[40px] text-center border-r border-gray-300 p-1">
                                <div className="flex justify-center items-center w-full h-full">
                                    <Checkbox className="h-4 w-4 rounded-[2px]" checked={isAllSelected} onCheckedChange={(c) => handleSelectAll(!!c)} />
                                </div>
                            </TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">반품일자</TableHead>
                            <TableHead className="w-[140px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">반품번호</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처코드</TableHead>
                            <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                            <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">스캔여부</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">반품사유</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">총반품수량</TableHead>
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">총반품금액</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 p-1">명세서</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {masterData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={`empty-m-${i}`} className="h-8 border-b border-gray-200 bg-white">
                              {Array.from({ length: 10 }).map((_, j) => (
                                <TableCell key={j} className={j < 9 ? "border-r border-gray-200" : ""}></TableCell>
                              ))}
                            </TableRow>
                        ))}
                        {masterData.map((row) => {
                            const isSelected = selectedMasterId === row.id;
                            const isChecked = checkedIds.includes(row.id);
                            return (
                              <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", isSelected ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleRowClick(row)}>
                                  {/* ★ 개별 체크박스 렌더링 */}
                                  <TableCell className="text-center p-0 border-r border-gray-200">
                                      <div className="flex justify-center items-center w-full h-full" onClick={(e) => e.stopPropagation()}>
                                          <Checkbox className="h-4 w-4 rounded-[2px]" checked={isChecked} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} />
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 font-bold">{row.returnDate}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.returnNo}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.supplierCode}</TableCell>
                                  <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-2">{row.supplierName}</TableCell>
                                  <TableCell className={cn("text-center p-1 border-r border-gray-200 font-bold", row.scanYn === 'Y' ? 'text-blue-600' : 'text-red-600')}>{row.scanYn}</TableCell>
                                  <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.returnReason}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 pr-3 font-bold bg-yellow-50/30">{Number(row.totalQty).toLocaleString()}</TableCell>
                                  <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 pr-3 font-bold bg-yellow-50/30">{Number(row.totalAmount).toLocaleString()}</TableCell>
                                  
                                  {/* ★ 스캔여부가 'Y'일 때만 보기 버튼 렌더링 */}
                                  <TableCell className="text-center p-1">
                                      {row.scanYn === 'Y' && (
                                          <Button variant="outline" className="h-6 px-2 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={(e) => { e.stopPropagation(); alert(`${row.returnNo} 명세서 팝업 띄우기`); }}>보기</Button>
                                      )}
                                  </TableCell>
                              </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
             </div>
          </div>

          <div className="erp-section-group min-h-0 flex-1">
             <div className="erp-section-toolbar">
                <span className="erp-section-title">반품 상세목록</span>
             </div>
             <div className="flex-1 overflow-auto relative">
                <Table className="table-fixed w-full border-collapse text-[11px]">
                    <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                        <TableRow className="h-8">
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품코드</TableHead>
                            <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300 p-1">상품명</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">단가</TableHead>
                            <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">반품수량</TableHead>
                            <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">반품금액</TableHead>
                            <TableHead className="w-[200px] text-center font-bold text-gray-900 p-1">비고</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {detailData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={`empty-d-${i}`} className="h-8 border-b border-gray-200 bg-white">
                              {Array.from({ length: 6 }).map((_, j) => (
                                <TableCell key={j} className={j < 5 ? "border-r border-gray-200" : ""}></TableCell>
                              ))}
                            </TableRow>
                        ))}
                        {detailData.map((row) => (
                            <TableRow key={row.dId} className="h-8 hover:bg-blue-50/50 bg-white border-b border-gray-200">
                                <TableCell className="text-center p-1 border-r border-gray-200 font-medium text-gray-600">{row.pCode}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-2">{row.pName}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-3">{Number(row.price).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-blue-600 font-bold pr-3 bg-yellow-50/30">{Number(row.qty).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 font-bold pr-3 bg-yellow-50/30">{Number(row.amount).toLocaleString()}</TableCell>
                                <TableCell className="text-left p-1 text-gray-500 pl-2 truncate" title={row.note}>{row.note}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </div>
      </div>

      <SupplierSearchModal 
          isOpen={isSupplierModalOpen} 
          onClose={() => setIsSupplierModalOpen(false)} 
          initialSearchName={searchSupplierName || searchSupplierCode} 
          allowedCodes={STATIONERY_SUPPLIERS}
          onSelect={(item) => { 
              setSearchSupplierCode(item.code); 
              setSearchSupplierName(item.name); 
          }} 
      />
    </div>
  );
}