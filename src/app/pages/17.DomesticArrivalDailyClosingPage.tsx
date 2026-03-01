import React, { useState, useEffect } from 'react';
import { Calendar, Search, X, Info, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { SupplierSearchModal } from '../components/SupplierSearchModal';

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

// ★ 매입율 역계산 팝업 컴포넌트
function RateCalcPopup({ 
    isOpen, onClose, ea, listPrice, currentRate, onApply 
}: { 
    isOpen: boolean, onClose: () => void, ea: number, listPrice: number, currentRate: string, onApply: (rate: string, costTotal: number) => void 
}) {
    const [inputCostTotal, setInputCostTotal] = useState('');
    const [calcRate, setCalcRate] = useState('0.00');
    const [calcUnitCost, setCalcUnitCost] = useState('0');

    useEffect(() => {
        if (isOpen) {
            // 초기 ���릴 때 기존 매입율을 바탕으로 원가합계를 세팅
            const initialCost = Math.round(ea * listPrice * (Number(currentRate) / 100));
            setInputCostTotal(String(initialCost));
            setCalcRate(currentRate || '0.00');
            setCalcUnitCost(Math.round(initialCost / (ea || 1)).toLocaleString());
        }
    }, [isOpen, currentRate, ea, listPrice]);

    const handleCalculate = () => {
        const numCost = Number(inputCostTotal.replace(/[^0-9]/g, '')) || 0;
        if (ea > 0 && listPrice > 0 && numCost > 0) {
            const calculatedRate = (numCost / (ea * listPrice)) * 100;
            const unitCost = numCost / ea;
            
            setCalcRate(calculatedRate.toFixed(2));
            setCalcUnitCost(Math.round(unitCost).toLocaleString());
        } else {
            setCalcRate('0.00');
            setCalcUnitCost('0');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-[4px] shadow-2xl w-[380px] flex flex-col overflow-hidden text-[12px] font-sans border border-gray-400">
                <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
                    <span className="font-bold text-[13px]">매입율 역계산</span>
                    <button onClick={onClose} className="hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="p-4 flex flex-col gap-2 bg-[#fefefe]">
                    <div className="flex items-center gap-2">
                        <span className="w-24 font-bold text-gray-700">수량(EA)</span>
                        <Input className="h-7 flex-1 text-right bg-gray-100 border-gray-300" value={ea.toLocaleString()} readOnly disabled />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-24 font-bold text-gray-700">정가</span>
                        <Input className="h-7 flex-1 text-right bg-gray-100 border-gray-300" value={listPrice.toLocaleString()} readOnly disabled />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-24 font-bold text-gray-700">현재 매입율</span>
                        <Input className="h-7 flex-1 text-right bg-gray-100 border-gray-300" value={currentRate ? `${currentRate}%` : ''} readOnly disabled />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                        <span className="w-24 font-bold text-blue-700">원���합계 입력</span>
                        <Input 
                            className="h-7 flex-1 text-right font-bold focus-visible:ring-2 focus-visible:ring-blue-500 border-blue-400" 
                            value={inputCostTotal ? Number(inputCostTotal).toLocaleString() : ''} 
                            onChange={(e) => setInputCostTotal(e.target.value.replace(/[^0-9]/g, ''))} 
                            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                            placeholder="변경할 원가합계 입력" 
                            autoFocus 
                        />
                    </div>
                    
                    <div className="flex justify-end mt-1 mb-2">
                        <Button className="erp-btn-action" onClick={handleCalculate}>계산실행</Button>
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-28 font-bold text-gray-700">1개당 상품원가</span>
                            <Input className="h-7 flex-1 text-right font-bold text-red-600 bg-red-50 border-red-200" value={calcUnitCost} readOnly disabled />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-28 font-bold text-gray-700">계산된 적용매입율</span>
                            <div className="relative flex-1">
                                <Input className="h-7 w-full text-right font-bold text-blue-700 bg-blue-50 border-blue-200 pr-5" value={calcRate} readOnly disabled />
                                <span className="absolute right-2 top-1.5 text-blue-700 font-bold text-[11px]">%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="erp-modal-footer">
                    <Button className="erp-btn-action" onClick={() => { 
                        if (Number(calcRate) === 0) return alert("먼저 계산을 실행해주세요.");
                        onApply(calcRate, Number(inputCostTotal.replace(/[^0-9]/g, ''))); 
                        onClose(); 
                    }}>적용</Button>
                    <Button className="erp-btn-header" onClick={onClose}>취소</Button>
                </div>
            </div>
        </div>
    );
}

// ★ 안내사항 설명 팝업
function ExplanationPopup({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-[4px] shadow-2xl w-[500px] flex flex-col overflow-hidden text-[13px] font-sans border border-gray-400">
                <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
                    <span className="font-bold flex items-center gap-1"><Info className="w-4 h-4"/> 도움말 및 기준 안내</span>
                    <button onClick={onClose} className="hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 flex flex-col gap-4 bg-[#fefefe] leading-relaxed text-gray-800">
                    <div>
                        <p className="font-bold text-blue-700 mb-1">1. 마감화면과 IFAS 장부화면에서 계산되는 원가합산의 기준 다름</p>
                        <ul className="pl-4 space-y-1">
                            <li>1) 마감 : 원가의 <span className="text-red-600 font-bold">소수점 포함</span> 합산</li>
                            <li>2) IFAS 장부 : 원가의 <span className="text-red-600 font-bold">소수점 절사</span> 합산</li>
                        </ul>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                        <p className="font-bold text-blue-700 mb-1">2. 오차 확인 기준</p>
                        <p className="pl-1">
                            입하(수정) 원가합계 vs IFAS 장부반영총합계<br/>
                            불일치(<span className="font-bold text-red-600">Y</span>), 일치(<span className="font-bold text-blue-600">N</span>)
                        </p>
                    </div>
                </div>
                <div className="erp-modal-footer">
                    <Button className="h-7 px-8 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px] font-bold" onClick={onClose}>닫기</Button>
                </div>
            </div>
        </div>
    );
}

export default function DomesticArrivalDailyClosingPage() {
  const { products, suppliers } = useMockData();

  // 검색 필터 상태
  const [searchDateStart, setSearchDateStart] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [searchDateEnd, setSearchDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState('02'); 
  const [productType, setProductType] = useState('전체'); 
  const [sPurType, setSPurType] = useState('all'); 
  const [errorYn, setErrorYn] = useState('all');

  const [searchProductCode, setSearchProductCode] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchSupplierCode, setSearchSupplierCode] = useState('');
  const [searchSupplierName, setSearchSupplierName] = useState('');

  // 마스터, 디테일, 히스토리 데이터
  const [masterData, setMasterData] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<Record<string, any[]>>({});
  const [historyData, setHistoryData] = useState<Record<string, any[]>>({});

  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  // 체크박스 및 일괄적용 (디테일 그리드용)
  const [selectedDetailIds, setSelectedDetailIds] = useState<string[]>([]);
  const [batchPurType, setBatchPurType] = useState('일시');
  const [batchRate, setBatchRate] = useState('');

  // 팝업 관리
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [calcPopupState, setCalcPopupState] = useState<{isOpen: boolean, rowId: string, ea: number, listPrice: number, currentRate: string}>({ 
      isOpen: false, rowId: '', ea: 0, listPrice: 0, currentRate: '' 
  });

  // ★ 매절 삭제, 일시/한도/위탁만 적용
  const validPurTypes = ['일시', '한도', '위탁']; 

  // 더미 데이터 생성
  const generateMockData = () => {
      const masters: any[] = [];
      const details: Record<string, any[]> = {};
      const histories: Record<string, any[]> = {};

      const baseSuppliers = suppliers ? suppliers.slice(0, 5) : [];
      
      baseSuppliers.forEach((s, mIdx) => {
          const mId = `m-${mIdx}`;
          const rDate = format(subDays(new Date(), mIdx), 'yyyy-MM-dd');
          
          let mKinds = 0;
          let mQty = 0;
          let mListTotal = 0;
          let mCostTotal = 0;
          let mStmtCostTotal = 0;

          const detailRows: any[] = [];
          const numDetails = Math.floor(Math.random() * 3) + 1;
          
          for(let d=0; d<numDetails; d++) {
              const dId = `d-${mIdx}-${d}`;
              const p = products ? products[d % products.length] : { productCode: 'P001', productName: '테스트', groupCategory: '문구' };
              
              const isError = Math.random() > 0.7;
              const ea = Math.floor(Math.random() * 30) + 10;
              const price = parseInt(String(p.listPrice).replace(/[^0-9]/g, '')) || 10000;
              const listTotal = ea * price;
              const rate = Math.floor(Math.random() * 15) + 60; 
              const costTotal = Math.floor(listTotal * (rate / 100));

              const stmtRate = isError ? rate + 5 : rate;
              const stmtCostTotal = isError ? Math.floor(listTotal * (stmtRate / 100)) : costTotal;
              
              const purType = validPurTypes[Math.floor(Math.random() * validPurTypes.length)];
              
              // IFAS 장부반영총합계 (소수점 절사 효과로 오차 모사)
              const ifasTotal = isError ? stmtCostTotal - Math.floor(Math.random() * 100) - 1 : stmtCostTotal;

              mKinds += 1;
              mQty += ea;
              mListTotal += listTotal;
              mCostTotal += costTotal;
              mStmtCostTotal += stmtCostTotal;

              detailRows.push({
                  id: dId,
                  pCode: p.productCode,
                  pName: p.productName,
                  group: p.groupCategory || '문구',
                  sCode: s.code,
                  sName: s.name,
                  companyName: s.name,
                  sPurType: purType,
                  orderApplyType: '기본',
                  ea: ea,
                  listPrice: price,
                  
                  ordRate: rate,
                  ordListTotal: listTotal,
                  ordCostTotal: costTotal,
                  
                  stmtPurType: purType,
                  stmtRate: stmtRate,
                  stmtListTotal: listTotal,
                  stmtCostTotal: stmtCostTotal,
                  
                  arrPurType: purType,
                  arrRate: String(stmtRate),
                  arrListTotal: listTotal,
                  arrCostTotal: stmtCostTotal,
                  ifasTotal: ifasTotal,
                  
                  error: isError ? 'Y' : 'N',
                  transactionStmt: `TS${format(new Date(), 'MMdd')}${String(d).padStart(3, '0')}`,
                  manager: '홍지희'
              });

              histories[dId] = [
                  { hId: `h-${dId}-1`, time: `${rDate} 10:00:00`, field: '매입율', before: `${rate}%`, after: `${stmtRate}%`, user: '12951 홍지희', reason: '명세서 기준 단가 오차 조정' }
              ];
          }

          details[mId] = detailRows;
          
          masters.push({
              id: mId,
              no: mIdx + 1,
              arrivalDate: rDate,
              modDate: rDate,
              stmtDate: rDate,
              receiptNo: `RC${rDate.replace(/-/g,'')}${String(mIdx).padStart(2,'0')}`,
              sCode: s.code,
              sName: s.name,
              purType: validPurTypes[0],
              locationName: '파주물류센터',
              kinds: mKinds,
              qty: mQty,
              listTotal: mListTotal,
              rate: ((mCostTotal / mListTotal) * 100).toFixed(2),
              costTotal: mCostTotal,
              stmtCostTotal: mStmtCostTotal,
              error: mCostTotal !== mStmtCostTotal ? 'Y' : 'N',
              confirm: 'Y',
              confirmId: 'SYS_01',
              stmt: 'Y'
          });
      });

      return { masters, details, histories };
  };

  const handleSearch = () => {
      const mock = generateMockData();
      setMasterData(mock.masters);
      setDetailData(mock.details);
      setHistoryData(mock.histories);
      
      setSelectedMasterId(null);
      setSelectedDetailId(null);
      setSelectedDetailIds([]);
      if (mock.masters.length > 0) {
          handleMasterClick(mock.masters[0].id);
      }
  };

  const handleSearchReset = () => {
      setSearchDateStart(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
      setSearchDateEnd(format(new Date(), 'yyyy-MM-dd'));
      setLocation('02');
      setProductType('전체');
      setSPurType('all');
      setErrorYn('all');
      setSearchProductCode(''); setSearchProductName('');
      setSearchSupplierCode(''); setSearchSupplierName('');
      setMasterData([]);
      setDetailData({});
      setHistoryData({});
      setSelectedMasterId(null);
      setSelectedDetailId(null);
  };

  const handleMasterClick = (mId: string) => {
      setSelectedMasterId(mId);
      setSelectedDetailId(null);
      setSelectedDetailIds([]);
      const currentDetails = detailData[mId] || [];
      if (currentDetails.length > 0) {
          handleDetailClick(currentDetails[0].id);
      }
  };

  const handleDetailClick = (dId: string) => {
      setSelectedDetailId(dId);
  };

  const handleProductCodeSearch = () => {
      if (!searchProductCode.trim()) { setIsProductModalOpen(true); return; }
      const exactMatches = (products || []).filter(p => p.productCode === searchProductCode.trim());
      if (exactMatches.length === 1) setSearchProductName(exactMatches[0].productName);
      else setIsProductModalOpen(true);
  };

  const handleProductNameSearch = () => {
      if (!searchProductName.trim()) { setIsProductModalOpen(true); return; }
      const exactMatches = (products || []).filter(p => p.productName.includes(searchProductName.trim()));
      if (exactMatches.length === 1) { setSearchProductCode(exactMatches[0].productCode); setSearchProductName(exactMatches[0].productName); }
      else setIsProductModalOpen(true);
  };

  const handleSupplierCodeSearch = () => {
      if (!searchSupplierCode.trim()) { setIsSupplierModalOpen(true); return; }
      const exactMatches = (suppliers || []).filter(s => s.code === searchSupplierCode.trim());
      if (exactMatches.length === 1) setSearchSupplierName(exactMatches[0].name);
      else setIsSupplierModalOpen(true);
  };

  const handleSupplierNameSearch = () => {
      if (!searchSupplierName.trim()) { setIsSupplierModalOpen(true); return; }
      const exactMatches = (suppliers || []).filter(s => s.name.includes(searchSupplierName.trim()));
      if (exactMatches.length === 1) { setSearchSupplierCode(exactMatches[0].code); setSearchSupplierName(exactMatches[0].name); }
      else setIsSupplierModalOpen(true);
  };

  const currentDetails = selectedMasterId ? (detailData[selectedMasterId] || []) : [];
  const isAllSelected = currentDetails.length > 0 && selectedDetailIds.length === currentDetails.length;

  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedDetailIds(currentDetails.map(item => item.id));
      else setSelectedDetailIds([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) setSelectedDetailIds(prev => [...prev, id]);
      else setSelectedDetailIds(prev => prev.filter(vid => vid !== id));
  };

  // 개별 변경 시 (입하 매입율 수정 시 원가합계 자동 재계산 및 오차여부 판별)
  const handleDetailChange = (id: string, field: string, val: string) => {
      if (!selectedMasterId) return;
      
      setDetailData(prev => {
          const updatedDetails = prev[selectedMasterId].map(item => {
              if (item.id === id) {
                  const updated = { ...item, [field]: val };
                  if (field === 'arrRate') {
                      const newRate = Number(val) || 0;
                      updated.arrCostTotal = Math.round(item.ea * item.listPrice * (newRate / 100));
                      // IFAS 장부합계와 비교하여 불일치(Y), 일치(N) 오차 판별
                      updated.error = updated.arrCostTotal !== updated.ifasTotal ? 'Y' : 'N';
                  }
                  return updated;
              }
              return item;
          });
          return { ...prev, [selectedMasterId]: updatedDetails };
      });
  };

  // 계산 팝업 적용
  const handleApplyCalc = (id: string, rate: string, costTotal: number) => {
      if (!selectedMasterId) return;
      setDetailData(prev => {
          const updatedDetails = prev[selectedMasterId].map(item => {
              if (item.id === id) {
                  const errorVal = costTotal !== item.ifasTotal ? 'Y' : 'N';
                  return { ...item, arrRate: rate, arrCostTotal: costTotal, error: errorVal };
              }
              return item;
          });
          return { ...prev, [selectedMasterId]: updatedDetails };
      });
  };

  // ★ 일괄 적용 로직 (적용 시 입하 원가합계 및 오차여부 자동 계산)
  const handleApplyBatchPurType = () => {
      if (selectedDetailIds.length === 0) return alert('항목을 먼저 체크박스로 선택해주세요.');
      if (!selectedMasterId) return;

      setDetailData(prev => {
          const updatedDetails = prev[selectedMasterId].map(item => 
              selectedDetailIds.includes(item.id) ? { ...item, arrPurType: batchPurType } : item
          );
          return { ...prev, [selectedMasterId]: updatedDetails };
      });
  };

  const handleApplyBatchRate = () => {
      if (selectedDetailIds.length === 0) return alert('항목을 먼저 체크박스로 선택해주세요.');
      if (!batchRate) return alert('매입율을 입력해주세요.');
      if (!selectedMasterId) return;

      setDetailData(prev => {
          const updatedDetails = prev[selectedMasterId].map(item => {
              if (selectedDetailIds.includes(item.id)) {
                  const newRate = Number(batchRate) || 0;
                  const newCost = Math.round(item.ea * item.listPrice * (newRate / 100));
                  const errorVal = newCost !== item.ifasTotal ? 'Y' : 'N';
                  return { ...item, arrRate: batchRate, arrCostTotal: newCost, error: errorVal };
              }
              return item;
          });
          return { ...prev, [selectedMasterId]: updatedDetails };
      });
  };

  const handleExcelDownloadMaster = () => {
      if (masterData.length === 0) return alert("다운로드할 마감목록 데이터가 없습니다.");
      const ws = XLSX.utils.json_to_sheet(masterData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "인수번호별마감목록");
      XLSX.writeFile(wb, "인수번호별_마감목록.xlsx");
  };

  const handleExcelDownloadDetail = () => {
      if (currentDetails.length === 0) return alert("다운로드할 상세 데이터가 없습니다.");
      const exportData = currentDetails.map(r => ({
          '상품코드': r.pCode, '상품명': r.pName, '조': r.group, '매입처코드': r.sCode, '매입처명': r.sName,
          '매입구분': r.arrPurType, 'EA': r.ea, '정가': r.listPrice, '입하매입율': r.arrRate, '입하원가합계': r.arrCostTotal,
          'IFAS총합계': r.ifasTotal, '오차': r.error
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "상품별입하상세");
      XLSX.writeFile(wb, "상품별_입하상세.xlsx");
  };

  const currentHistories = selectedDetailId ? (historyData[selectedDetailId] || []) : [];

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans relative overflow-hidden gap-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-red-600"></div>
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">국내입하일마감(문구/음반)</h2>
      </div>

      {/* 1. 조회 필터 영역 */}
      <div className="erp-search-area">
      <div className="border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1.5fr] border-b border-gray-200">
             <Label required className="border-r border-gray-200">입하기간</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <DateRangeInput startVal={searchDateStart} endVal={searchDateEnd} onStartChange={setSearchDateStart} onEndChange={setSearchDateEnd} />
             </div>
             
             <Label className="border-r border-gray-200">입하처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="02">파주물류센터(02)</SelectItem>
                        <SelectItem value="50">[본사]매장전체(50)</SelectItem>
                    </SelectContent>
                 </Select>
             </div>

             <Label className="border-r border-gray-200">상품구분</Label>
             <div className="flex items-center p-1 gap-1">
                 <Select value={productType} onValueChange={setProductType}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="전체">전체</SelectItem>
                        <SelectItem value="문구">문구</SelectItem>
                        <SelectItem value="음반">음반</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1.5fr] border-b border-gray-200">
             <Label className="border-r border-gray-200">매입처 매입구분</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={sPurType} onValueChange={setSPurType}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="일시">일시</SelectItem>
                        <SelectItem value="한도">한도</SelectItem>
                        <SelectItem value="위탁">위탁</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
             
             <Label className="border-r border-gray-200">오차여부</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                 <Select value={errorYn} onValueChange={setErrorYn}>
                    <SelectTrigger className="h-6 w-[120px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="전체" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">전체</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent>
                 </Select>
             </div>

             <div className="col-span-2 bg-white"></div>
          </div>

          <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1.5fr]">
             <Label className="border-r border-gray-200">상품코드</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-24 text-[11px] rounded-[2px] border-gray-300" placeholder="ISBN" value={searchProductCode} onChange={(e) => setSearchProductCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="상품명" value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                 </div>
             </div>
             
             <Label className="border-r border-gray-200">매입처</Label>
             <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                 <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300" placeholder="매입처코드" value={searchSupplierCode} onChange={(e) => setSearchSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierCodeSearch()} />
                 <div className="flex-1 relative flex items-center">
                    <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" placeholder="매입처명" value={searchSupplierName} onChange={(e) => setSearchSupplierName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierNameSearch()} />
                    <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierCodeSearch} />
                 </div>
             </div>
             
             <div className="col-span-2 bg-white"></div>
          </div>
      </div>
      <div className="erp-search-actions">
            <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
            <Button variant="outline" className={headerBtnClass} onClick={handleSearch}>조회(F4)</Button>
      </div>
      </div>

      {/* 2. 인수번호별 마감목록 (Master) */}
      <div className="erp-section-group" style={{flex: '3 1 0', minHeight: 0}}>
       <div className="erp-section-toolbar">
         <span className="erp-section-title">인수번호별 마감목록</span>
         <div className="flex gap-1">
             <Button variant="outline" className={actionBtnClass} onClick={() => alert('마감 처리되었습니다.')}>마감(F6)</Button>
             <Button variant="outline" className={actionBtnClass} onClick={() => alert('마감이 취소되었습니다.')}>마감취소(F7)</Button>
             <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownloadMaster}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
         </div>
       </div>
      <div className="flex flex-col border border-gray-300 bg-white flex-1 min-h-0">
         <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[1800px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead className="w-[50px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">No.</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">입하일자</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">변경일자</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">명세서발행일</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">인수번호</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처코드</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입처명</TableHead>
                        <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입구분</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">입하처명</TableHead>
                        <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">종수</TableHead>
                        <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">개수</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">정가합계</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">매입률</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">원가합계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">명세서 원가합계</TableHead>
                        <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">오차</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">구매확인</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">구매확인ID</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 p-1">거래명세서</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {masterData.map(row => (
                        <TableRow key={row.id} className={cn("h-8 cursor-pointer border-b border-gray-200", selectedMasterId === row.id ? "bg-blue-100" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleMasterClick(row.id)}>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.no}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.arrivalDate}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.modDate}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.stmtDate}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-blue-700">{row.receiptNo}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sCode}</TableCell>
                            <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate pl-2">{row.sName}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.purType}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.locationName}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.kinds}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.qty}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{Number(row.listTotal).toLocaleString()}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{row.rate}%</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-gray-800 pr-2 bg-yellow-50/20">{Number(row.costTotal).toLocaleString()}</TableCell>
                            <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-gray-800 pr-2 bg-blue-50/20">{Number(row.stmtCostTotal).toLocaleString()}</TableCell>
                            <TableCell className={cn("text-center p-1 border-r border-gray-200 font-bold", row.error === 'Y' ? 'text-red-600' : 'text-gray-400')}>{row.error}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-blue-600">{row.confirm}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.confirmId}</TableCell>
                            <TableCell className="text-center p-1 text-gray-500">{row.stmt}</TableCell>
                        </TableRow>
                    ))}
                    {masterData.length === 0 && (
                        <TableRow><TableCell colSpan={19} className="h-20 text-center text-gray-500 bg-white">조회를 눌러 인수번호별 마감목록을 확인하세요.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
         </div>
      </div>
      </div>

      {/* 3. 상품별 입하상세 (Detail) */}
      <div className="erp-section-group" style={{flex: '4 1 0', minHeight: 0}}>
       <div className="erp-section-toolbar">
         <span className="erp-section-title">상품별 입하상세</span>
         <div className="flex items-center gap-1">
             <Button variant="outline" className="h-7 px-3 text-[12px] bg-[#fefefe] border-gray-400 text-blue-700 font-bold hover:bg-blue-50 flex items-center gap-1" onClick={() => setIsExplanationOpen(true)}>
                <Info className="w-3.5 h-3.5" /> 설명
             </Button>
             <Button variant="outline" className={actionBtnClass} onClick={() => alert('상세내역이 저장되었습니다.')}>저장(F8)</Button>
             <Button variant="outline" className={actionBtnClass} onClick={handleExcelDownloadDetail}><Download className="w-3.5 h-3.5 mr-1"/>엑셀다운</Button>
         </div>
       </div>
      <div className="flex flex-col border border-gray-300 bg-white flex-1 min-h-0">
         <div className="flex items-center p-2 border-b border-gray-300 flex-shrink-0">
             <div className="flex items-center gap-2">
                {/* ★ 일괄 적용 컨트롤러 */}
                <div className="flex items-center gap-1 ml-4 border-l border-gray-300 pl-4">
                    <Select value={batchPurType} onValueChange={setBatchPurType}>
                        <SelectTrigger className="h-6 w-[80px] text-[11px] rounded-[2px] border-gray-300"><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="일시">일시</SelectItem>
                            <SelectItem value="한도">한도</SelectItem>
                            <SelectItem value="위탁">위탁</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-6 px-3 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={handleApplyBatchPurType}>매입구분일괄적용</Button>
                    
                    <span className="text-gray-300 ml-2 mr-2">|</span>
                    
                    <Input 
                        className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300 text-right focus-visible:ring-1 focus-visible:ring-blue-500" 
                        placeholder="0.00" 
                        value={batchRate} 
                        onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = val.split('.');
                            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                            if (parts[0].length > 2) parts[0] = parts[0].slice(0, 2);
                            if (parts.length > 1 && parts[1].length > 2) parts[1] = parts[1].slice(0, 2);
                            val = parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
                            setBatchRate(val);
                        }} 
                    />
                    <span className="text-gray-600 font-bold text-[11px]">%</span>
                    <Button variant="outline" className="h-6 px-3 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={handleApplyBatchRate}>매입율일괄적용</Button>
                </div>
             </div>
         </div>
         <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[3200px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead className="w-[40px] text-center border-r border-b border-gray-300 p-1" rowSpan={2}>
                            <div className="flex justify-center items-center w-full h-full">
                                <Checkbox className="h-4 w-4 rounded-[2px]" checked={isAllSelected} onCheckedChange={(c) => handleSelectAll(!!c)} />
                            </div>
                        </TableHead>
                        <TableHead rowSpan={2} className="w-[120px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품코드</TableHead>
                        <TableHead rowSpan={2} className="w-[200px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">상품명</TableHead>
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">조코드</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처<br/>코드</TableHead>
                        <TableHead rowSpan={2} className="w-[150px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처명</TableHead>
                        <TableHead rowSpan={2} className="w-[150px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">업체명</TableHead>
                        <TableHead rowSpan={2} className="w-[90px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입처<br/>매입구분</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">발주기준<br/>적용구분</TableHead>
                        <TableHead rowSpan={2} className="w-[60px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">EA</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">정가</TableHead>
                        
                        <TableHead colSpan={3} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-yellow-50">발주</TableHead>
                        <TableHead colSpan={4} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-blue-50">명세서</TableHead>
                        <TableHead colSpan={5} className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-green-50">입하(수정)</TableHead>
                        
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">매입율계산</TableHead>
                        <TableHead rowSpan={2} className="w-[60px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">오차</TableHead>
                        <TableHead rowSpan={2} className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">예외상품</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">거래명세서</TableHead>
                        <TableHead rowSpan={2} className="w-[100px] text-center font-bold text-gray-900 border-b border-gray-300 p-1">담당자</TableHead>
                    </TableRow>
                    <TableRow className="bg-[#f4f4f4] h-8 shadow-[0_1px_0_0_#d1d5db]">
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">매입율</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">정가합계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">원가합계</TableHead>

                        <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">매입구분</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">매입율</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">정가합계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-blue-50">원가합계</TableHead>

                        <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">매입구분</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">매입율</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">정가합계</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">원가합계</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-green-50">IFAS장부반영<br/>총합계</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentDetails.map((row) => {
                        const isChecked = selectedDetailIds.includes(row.id);
                        const isSelectedRow = selectedDetailId === row.id;
                        return (
                            <TableRow key={row.id} className={cn("h-8 border-b border-gray-200 cursor-pointer", isSelectedRow ? "bg-blue-100" : isChecked ? "bg-blue-50" : "hover:bg-blue-50/50 bg-white")} onClick={() => handleDetailClick(row.id)}>
                                <TableCell className="text-center p-0 border-r border-gray-200">
                                    <div className="flex justify-center items-center w-full h-full" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox className="h-4 w-4 rounded-[2px]" checked={isChecked} onCheckedChange={(c) => handleSelectRow(row.id, !!c)} />
                                    </div>
                                </TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.pCode}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-800 font-bold truncate pl-2">{row.pName}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.group}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sCode}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate pl-2">{row.sName}</TableCell>
                                <TableCell className="text-left p-1 border-r border-gray-200 text-gray-600 truncate pl-2">{row.companyName}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.sPurType}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-600">{row.orderApplyType}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-800 pr-2 font-bold">{row.ea}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-2">{Number(row.listPrice).toLocaleString()}</TableCell>
                                
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-yellow-50/20">{row.ordRate}%</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-yellow-50/20">{Number(row.ordListTotal).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-yellow-50/20">{Number(row.ordCostTotal).toLocaleString()}</TableCell>

                                <TableCell className="text-center p-1 border-r border-gray-200 bg-blue-50/20">{row.stmtPurType}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-blue-50/20">{row.stmtRate}%</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-blue-50/20">{Number(row.stmtListTotal).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-gray-800 bg-blue-50/20">{Number(row.stmtCostTotal).toLocaleString()}</TableCell>

                                {/* 입하(수정) - 정가합계, 원가합계 자동 계산/매핑 */}
                                <TableCell className="text-center p-0 border-r border-gray-200 bg-green-50/30">
                                    <Select value={row.arrPurType} onValueChange={(val) => handleDetailChange(row.id, 'arrPurType', val)}>
                                        <SelectTrigger className="h-full w-full border-none shadow-none text-center bg-transparent rounded-none focus:ring-1 focus:ring-blue-500 h-8 px-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="일시">일시</SelectItem>
                                            <SelectItem value="한도">한도</SelectItem>
                                            <SelectItem value="위탁">위탁</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right p-0 border-r border-gray-200 bg-green-50/30">
                                    <div className="relative flex items-center h-full">
                                        <Input 
                                            className="h-full w-full border-none text-right pr-4 text-[12px] font-bold text-blue-600 bg-transparent rounded-none focus-visible:ring-1 focus-visible:ring-blue-500" 
                                            value={row.arrRate} 
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/[^0-9.]/g, '');
                                                const parts = val.split('.');
                                                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                                                if (parts[0].length > 2) parts[0] = parts[0].slice(0, 2);
                                                if (parts.length > 1 && parts[1].length > 2) parts[1] = parts[1].slice(0, 2);
                                                val = parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
                                                handleDetailChange(row.id, 'arrRate', val);
                                            }} 
                                        />
                                        <span className="absolute right-1 text-[10px] text-blue-600 font-bold">%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 bg-green-50/20">{Number(row.arrListTotal).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-blue-700 bg-green-50/20">{Number(row.arrCostTotal).toLocaleString()}</TableCell>
                                <TableCell className="text-right p-1 border-r border-gray-200 pr-2 font-bold text-purple-700 bg-green-50/20">{Number(row.ifasTotal).toLocaleString()}</TableCell>

                                {/* 기능 버튼 영역 */}
                                <TableCell className="text-center p-1 border-r border-gray-200">
                                    <Button variant="outline" className="h-6 px-2 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={(e) => { e.stopPropagation(); setCalcPopupState({ isOpen: true, rowId: row.id, ea: row.ea, listPrice: row.listPrice, currentRate: row.arrRate }); }}>계산</Button>
                                </TableCell>
                                <TableCell className={cn("text-center p-1 border-r border-gray-200 font-bold", row.error === 'Y' ? 'text-red-600' : 'text-blue-600')}>{row.error}</TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200">
                                    <Button variant="outline" className="h-6 px-2 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={(e) => { e.stopPropagation(); alert('상품매입율관리 페이지로 이동합니다.'); }}>예외상품</Button>
                                </TableCell>
                                <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">
                                    <Button variant="outline" className="h-6 px-2 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]" onClick={(e) => { e.stopPropagation(); alert(`${row.transactionStmt} 거래명세서 팝업을 띄웁니다.`); }}>명세서</Button>
                                </TableCell>
                                <TableCell className="text-center p-1 text-gray-500">{row.manager}</TableCell>
                            </TableRow>
                        );
                    })}
                    {currentDetails.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={`empty-d-${i}`} className="h-8 border-b border-gray-200 bg-white">
                          {Array.from({ length: 25 }).map((_, j) => (
                            <TableCell key={j} className={j < 24 ? "border-r border-gray-200" : ""}></TableCell>
                          ))}
                        </TableRow>
                    ))}
                    {false && (
                        <TableRow>
                            <TableCell colSpan={25} className="h-20 text-center text-gray-500 bg-white">
                                상단 마감목록을 선택하면 상세 상품이 나타납니다.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
         </div>
      </div>

      </div>

      {/* 4. 입하상세 변경이력 (History) */}
      <div className="erp-section-group" style={{flex: '2 1 0', minHeight: 0}}>
       <div className="erp-section-toolbar">
         <span className="erp-section-title">입하상세 변경이력</span>
       </div>
      <div className="flex flex-col border border-gray-300 bg-white flex-1 min-h-0">
         <div className="flex-1 overflow-auto relative">
            <Table className="table-fixed min-w-[1000px] border-collapse text-[11px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                    <TableRow className="h-8">
                        <TableHead className="w-[60px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">No.</TableHead>
                        <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">변경일시</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">변경항목</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">변경 전 내용</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300 p-1 bg-yellow-50">변경 후 내용</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300 p-1">변경자</TableHead>
                        <TableHead className="text-center font-bold text-gray-900 p-1">변경사유</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentHistories.map((row, idx) => (
                        <TableRow key={row.hId} className="h-8 hover:bg-blue-50/50 bg-white border-b border-gray-200">
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{idx + 1}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.time}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 font-bold text-blue-700">{row.field}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500 line-through">{row.before}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-800 font-bold bg-yellow-50/30">{row.after}</TableCell>
                            <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">{row.user}</TableCell>
                            <TableCell className="text-left p-1 text-gray-600 pl-4 truncate">{row.reason}</TableCell>
                        </TableRow>
                    ))}
                    {currentHistories.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-16 text-center text-gray-500 bg-white">해당 상품의 수정 이력이 없습니다.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
         </div>
      </div>
      </div>

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={searchProductName || searchProductCode} onSelect={(item) => { setSearchProductCode(item.productCode); setSearchProductName(item.productName); }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={searchSupplierName || searchSupplierCode} onSelect={(item) => { setSearchSupplierCode(item.code); setSearchSupplierName(item.name); }} />
      
      {/* 매입율 역계산 팝업 */}
      <RateCalcPopup 
          isOpen={calcPopupState.isOpen} 
          onClose={() => setCalcPopupState(p => ({ ...p, isOpen: false }))} 
          ea={calcPopupState.ea}
          listPrice={calcPopupState.listPrice}
          currentRate={calcPopupState.currentRate}
          onApply={(rate, costTotal) => handleApplyCalc(calcPopupState.rowId, rate, costTotal)}
      />

      {/* 안내사항 팝업 */}
      <ExplanationPopup isOpen={isExplanationOpen} onClose={() => setIsExplanationOpen(false)} />
    </div>
  );
}