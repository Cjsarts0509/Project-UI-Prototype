import React, { useState, useRef } from 'react';
import { Search, Download, FileUp, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';

const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-blue-600 whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

// ★ 음반/영상 관련 매입처 코드 목록 (검증용)
const ALBUM_SUPPLIERS = ['01B0470', '01B0478', '01B0479', '01B0504', '01B0509', '01B0510', '01B0521'];

type InventoryData = {
    id: string;
    pCode: string;
    orderNo: string;
    pName: string;
    qty: number;
};

export default function InventoryInformationPage() {
  const { products, suppliers } = useMockData();

  // ★ SCM 매입처 조회
  const [scmSupplierCode, setScmSupplierCode] = useState('');
  const [scmSupplierName, setScmSupplierName] = useState('');
  const [isScmSuppModalOpen, setIsScmSuppModalOpen] = useState(false);

  // 1. 조회 조건 State
  const [sProdCode, setSProdCode] = useState('');
  const [sProdName, setSProdName] = useState('');
  
  // 2. 그리드 데이터 State
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryData[]>([]);

  // 3. 파일 업로드 관련 State & Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 4. 팝업 상태
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // 조회 및 초기화 핸들러
  // -------------------------------------------------------------------
  const handleSearch = () => {
      if (!scmSupplierCode) {
          alert('매입처를 먼저 조회해주세요.');
          return;
      }
      let result = [...inventoryData];
      // ★ 선택된 매입처 상품만 필터
      result = result.filter(item => {
          const prod = products.find(p => p.productCode === item.pCode);
          return prod && prod.supplierCode === scmSupplierCode;
      });
      if (sProdCode) result = result.filter(item => item.pCode.includes(sProdCode));
      if (sProdName) result = result.filter(item => item.pName.includes(sProdName));
      setFilteredData(result);
  };

  const handleReset = () => {
      setSProdCode('');
      setSProdName('');
      setInventoryData([]);
      setFilteredData([]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // -------------------------------------------------------------------
  // 엑셀 업로드/다운로드 로직
  // -------------------------------------------------------------------
  const handleDownloadTemplate = () => {
      const templateData = [
          { '상품코드': '예) 8809123456789 (숫자만)', '수량': '예) 100 (숫자만)' },
          { '상품코드': '', '수량': '' }
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "재고업로드양식");
      XLSX.writeFile(wb, `재고정보_업로드양식.xlsx`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setSelectedFile(file);
  };

  const handleSaveUpload = () => {
      if (!selectedFile) return alert('선택된 파일이 없습니다. 파일을 먼저 선택해주세요.');

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = e.target?.result;
              const wb = XLSX.read(data, { type: 'binary' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(ws);
              
              const newInventoryMap = new Map<string, number>();
              let successCount = 0;
              let failCount = 0;

              jsonData.forEach((row: any) => {
                  const pCode = String(row['상품코드'] || '').trim();
                  const qtyStr = String(row['수량'] || '').trim();
                  const qty = parseInt(qtyStr, 10);
                  
                  // 예제 행이거나 값이 없는 경우 스킵
                  if (!pCode || pCode.includes('예)') || isNaN(qty)) return;

                  // 1. 상품 마스터 검증
                  const product = products.find(p => p.productCode === pCode);
                  
                  // 2. 음반/영상 매입처 상품인지 검증
                  if (!product || !ALBUM_SUPPLIERS.includes(product.supplierCode)) {
                      failCount++;
                      return;
                  }

                  // 3. 중복 바코드 수량 합산 로직
                  const existingQty = newInventoryMap.get(pCode) || 0;
                  newInventoryMap.set(pCode, existingQty + qty);
                  successCount++;
              });

              const newInventoryList: InventoryData[] = Array.from(newInventoryMap.entries()).map(([pCode, qty]) => {
                  const p = products.find(x => x.productCode === pCode)!;
                  return {
                      id: `inv-${pCode}-${Date.now()}`,
                      pCode,
                      orderNo: p.orderNo || '-',
                      pName: p.productName,
                      qty
                  };
              });

              setInventoryData(newInventoryList);
              setFilteredData(newInventoryList); 
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
              
              alert(`[업로드 완료]\n- 반영된 데이터: ${successCount}건 (중복 합산 포함)\n- 실패 (음반상품 아님 등): ${failCount}건`);
          } catch (error) {
              console.error(error);
              alert("파일 처리 중 오류가 발생했습니다.");
          }
      };
      reader.readAsBinaryString(selectedFile);
  };

  return (
    <div className="erp-page">
      <div className="erp-page-title">
        <h2>재고정보(음반)</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 현재 재고 정보를 조회합니다.
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-gray-300 rounded-[2px] bg-white px-2 py-1">
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">매입처</span>
            <Input className="h-5 w-[70px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="코드" value={scmSupplierCode} onChange={(e) => setScmSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierCode.trim()) { const found = suppliers.find(s => s.code === scmSupplierCode.trim()); if (found) { if (found.categoryCode !== 'B') { alert('이 화면은 음반/영상 매입처만 조회 가능합니다.'); return; } setScmSupplierCode(found.code); setScmSupplierName(found.name); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Input className="h-5 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="매입처명" value={scmSupplierName} onChange={(e) => setScmSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierName.trim()) { const found = suppliers.find(s => s.name.includes(scmSupplierName.trim()) && s.categoryCode === 'B'); if (found) { setScmSupplierCode(found.code); setScmSupplierName(found.name); } else { alert('음반/영상 매입처를 찾을 수 없습니다.'); } }}} />
            <Search className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800 flex-shrink-0" onClick={() => setIsScmSuppModalOpen(true)} />
        </div>
      </div>

      {/* 1. 조회부 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
             <div className="flex items-center">
               <span className="erp-section-title">조회조건</span>
               <span className="text-gray-500 font-normal text-[11px] ml-2 tracking-tight">| 음반 재고 공유 협력사만 이용할 수 있습니다. 재고 공유 희망 협력사는 구매팀으로 연락바랍니다.</span>
             </div>
          </div>
          <div className="border border-gray-300 bg-[#fefefe]">
             <div className="grid grid-cols-[110px_1fr_110px_1fr]">
             {/* ★ 표준 상품코드/명 조회 UI 패턴 적용 */}
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center gap-1 p-1 border-r border-gray-200">
                 <Input className="h-6 w-24 text-[11px] rounded-[2px] border-gray-300 font-bold" maxLength={13} placeholder="ISBN" value={sProdCode} onChange={e => setSProdCode(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={e => { if (e.key === 'Enter') { if (!sProdCode.trim()) { setIsProdModalOpen(true); return; } const m = (products || []).filter(p => p.productCode === sProdCode.trim()); if (m.length === 1) { if (!ALBUM_SUPPLIERS.includes(m[0].supplierCode)) { alert('음반/영상 매입처의 상품만 조회 가능합니다.'); return; } setSProdName(m[0].productName); } else { setIsProdModalOpen(true); } }}} />
                 <div className="flex-1 relative flex items-center">
                     <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={sProdName} onChange={e => setSProdName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { if (!sProdName.trim()) { setIsProdModalOpen(true); return; } const m = (products || []).filter(p => String(p.productName||'').includes(sProdName.trim())); if (m.length === 1) { if (!ALBUM_SUPPLIERS.includes(m[0].supplierCode)) { alert('음반/영상 매입처의 상품만 조회 가능합니다.'); return; } setSProdCode(m[0].productCode); setSProdName(m[0].productName); } else { setIsProdModalOpen(true); } }}} />
                     <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProdModalOpen(true)} />
                 </div>
             </div>

             <Label className="border-r border-gray-200"></Label>
             <div className="p-1"></div>
             </div>
          </div>
          <div className="erp-search-actions">
             <Button variant="outline" className="erp-btn-header" onClick={handleReset}>초기화(F3)</Button>
             <Button variant="outline" className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
          </div>
      </div>

      {/* 2. 재고현황 섹션 + 자료업로드 툴바 */}
      <div className="erp-section-group">
          <div className="erp-section-toolbar">
              <span className="erp-section-title">재고현황</span>
              <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-normal text-[11px] tracking-tight">엑셀 양식을 다운로드 후 재고를 입력하여 업로드하세요.</span>
                  <div className="w-[1px] h-4 bg-gray-300 self-center mx-0.5"></div>
                  <Button variant="outline" className="erp-btn-action" onClick={handleDownloadTemplate}><Download className="w-3.5 h-3.5 mr-1"/>양식다운로드</Button>
                  
                  <Button variant="outline" className="erp-btn-action" onClick={() => fileInputRef.current?.click()}><FileUp className="w-3.5 h-3.5 mr-1"/>파일찾기</Button>
                  <Button variant="outline" className="erp-btn-action" onClick={handleSaveUpload} disabled={!selectedFile}><Save className="w-3.5 h-3.5 mr-1"/>저장</Button>
              </div>
          </div>
      </div>
      <div className="erp-section flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[800px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">제품번호</TableHead>
                          <TableHead className="w-[400px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900">재고</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredData.map((row) => (
                          <TableRow key={row.id} className="h-8 border-b border-gray-200 hover:bg-blue-50/30">
                              <TableCell className="text-center border-r border-gray-200 font-bold">{row.pCode}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.orderNo}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-3 font-bold" title={row.pName}>{row.pName}</TableCell>
                              <TableCell className="text-right pr-4 font-bold text-blue-700 bg-yellow-50/20">{row.qty.toLocaleString()}</TableCell>
                          </TableRow>
                      ))}
                      {filteredData.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 4 }).map((_, j) => (
                              <TableCell key={j} className={j < 3 ? "border-r border-gray-200" : ""}></TableCell>
                            ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />

      <ProductSearchModal 
          isOpen={isProdModalOpen} 
          onClose={() => setIsProdModalOpen(false)} 
          initialSearchName={sProdName || sProdCode} 
          onSelect={(item) => { 
              if (!ALBUM_SUPPLIERS.includes(item.supplierCode)) {
                  alert('음반/영상 매입처의 상품만 조회 및 선택이 가능합니다.');
                  return;
              }
              setSProdCode(item.productCode); 
              setSProdName(item.productName); 
          }} 
      />
      <SupplierSearchModal
          isOpen={isScmSuppModalOpen}
          onClose={() => setIsScmSuppModalOpen(false)}
          initialSearchName=""
          allowedCategoryCodes={['B']}
          onSelect={(item) => { setScmSupplierCode(item.code); setScmSupplierName(item.name); }}
      />
    </div>
  );
}