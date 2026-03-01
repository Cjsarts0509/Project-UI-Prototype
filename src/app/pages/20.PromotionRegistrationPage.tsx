import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Search, Download, FileUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

import { ProductCodeSearchField } from '../components/ProductCodeSearchField';

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
const subActionBtnClass = "erp-btn-action";

export default function PromotionRegistrationPage() {
  // ★ 상품(MDM) 정보와 매입처(Suppliers) 정보를 모두 가져옵니다.
  const { products, suppliers } = useMockData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 조회 영역 상태
  const [sPromoCode, setSPromoCode] = useState('');
  const [sPromoName, setSPromoName] = useState('');
  const [sDiscountType, setSDiscountType] = useState('전체');
  const [sProdCode, setSProdCode] = useState('');
  const [sProdName, setSProdName] = useState('');
  const [sDateStart, setSDateStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sDateEnd, setSDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 2. 마스터 데이터 (전체 저장소)
  const [allPromoList, setAllPromoList] = useState<any[]>([]); 
  const [filteredPromoList, setFilteredPromoList] = useState<any[]>([]); 
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);

  // 3. 상세 폼 상태
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pDiscountType, setPDiscountType] = useState('정율할인');
  const [pTarget, setPTarget] = useState('전체');
  const [pDateStart, setPDateStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pDateEnd, setPDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pIgnoreMargin, setPIgnoreMargin] = useState('Y');
  const [pShareRate, setPShareRate] = useState('0');
  const [pNote, setPNote] = useState('');
  const [isEditing, setIsEditing] = useState(false); 

  // 4. 상품 맵 (프로모션별 상품)
  const [promoProductsMap, setPromoProductsMap] = useState<Record<string, any[]>>({});
  const [selectedProdIds, setSelectedProdIds] = useState<string[]>([]);

  // 5. 하단 입력 폼
  const [addProdCode, setAddProdCode] = useState('');
  const [addProdName, setAddProdName] = useState('');
  const [chkRate, setChkRate] = useState(false);
  const [chkAmt, setChkAmt] = useState(false);
  const [chkPrice, setChkPrice] = useState(false);
  const [addDiscRate, setAddDiscRate] = useState('');
  const [addDiscAmt, setAddDiscAmt] = useState('');
  const [addDiscPrice, setAddDiscPrice] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // ★ 완벽하게 수정된 문구 상품 판별 로직
  // 상품(p)의 매입처코드(supplierCode)를 이용해 매입처(suppliers)를 찾고, 그 매입처의 categoryCode가 '8'인지 확인합니다.
  const isStationeryProduct = (p: any) => {
      if (!p || !p.supplierCode) return false;
      const supplierInfo = (suppliers || []).find(s => s.code === p.supplierCode);
      if (!supplierInfo) return false;
      
      return String(supplierInfo.categoryCode) === '8';
  };

  // 초기 더미 생성
  useEffect(() => {
    const initialPromos = [
        { id: '2025020100001', name: '신학기 문구 기획전', discType: '정율할인', target: '전체', start: '2025-02-01', end: '2025-12-31', share: '50', ignore: 'Y', regDate: '2025-01-15', regUser: '홍지희', note: '신학기 메인' },
        { id: '2025030100002', name: '스테디셀러 감사 할인', discType: '정액할인', target: '프렌즈', start: '2025-03-01', end: '2025-12-31', share: '30', ignore: 'N', regDate: '2025-02-20', regUser: '관리���', note: '' },
    ];
    const pMap: Record<string, any[]> = {};
    if (products && products.length > 0) {
        // 더미 생성 시에도 매입처 categoryCode === '8' 인 상품만 추출
        const stationeryProducts = products.filter(p => isStationeryProduct(p));
        
        pMap['2025020100001'] = stationeryProducts.slice(0, 3).map((p, i) => ({
            id: `p1-${i}`, pCode: p.productCode, pName: p.productName, status: p.productStatus, 
            sCode: p.supplierCode, sName: p.supplierName, 
            sItemCode: p.supplierItemCode || 'SC-001', sItemName: '매입처품목A',
            brand: p.brand || '-', listPrice: p.listPrice, rate: 20, amt: p.listPrice * 0.2, price: p.listPrice * 0.8,
            isNew: false 
        }));
    }
    setAllPromoList(initialPromos);
    setPromoProductsMap(pMap);
  }, [products, suppliers]);

  const handleSearch = () => {
      const filtered = allPromoList.filter(promo => {
          if (sPromoCode && !promo.id.includes(sPromoCode)) return false;
          if (sPromoName && !promo.name.includes(sPromoName)) return false;
          if (sDiscountType !== '전체' && promo.discType !== sDiscountType) return false;
          
          const promoStart = parseISO(promo.start);
          const promoEnd = parseISO(promo.end);
          const searchStart = parseISO(sDateStart);
          const searchEnd = parseISO(sDateEnd);
          if (promoStart > searchEnd || promoEnd < searchStart) return false;

          if (sProdCode || sProdName) {
              const currentProds = promoProductsMap[promo.id] || [];
              const hasMatchingProd = currentProds.some(p => 
                  (sProdCode && p.pCode === sProdCode) || (sProdName && p.pName.includes(sProdName))
              );
              if (!hasMatchingProd) return false;
          }
          return true;
      });

      setFilteredPromoList(filtered);
      if (filtered.length > 0) loadPromoData(filtered[0]);
      else clearPromoForm();
  };

  const handleSearchReset = () => {
      setSPromoCode(''); setSPromoName(''); setSDiscountType('전체');
      setSProdCode(''); setSProdName('');
      setSDateStart(format(new Date(), 'yyyy-MM-dd')); setSDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setFilteredPromoList([]); clearPromoForm();
  };

  const handleTopProdSearch = () => {
      if (!sProdCode.trim()) { setIsProductModalOpen(true); return; }
      const exact = (products || []).find(p => p.productCode === sProdCode.trim());
      if (exact) setSProdName(exact.productName);
      else setIsProductModalOpen(true);
  };

  const loadPromoData = (promo: any) => {
      setPCode(promo.id); setPName(promo.name); setPDiscountType(promo.discType); setPTarget(promo.target);
      setPDateStart(promo.start); setPDateEnd(promo.end); setPShareRate(promo.share);
      setPIgnoreMargin(promo.ignore); setPNote(promo.note);
      setIsEditing(true); setSelectedPromoId(promo.id); setSelectedProdIds([]);
  };

  const clearPromoForm = () => {
      setPCode(''); setPName(''); setPDiscountType('정율할인'); setPTarget('전체');
      setPDateStart(format(new Date(), 'yyyy-MM-dd')); setPDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setPIgnoreMargin('Y'); setPShareRate('0'); setPNote('');
      setIsEditing(false); setSelectedPromoId(null); setSelectedProdIds([]);
  };

  const handleSavePromo = () => {
      if (!pName) return alert('분담프로모션명을 입력해주세요.');
      if (isEditing && pCode) {
          setAllPromoList(prev => prev.map(p => p.id === pCode ? { ...p, name: pName, target: pTarget, end: pDateEnd, share: pShareRate, note: pNote } : p));
          setFilteredPromoList(prev => prev.map(p => p.id === pCode ? { ...p, name: pName, target: pTarget, end: pDateEnd, share: pShareRate, note: pNote } : p));
          alert('수정되었습니다.');
      } else {
          const newId = `${format(new Date(), 'yyyyMMdd')}${String(Math.floor(Math.random()*100000)).padStart(5,'0')}`;
          const newPromo = { id: newId, name: pName, discType: pDiscountType, target: pTarget, start: pDateStart, end: pDateEnd, share: pShareRate, ignore: pIgnoreMargin, regDate: format(new Date(), 'yyyy-MM-dd'), regUser: '관리자', note: pNote };
          setAllPromoList([newPromo, ...allPromoList]);
          setFilteredPromoList([newPromo, ...filteredPromoList]);
          setPromoProductsMap(prev => ({ ...prev, [newId]: [] }));
          loadPromoData(newPromo);
          alert(`새 프로모션 생성됨: ${newId}`);
      }
  };

  const handleMasterDelete = () => {
      if (selectedMasterIds.length === 0) return alert('삭제할 프로모션을 선택하세요.');
      if (confirm('선택된 분담프로모션 정보를 삭제하시겠습니까?\n하위 상품 정보도 모두 삭제됩니다.')) {
          setAllPromoList(prev => prev.filter(p => !selectedMasterIds.includes(p.id)));
          setFilteredPromoList(prev => prev.filter(p => !selectedMasterIds.includes(p.id)));
          if (selectedPromoId && selectedMasterIds.includes(selectedPromoId)) clearPromoForm();
          setSelectedMasterIds([]);
      }
  };

  const handleMasterExcel = () => {
      const targetList = filteredPromoList.length > 0 ? filteredPromoList : allPromoList;
      if (targetList.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const ws = XLSX.utils.json_to_sheet(targetList);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PromoList");
      XLSX.writeFile(wb, "분담프로모션_마스터목록.xlsx");
  };

  // ★ 하단 개별 상품 추가 제어 로직 (categoryCode 기준)
  const handleAddProdSearch = () => {
      if (!selectedPromoId) return alert('프로모션을 먼저 선택하세요.');
      if (!addProdCode) return;
      const match = (products || []).find(p => p.productCode === addProdCode);
      
      if (match) {
          // 해당 상품의 매입처 categoryCode === 8 검증
          if (!isStationeryProduct(match)) {
              return alert('매입처구분코드가 [8]인 매입처의 상품(문구)만 등록 가능합니다.');
          }

          const currentList = promoProductsMap[selectedPromoId] || [];
          if (currentList.find(p => p.pCode === match.productCode)) return alert('이미 등록된 상품입니다.');
          
          if (currentList.length > 0 && currentList[0].sCode !== match.supplierCode) {
              return alert('동일 매입처 상품만 등록 가능합니다.');
          }

          const newItem = {
              id: `p-${Date.now()}`, pCode: match.productCode, pName: match.productName, status: match.productStatus,
              sCode: match.supplierCode, sName: match.supplierName, 
              sItemCode: match.supplierItemCode || 'SC-ITEM', 
              sItemName: match.supplierItemCodeName || '매입품목명', 
              brand: match.brand || '-', listPrice: match.listPrice, rate: 0, amt: 0, price: match.listPrice,
              isNew: true 
          };
          setPromoProductsMap(prev => ({ ...prev, [selectedPromoId]: [...currentList, newItem] }));
          setAddProdCode(''); setAddProdName('');
      } else {
          alert('해당 상품을 찾을 수 없습니다.');
          setAddProdCode('');
      }
  };

  // ★ 엑셀 파일 다건 등록 로직 (순차적 4단계 검증 및 categoryCode 반영)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedPromoId) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              
              const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

              if (!data || data.length === 0) return alert('파일 내 데이터가 없습니다.');

              const currentList = promoProductsMap[selectedPromoId] || [];
              let baseSupplierCode = currentList.length > 0 ? currentList[0].sCode : null;

              let successCount = 0;
              let notFoundCount = 0;
              let duplicatedCount = 0;
              let notStationeryCount = 0;
              let supplierMismatchCount = 0;
              
              const newItems: any[] = [];

              data.forEach((row, idx) => {
                  if (!row || !Array.isArray(row) || row.length === 0) return;

                  let pCodeFromExcel = '';
                  for (let cell of row) {
                      const strCell = String(cell || '').replace(/[^0-9]/g, '');
                      if (strCell.length >= 10 && strCell.length <= 13) {
                          pCodeFromExcel = strCell;
                          break;
                      }
                  }
                  
                  if (!pCodeFromExcel) return;

                  // 단계 1: MDM 존재유무 확인
                  const match = (products || []).find(p => p.productCode === pCodeFromExcel);
                  if (!match) { notFoundCount++; return; } 

                  // 단계 2: 매입처의 categoryCode가 8인지 (문구상품) 확인
                  if (!isStationeryProduct(match)) { notStationeryCount++; return; }

                  // 단계 3: 내역에 있는 상품과 같은 매입처인지 확인
                  if (!baseSupplierCode) {
                      baseSupplierCode = match.supplierCode; 
                  } else if (baseSupplierCode !== match.supplierCode) {
                      supplierMismatchCount++; return; 
                  }

                  // 단계 4: 상품코드 중복 확인
                  if (currentList.some(p => p.pCode === match.productCode) || newItems.some(p => p.pCode === match.productCode)) {
                      duplicatedCount++; return;
                  }

                  // 모든 검증 통과
                  newItems.push({
                      id: `p-excel-${Date.now()}-${idx}`, pCode: match.productCode, pName: match.productName, status: match.productStatus,
                      sCode: match.supplierCode, sName: match.supplierName, 
                      sItemCode: match.supplierItemCode || 'SC-ITEM', 
                      sItemName: match.supplierItemCodeName || '매입품목명', 
                      brand: match.brand || '-', listPrice: match.listPrice, rate: 0, amt: 0, price: match.listPrice,
                      isNew: true 
                  });
                  successCount++;
              });

              if (newItems.length > 0) {
                  setPromoProductsMap(prev => ({ ...prev, [selectedPromoId]: [...currentList, ...newItems] }));
              }

              alert(`[파일업로드 처리 결과]\n- 성공: ${successCount}건 추가됨\n- 실패(매입처구분 8 아님): ${notStationeryCount}건 스킵\n- 실패(매입처 불일치): ${supplierMismatchCount}건 스킵\n- 실패(MDM 미존재): ${notFoundCount}건 스킵\n- 실패(중복): ${duplicatedCount}건 스킵`);
          } catch (error) {
              alert('엑셀 파일을 읽는 중 오류가 발생했습니다. 양식을 확인해주세요.');
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsBinaryString(file);
  };

  const handleGridProdChange = (id: string, field: string, val: string) => {
      if (!selectedPromoId) return;
      const numVal = Number(val.replace(/[^0-9]/g, '')) || 0;
      setPromoProductsMap(prev => ({
          ...prev,
          [selectedPromoId]: (prev[selectedPromoId] || []).map(p => {
              if (p.id === id) {
                  let r = p.rate, a = p.amt, pr = p.price;
                  if (field === 'rate') { r = numVal; pr = Math.round(p.listPrice * (1 - r/100)); a = p.listPrice - pr; }
                  else if (field === 'amt') { a = numVal; pr = p.listPrice - a; r = Math.round((1 - pr/p.listPrice)*100); }
                  else if (field === 'price') { pr = numVal; a = p.listPrice - pr; r = Math.round((1 - pr/p.listPrice)*100); }
                  return { ...p, rate: r, amt: a, price: pr };
              }
              return p;
          })
      }));
  };

  const handleApplyToGrid = () => {
      if (!selectedPromoId || selectedProdIds.length === 0) return alert('그리드에서 상품을 선택하세요.');
      const updated = (promoProductsMap[selectedPromoId] || []).map(p => {
          if (selectedProdIds.includes(p.id)) {
              let r = p.rate, a = p.amt, pr = p.price;
              if (chkRate && pDiscountType === '정율할인') { r = Number(addDiscRate); pr = Math.round(p.listPrice * (1 - r/100)); a = p.listPrice - pr; }
              if (chkAmt && pDiscountType === '정액할인') { a = Number(addDiscAmt); pr = p.listPrice - a; r = Math.round((1 - pr/p.listPrice)*100); }
              if (chkPrice && pDiscountType === '균일가') { pr = Number(addDiscPrice); a = p.listPrice - pr; r = Math.round((1 - pr/p.listPrice)*100); }
              return { ...p, rate: r, amt: a, price: pr };
          }
          return p;
      });
      setPromoProductsMap(prev => ({ ...prev, [selectedPromoId]: updated }));
  };

  const handleDetailSave = () => {
      if (!selectedPromoId) return;
      setPromoProductsMap(prev => ({
          ...prev,
          [selectedPromoId]: (prev[selectedPromoId] || []).map(p => ({...p, isNew: false}))
      }));
      alert('상품 내역이 저장되었습니다.');
  };

  const handleDetailReset = () => {
      if (!selectedPromoId) return;
      setPromoProductsMap(prev => ({
          ...prev,
          [selectedPromoId]: (prev[selectedPromoId] || []).filter(p => !p.isNew)
      }));
      setAddProdCode(''); setAddProdName('');
      setAddDiscRate(''); setAddDiscAmt(''); setAddDiscPrice('');
  };

  const handleDetailExcelDownload = () => {
      const currentProducts = selectedPromoId ? (promoProductsMap[selectedPromoId] || []) : [];
      if (currentProducts.length === 0) return alert("다운로드할 데이터가 없습니다.");
      const exportData = currentProducts.map(r => ({
          '상품코드': r.pCode, '상품명': r.pName, '상품상태': r.status, 
          '매입처코드': r.sCode, '매입처명': r.sName, '매입처품목코드': r.sItemCode, '매입처품목명': r.sItemName,
          '브랜드': r.brand, '정가': r.listPrice, '할인율(%)': r.rate, 
          '할인금액': r.amt, '할인판매가': r.price
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "분담프로모션상품");
      XLSX.writeFile(wb, "분담프로모션_상품목록.xlsx");
  };

  const isMasterAllSelected = filteredPromoList.length > 0 && selectedMasterIds.length === filteredPromoList.length;
  const handleMasterSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedMasterIds(prev => [...prev, id]);
      else setSelectedMasterIds(prev => prev.filter(i => i !== id));
  };

  const currentProducts = selectedPromoId ? (promoProductsMap[selectedPromoId] || []) : [];
  const isProdAllSelected = currentProducts.length > 0 && selectedProdIds.length === currentProducts.length;

  const handleProdSelectAll = (checked: boolean) => {
      if (checked) setSelectedProdIds(currentProducts.map(item => item.id));
      else setSelectedProdIds([]);
  };

  const handleProdSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedProdIds(prev => [...prev, id]);
      else setSelectedProdIds(prev => prev.filter(i => i !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-4">
      {/* 1. 조회 영역 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">분담프로모션등록</h2>
      </div>

      <div className="erp-search-area">
      <div className="flex flex-col border border-gray-300 bg-[#fefefe] flex-shrink-0">
           <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">분담프로모션코드</Label>
             <div className="p-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px]" maxLength={13} value={sPromoCode} onChange={e => setSPromoCode(e.target.value.replace(/[^0-9]/g, ''))} /></div>
             <Label className="border-r border-gray-200">분담프로모션명</Label>
             <div className="p-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px]" value={sPromoName} onChange={e => setSPromoName(e.target.value)} /></div>
             <Label className="border-r border-gray-200">할인종류</Label>
             <div className="p-1"><Select value={sDiscountType} onValueChange={setSDiscountType}><SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="전체">전체</SelectItem><SelectItem value="정율할인">정율할인</SelectItem><SelectItem value="정액할인">정액할인</SelectItem><SelectItem value="균일가">균일가</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <ProductCodeSearchField
                   productCode={sProdCode}
                   setProductCode={setSProdCode}
                   productName={sProdName}
                   setProductName={setSProdName}
                 />
             </div>
             <Label className="border-r border-gray-200" required>행사기간</Label>
             <div className="p-1 border-r border-gray-200 px-3"><DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} /></div>
             <div className="col-span-2 bg-white"></div>
           </div>
       </div>
       <div className="erp-search-actions">
                  <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
                  <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
       </div>
       </div>

      {/* 2. 분담프로모션정보 (상세 폼) */}
      <div className="erp-section-group flex-shrink-0">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">분담프로모션정보</span>
          <div className="flex gap-1.5 pr-1">
              <Button variant="outline" className={subActionBtnClass} onClick={clearPromoForm}>초기화</Button>
              <Button className="erp-btn-action" onClick={handleSavePromo}>저장</Button>
          </div>
       </div>
       <div className="border border-gray-300 bg-[#fefefe]">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr] border-b border-gray-200">
              <Label className="border-r border-gray-200">분담프로모션코드</Label>
              <div className="p-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-100 font-bold" value={pCode} readOnly placeholder="숫자 13자리 자동채번" /></div>
              <Label className="border-r border-gray-200" required>분담프로모션명</Label>
              <div className="p-1 border-r border-gray-200 col-span-3"><Input className="h-6 w-full text-[11px] border-blue-400 font-bold" value={pName} onChange={e => setPName(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr] border-b border-gray-200">
              <Label className="border-r border-gray-200" required>할인종류</Label>
              <div className="p-1 border-r border-gray-200"><Select value={pDiscountType} onValueChange={setPDiscountType} disabled={isEditing}><SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="정율할인">정율할인</SelectItem><SelectItem value="정액할인">정액할인</SelectItem><SelectItem value="균일가">균일가</SelectItem></SelectContent></Select></div>
              <Label className="border-r border-gray-200" required>업체분담율(%)</Label>
              <div className="p-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] text-right" value={pShareRate} onChange={e => setPShareRate(e.target.value.replace(/[^0-9]/g, ''))} /></div>
              <Label className="border-r border-gray-200" required>대상고객</Label>
              <div className="p-1"><Select value={pTarget} onValueChange={setPTarget}><SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger><SelectContent>{['전체','비회원','회원전체','프렌즈','실버','골드','플레티늄'].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr]">
              <Label className="border-r border-gray-200" required>행사기간</Label>
              <div className="p-1 border-r border-gray-200 px-3"><DateRangeInput startVal={pDateStart} endVal={pDateEnd} onStartChange={setPDateStart} onEndChange={setPDateEnd} /></div>
              <Label className="border-r border-gray-200" required>최소마진율 무시</Label>
              <div className="p-1 border-r border-gray-200"><Select value={pIgnoreMargin} onValueChange={setPIgnoreMargin} disabled={isEditing}><SelectTrigger className="h-6 w-full text-[11px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent></Select></div>
              <Label className="border-r border-gray-200">비고</Label>
              <div className="p-1"><Input className="h-6 w-full text-[11px]" value={pNote} onChange={e => setPNote(e.target.value)} /></div>
          </div>
       </div>
      </div>

      {/* 3. 목록 그리드 (마스터) */}
      <div className="erp-section-group">
       <div className="erp-section-toolbar">
          <span className="erp-section-title">분담프로모션정보 조회영역</span>
          <div className="flex gap-1.5 pr-1">
              <Button variant="outline" className={subActionBtnClass} onClick={handleMasterExcel}>엑셀다운</Button>
              <Button className="erp-btn-action" onClick={handleMasterDelete}>삭제</Button>
          </div>
       </div>
       <div className="h-[200px] border border-gray-300 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
             <Table className="table-fixed min-w-[1400px] border-collapse text-[11px]">
                 <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                     <TableRow className="h-8">
                         <TableHead className="w-[40px] text-center border-r border-gray-300"><Checkbox className="h-4 w-4" checked={isMasterAllSelected} onCheckedChange={c => { if(c) setSelectedMasterIds(filteredPromoList.map(p=>p.id)); else setSelectedMasterIds([]); }} /></TableHead>
                         <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300">분담프로모션코드</TableHead>
                         <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300">분담프로모션명</TableHead>
                         <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">할인종류</TableHead>
                         <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300">분담율</TableHead>
                         <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">대상고객</TableHead>
                         <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">시작일</TableHead>
                         <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">종료일</TableHead>
                         <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">등록자</TableHead>
                         <TableHead className="text-center font-bold text-gray-900">비고</TableHead>
                     </TableRow>
                 </TableHeader>
                 <TableBody>
                     {filteredPromoList.map((row) => (
                         <TableRow key={row.id} className={cn("h-7 cursor-pointer border-b border-gray-200", selectedPromoId === row.id ? "bg-blue-100" : "hover:bg-blue-50 bg-white")} onClick={() => loadPromoData(row)}>
                             <TableCell className="text-center border-r border-gray-200" onClick={e => e.stopPropagation()}><Checkbox className="h-4 w-4" checked={selectedMasterIds.includes(row.id)} onCheckedChange={c => handleMasterSelectRow(row.id, !!c)} /></TableCell>
                             <TableCell className="text-center border-r border-gray-200 font-bold">{row.id}</TableCell>
                             <TableCell className="text-left border-r border-gray-200 truncate pl-2">{row.name}</TableCell>
                             <TableCell className="text-center border-r border-gray-200 font-bold text-blue-700">{row.discType}</TableCell>
                             <TableCell className="text-right border-r border-gray-200 pr-2">{row.share}%</TableCell>
                             <TableCell className="text-center border-r border-gray-200">{row.target}</TableCell>
                             <TableCell className="text-center border-r border-gray-200">{row.start}</TableCell>
                             <TableCell className="text-center border-r border-gray-200">{row.end}</TableCell>
                             <TableCell className="text-center border-r border-gray-200 text-gray-600">{row.regUser}</TableCell>
                             <TableCell className="text-left truncate pl-2 text-gray-600 font-medium">{row.note}</TableCell>
                         </TableRow>
                     ))}
                     {filteredPromoList.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-m-${i}`} className="h-7 border-b border-gray-200 bg-white">
                            {Array.from({ length: 10 }).map((_, j) => (
                              <TableCell key={j} className={j < 9 ? "border-r border-gray-200" : ""}></TableCell>
                            ))}
                          </TableRow>
                      ))}
                 </TableBody>
             </Table>
          </div>
       </div>
      </div>

      {/* 4. 분담프로모션상품정보 영역 */}
      <div className={cn("flex flex-col flex-1 border border-gray-300 bg-[#fefefe] transition-opacity", !selectedPromoId && "opacity-50 pointer-events-none")}>
          <div className="flex items-center p-1.5 border-b border-gray-300 bg-blue-50/50 gap-2">
             <div className="erp-section-title px-2 w-[160px]">분담프로모션상품정보</div>
             <div className="flex items-center gap-1 border border-gray-300 bg-white p-0.5 rounded-[2px] shadow-inner">
                 <Input className="h-6 w-28 text-[11px] border-none font-bold placeholder:font-normal" placeholder="상품코드 + Enter" value={addProdCode} onChange={e=>setAddProdCode(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={e=>e.key==='Enter' && handleAddProdSearch()} />
                 <Input className="h-6 w-48 text-[11px] border-none bg-gray-50 text-gray-800 font-medium" placeholder="상품명 자동조회" value={addProdName} readOnly />
             </div>
             
             <div className="flex items-center gap-1 border border-gray-300 bg-white px-2 py-0.5 rounded-[2px]">
                 <Checkbox className="h-3.5 w-3.5" checked={chkRate} onCheckedChange={c=>setChkRate(!!c)} disabled={pDiscountType!=='정율할인'} />
                 <span className={cn("text-[11px] font-bold w-16 text-right", pDiscountType === '정율할인' ? "text-blue-700" : "text-gray-400")}>할인율(%)</span>
                 <Input className="h-6 w-12 text-[11px] text-right font-bold text-blue-600 bg-transparent border-none focus-visible:ring-0" maxLength={3} value={addDiscRate} onChange={e=>setAddDiscRate(e.target.value.replace(/[^0-9]/g, ''))} disabled={pDiscountType!=='정율할인' || !chkRate} />
             </div>
             <div className="flex items-center gap-1 border border-gray-300 bg-white px-2 py-0.5 rounded-[2px]">
                 <Checkbox className="h-3.5 w-3.5" checked={chkAmt} onCheckedChange={c=>setChkAmt(!!c)} disabled={pDiscountType!=='정액할인'} />
                 <span className={cn("text-[11px] font-bold w-14 text-right", pDiscountType === '정액할인' ? "text-blue-700" : "text-gray-400")}>할인금액</span>
                 <Input className="h-6 w-20 text-[11px] text-right font-bold text-blue-600 bg-transparent border-none focus-visible:ring-0" maxLength={10} value={addDiscAmt} onChange={e=>setAddDiscAmt(e.target.value.replace(/[^0-9]/g, ''))} disabled={pDiscountType!=='정액할인' || !chkAmt} />
             </div>
             <div className="flex items-center gap-1 border border-gray-300 bg-white px-2 py-0.5 rounded-[2px]">
                 <Checkbox className="h-3.5 w-3.5" checked={chkPrice} onCheckedChange={c=>setChkPrice(!!c)} disabled={pDiscountType!=='균일가'} />
                 <span className={cn("text-[11px] font-bold w-16 text-right", pDiscountType === '균일가' ? "text-blue-700" : "text-gray-400")}>할인판매가</span>
                 <Input className="h-6 w-20 text-[11px] text-right font-bold text-blue-700 bg-transparent border-none focus-visible:ring-0" maxLength={10} value={addDiscPrice} onChange={e=>setAddDiscPrice(e.target.value.replace(/[^0-9]/g, ''))} disabled={pDiscountType!=='균일가' || !chkPrice} />
             </div>
             <Button className="erp-btn-action" onClick={handleApplyToGrid}>일괄적용</Button>
             
             <div className="flex gap-1.5 ml-auto pr-1">
                 <div className="relative">
                     <Button variant="outline" className={subActionBtnClass} onClick={() => fileInputRef.current?.click()}><FileUp className="w-3 h-3 mr-1"/> 파일등록</Button>
                     <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" />
                 </div>
                 <Button variant="outline" className={subActionBtnClass} onClick={handleDetailReset}>초기화</Button>
                 <Button variant="outline" className={subActionBtnClass} onClick={handleDetailExcelDownload}>엑셀다운</Button>
                 <Button variant="outline" className="erp-btn-action" onClick={() => { if(selectedProdIds.length===0) return alert('삭제할 상품을 선택하세요.'); setPromoProductsMap({...promoProductsMap, [selectedPromoId!]: currentProducts.filter(p=>!selectedProdIds.includes(p.id))}); setSelectedProdIds([]); }}>삭제</Button>
                 <Button className="erp-btn-action" onClick={handleDetailSave}>저장</Button>
             </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
              <Table className="table-fixed min-w-[1700px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[40px] text-center border-r border-gray-300"><Checkbox className="h-4 w-4" checked={isProdAllSelected} onCheckedChange={(c) => handleProdSelectAll(!!c)} /></TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">상품코드</TableHead>
                          <TableHead className="w-[200px] text-center font-bold text-gray-900 border-r border-gray-300">상품명</TableHead>
                          <TableHead className="w-[70px] text-center font-bold text-gray-900 border-r border-gray-300">상태</TableHead>
                          <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">매입처코드</TableHead>
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">매입처명</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목코드</TableHead>
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">매입처품목명</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">브랜드</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">정가</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">할인율(%)</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 bg-yellow-50">할인금액</TableHead>
                          <TableHead className="w-[110px] text-center font-bold text-gray-900 bg-yellow-50 text-blue-700">할인판매가</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {currentProducts.map((p) => (
                          <TableRow key={p.id} className={cn("h-8 border-b border-gray-200 transition-colors", selectedProdIds.includes(p.id) ? "bg-blue-50" : "bg-white", p.isNew && "bg-green-50/20")}>
                              <TableCell className="text-center border-r border-gray-200 p-0"><div className="flex justify-center w-full h-full items-center"><Checkbox className="h-4 w-4" checked={selectedProdIds.includes(p.id)} onCheckedChange={c => handleProdSelectRow(p.id, !!c)} /></div></TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-medium">{p.pCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 font-bold truncate pl-2" title={p.pName}>{p.pName}</TableCell>
                              <TableCell className={cn("text-center border-r border-gray-200 font-bold", p.status==='정상'?'text-blue-600':'text-red-500')}>{p.status}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{p.sCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2">{p.sName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-600 font-medium">{p.sItemCode}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-2 text-gray-500">{p.sItemName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{p.brand}</TableCell>
                              <TableCell className="text-right border-r border-gray-200 pr-3 font-bold text-gray-800">{p.listPrice.toLocaleString()}</TableCell>
                              
                              <TableCell className="text-center border-r border-gray-200 bg-yellow-50/20 p-0">
                                  <Input className="h-full w-full border-none text-right pr-2 text-[11px] font-bold text-red-600 bg-transparent rounded-none focus-visible:ring-1" value={p.rate} onChange={e => handleGridProdChange(p.id, 'rate', e.target.value)} disabled={pDiscountType!=='정율할인'} />
                              </TableCell>
                              <TableCell className="text-center border-r border-gray-200 bg-yellow-50/20 p-0">
                                  <Input className="h-full w-full border-none text-right pr-2 text-[11px] font-bold text-red-600 bg-transparent rounded-none focus-visible:ring-1" value={p.amt.toLocaleString()} onChange={e => handleGridProdChange(p.id, 'amt', e.target.value)} disabled={pDiscountType!=='정액할인'} />
                              </TableCell>
                              <TableCell className="text-center bg-yellow-50/20 p-0">
                                  <Input className="h-full w-full border-none text-right pr-2 text-[12px] font-bold text-blue-700 bg-transparent rounded-none focus-visible:ring-1" value={p.price.toLocaleString()} onChange={e => handleGridProdChange(p.id, 'price', e.target.value)} disabled={pDiscountType!=='균일가'} />
                              </TableCell>
                          </TableRow>
                      ))}
                      {currentProducts.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`empty-p-${i}`} className="h-8 border-b border-gray-200 bg-white">
                            {Array.from({ length: 13 }).map((_, j) => (
                              <TableCell key={j} className={j < 12 ? "border-r border-gray-200" : ""}></TableCell>
                            ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
      </div>
      {/* ProductSearchModal은 ProductCodeSearchField 내부에서 관리 */}
    </div>
  );
}