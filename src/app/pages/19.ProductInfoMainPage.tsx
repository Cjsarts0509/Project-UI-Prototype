import React, { useState, useEffect, useRef } from 'react';
import { Search, Info, X, Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { useMockData } from '../../context/MockDataContext';
import { format, subDays, addDays } from 'date-fns';

import { ProductSearchModal } from '../components/ProductSearchModal';
import { ProductCodeSearchField } from '../components/ProductCodeSearchField';
import { SupplierSearchModal } from '../components/SupplierSearchModal';

// ★ 영업점(수불처/점포) 공통 코드 적용
export const STORE_CODES = [
  { code: "001", name: "광화문점" }, { code: "002", name: "대전점" }, { code: "003", name: "원그로브점" },
  { code: "004", name: "대구점" }, { code: "005", name: "부산점" }, { code: "013", name: "부천점" },
  { code: "015", name: "강남점" }, { code: "023", name: "건대스타시티점" }, { code: "024", name: "세종점" },
  { code: "025", name: "인천점" }, { code: "028", name: "창원점" }, { code: "029", name: "잠실점" },
  { code: "031", name: "전주점" }, { code: "033", name: "목동점" }, { code: "034", name: "천안점" },
  { code: "036", name: "영등포점" }, { code: "038", name: "일산점" }, { code: "039", name: "울산점" },
  { code: "041", name: "동대문점" }, { code: "042", name: "송도점" }, { code: "043", name: "해운대 팝업" },
  { code: "045", name: "센텀시티점" }, { code: "046", name: "은평점" }, { code: "047", name: "분당점" },
  { code: "048", name: "칠곡점" }, { code: "049", name: "합정점" }, { code: "052", name: "광교월드" },
  { code: "056", name: "청량리점" }, { code: "057", name: "평촌점" }, { code: "058", name: "가든파이브" },
  { code: "059", name: "경성대점" }, { code: "064", name: "서울역점" }, { code: "067", name: "KH본부" },
  { code: "068", name: "수유점" }, { code: "069", name: "판교점" }, { code: "070", name: "광교점" },
  { code: "090", name: "천호점" }, { code: "999", name: "파주센터" }
];

const Label = ({ required, children, className }: { required?: boolean, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#eef3f8] border-r border-gray-200 px-3 py-1 flex items-center justify-end text-[12px] font-bold text-blue-600 whitespace-nowrap h-full", className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </div>
);

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

const headerBtnClass = "erp-btn-header";
const actionBtnClass = "erp-btn-action";
const subActionBtnClass = "h-6 px-3 text-[11px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 rounded-[2px]";

// 자유롭게 이동 가능한 Draggable 모달 래퍼
const DraggableModal = ({ isOpen, onClose, title, children, width = 600, defaultTop = 150 }: any) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen) {
            setPosition({ x: window.innerWidth / 2 - width / 2, y: defaultTop });
        }
    }, [isOpen, width, defaultTop]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }}>
            <div 
                style={{ position: 'absolute', left: position.x, top: position.y, width: width, pointerEvents: 'auto' }}
                className="bg-white rounded-[4px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-[12px] font-sans border border-gray-500"
            >
                <div 
                    className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0 cursor-move select-none"
                    onMouseDown={(e) => {
                        setIsDragging(true);
                        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
                    }}
                >
                    <span className="font-bold text-[13px]">{title}</span>
                    <button onClick={onClose} className="hover:text-red-400 cursor-pointer pointer-events-auto" onMouseDown={e => e.stopPropagation()}><X className="w-4 h-4" /></button>
                </div>
                <div className="bg-[#fefefe] pointer-events-auto flex flex-col max-h-[85vh]">{children}</div>
            </div>
        </div>
    );
};

// ★ 1. 상품검색결과조회 팝업
function IntegratedSearchPopup({ isOpen, onClose, query, onSelect, keepOpen, products }: any) {
    const [onlyNormal, setOnlyNormal] = useState(false); // 정상 상태만 보기 기본 해제
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    const filtered = (products || []).filter((p: any) => {
        if (onlyNormal && p.productStatus !== '정상') return false;
        if (query && !p.productName.includes(query) && p.productCode !== query) return false;
        return true;
    });

    const handleSelect = () => {
        const item = filtered.find((p:any) => p.productCode === selectedRowId);
        if(item) {
            onSelect(item);
            if (!keepOpen) onClose();
        } else {
            alert('항목을 선택해주세요.');
        }
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} title="상품검색결과조회" width={1000} defaultTop={100}>
            <div className="p-3 flex flex-col gap-2 flex-1 overflow-hidden">
                <div className="flex justify-between items-center bg-white p-2 border border-gray-300 rounded-[2px]">
                    <div className="flex items-center gap-6">
                        <div className="font-bold text-gray-800 text-[13px]">
                            <span className="text-blue-700 mr-2">[국문({filtered.length}건)]</span>
                            <span className="text-gray-500">[영문(0건)]</span>
                        </div>
                        <label className="flex items-center gap-1.5 font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">
                            <Checkbox checked={onlyNormal} onCheckedChange={(c) => setOnlyNormal(!!c)} className="h-4 w-4 rounded-[2px]" /> 정상 상태만 보기
                        </label>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold">정렬조건:</span>
                            <Select defaultValue="출판일자">
                               <SelectTrigger className="h-6 w-[110px] text-[11px] bg-white border-gray-300"><SelectValue /></SelectTrigger>
                               <SelectContent><SelectItem value="출판일자">출판일자</SelectItem><SelectItem value="상품명">상품명</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold">조코드:</span>
                            <Select defaultValue="전체">
                               <SelectTrigger className="h-6 w-[90px] text-[11px] bg-white border-gray-300"><SelectValue /></SelectTrigger>
                               <SelectContent><SelectItem value="전체">전체</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold">페이지:</span>
                            <Select defaultValue="1">
                               <SelectTrigger className="h-6 w-[70px] text-[11px] bg-white border-gray-300"><SelectValue /></SelectTrigger>
                               <SelectContent><SelectItem value="1">1</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto border border-gray-300 mt-1 min-h-[300px]">
                    <Table className="table-fixed w-full border-collapse text-[11px] whitespace-nowrap">
                        <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                            <TableRow className="h-8">
                                <TableHead className="w-[70px] text-center border-r border-gray-300 font-bold text-gray-900">조코드</TableHead>
                                <TableHead className="w-[110px] text-center border-r border-gray-300 font-bold text-gray-900">상품코드</TableHead>
                                <TableHead className="text-center border-r border-gray-300 font-bold text-gray-900">상품명</TableHead>
                                <TableHead className="w-[100px] text-center border-r border-gray-300 font-bold text-gray-900">저자</TableHead>
                                <TableHead className="w-[120px] text-center border-r border-gray-300 font-bold text-gray-900">출판사(매입처)</TableHead>
                                <TableHead className="w-[85px] text-center border-r border-gray-300 font-bold text-gray-900">출판일자</TableHead>
                                <TableHead className="w-[75px] text-center border-r border-gray-300 font-bold text-gray-900">정가</TableHead>
                                <TableHead className="w-[60px] text-center border-r border-gray-300 font-bold text-gray-900">상품상태</TableHead>
                                <TableHead className="w-[60px] text-center border-r border-gray-300 font-bold text-gray-900">가용재고</TableHead>
                                <TableHead className="w-[60px] text-center font-bold text-gray-900">파주재고</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((p: any) => (
                                <TableRow 
                                    key={p.productCode} 
                                    className={cn("h-7 cursor-pointer border-b border-gray-200 transition-colors", selectedRowId === p.productCode ? "bg-blue-100" : "hover:bg-blue-50 bg-white")}
                                    onClick={() => setSelectedRowId(p.productCode)}
                                    onDoubleClick={() => { 
                                        onSelect(p); 
                                        if (!keepOpen) onClose(); 
                                    }}
                                >
                                    <TableCell className="text-center border-r border-gray-200">{p.groupCategory || '문구'}</TableCell>
                                    <TableCell className="text-center border-r border-gray-200 font-medium">{p.productCode}</TableCell>
                                    <TableCell className="text-left border-r border-gray-200 pl-2 font-bold truncate text-gray-800" title={p.productName}>{p.productName}</TableCell>
                                    <TableCell className="text-center border-r border-gray-200 truncate" title={p.artistName}>{p.artistName || '-'}</TableCell>
                                    <TableCell className="text-left border-r border-gray-200 pl-2 truncate" title={p.supplierName}>{p.supplierName}</TableCell>
                                    <TableCell className="text-center border-r border-gray-200">{p.releaseDate || '2024-01-01'}</TableCell>
                                    <TableCell className="text-right border-r border-gray-200 pr-2">{p.listPrice.toLocaleString()}</TableCell>
                                    <TableCell className={cn("text-center border-r border-gray-200 font-bold", p.productStatus==='정상' ? 'text-blue-600' : 'text-red-500')}>{p.productStatus}</TableCell>
                                    <TableCell className="text-right border-r border-gray-200 pr-2">{Math.floor(Math.random()*10)}</TableCell>
                                    <TableCell className="text-right pr-2 text-gray-600">{Math.floor(Math.random()*50)}</TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow><TableCell colSpan={10} className="h-24 text-center text-gray-500">검색 결과가 없습니다.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-500 font-medium pl-1">※ 목록을 더블클릭하거나 선택 버튼을 누르세요.</span>
                    <div className="flex gap-1.5">
                        <Button className="erp-btn-action" onClick={handleSelect}>선택</Button>
                        <Button className="h-7 px-8 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px] font-bold" onClick={onClose}>x 닫기</Button>
                        <Button variant="outline" className="h-7 px-4 text-[12px] bg-white border-gray-400 font-bold hover:bg-gray-100 flex items-center gap-1 ml-2"><Download className="w-3.5 h-3.5"/> 엑셀다운</Button>
                    </div>
                </div>
            </div>
        </DraggableModal>
    );
}

// ★ 2. 상품판매집계 팝업 (실제 데이터 연동 추가)
function SalesAggregationPopup({ isOpen, onClose, initialPCode, initialPName, initialListPrice, initialSupplierName, initialReleaseDate, initialGroupCode, initialArtist, products }: any) {
    const [searchStart, setSearchStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [searchEnd, setSearchEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [pCode, setPCode] = useState('');
    const [pName, setPName] = useState('');
    const [listPrice, setListPrice] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [groupCode, setGroupCode] = useState('');
    const [artist, setArtist] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPCode(initialPCode || '');
            setPName(initialPName || '');
            setListPrice(initialListPrice || '');
            setSupplierName(initialSupplierName || '');
            setReleaseDate(initialReleaseDate || '');
            setGroupCode(initialGroupCode || '');
            setArtist(initialArtist || '');
        }
    }, [isOpen, initialPCode, initialPName, initialListPrice, initialSupplierName, initialReleaseDate, initialGroupCode, initialArtist]);

    const handleReset = () => {
        setPCode(''); setPName(''); setListPrice(''); setSupplierName('');
        setReleaseDate(''); setGroupCode(''); setArtist('');
    };

    const handleSearch = () => {
        if (!pCode && !pName) return alert('상품코드 또는 상품명을 입력하세요.');
        
        // 상품코드 또는 명칭으로 실�� 데이터 조회
        const matched = (products || []).find((p:any) => p.productCode === pCode || p.productName.includes(pName));
        
        if (matched) {
            setPCode(matched.productCode);
            setPName(matched.productName);
            setListPrice(String(matched.listPrice));
            setSupplierName(matched.supplierName);
            setReleaseDate(matched.releaseDate || '2025-01-09');
            setGroupCode(matched.groupCategory || '문구');
            setArtist(matched.artistName || '작자미상');
        } else {
            alert('일치하는 상품을 찾을 수 없습니다.');
        }
    };

    if (!isOpen) return null;
    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} title="[상품판매집계] 상세" width={1050} defaultTop={50}>
            <div className="p-3 flex flex-col gap-3 flex-1 overflow-hidden">
                <div className="border border-gray-300 bg-white">
                    <div className="grid grid-cols-[80px_1fr_1fr_150px] border-b border-gray-200">
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">상품코드</Label>
                        <div className="flex items-center p-1 px-2 border-r border-gray-200 relative col-span-2 gap-1 bg-blue-50/10">
                            <Input className="h-6 w-32 text-[11px] font-bold border-gray-400 focus-visible:ring-blue-500" value={pCode} onChange={e => setPCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="상품코드" />
                            <Input className="h-6 flex-1 text-[11px] font-bold border-gray-400 focus-visible:ring-blue-500" value={pName} onChange={e => setPName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="상품명" />
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                            <Button variant="outline" className="h-6 px-3 text-[11px] bg-white border-gray-400 font-bold hover:bg-gray-100" onClick={handleSearch}>조회(F9)</Button>
                            <Button variant="outline" className="h-6 px-3 text-[11px] bg-white border-gray-400 font-bold hover:bg-gray-100" onClick={handleReset}>초기화(F10)</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr_80px_1fr] border-b border-gray-200">
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">출판사(매입처)</Label>
                        <div className="flex items-center p-1 px-2 border-r border-gray-200 text-gray-700 truncate">{supplierName || '-'}</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">출판일자</Label>
                        <div className="flex items-center p-1 px-2 border-r border-gray-200">{releaseDate || '-'}</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">조코드</Label>
                        <div className="flex items-center p-1 px-2 border-r border-gray-200 truncate">{groupCode || '-'}</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">점포</Label>
                        <div className="flex items-center p-1 border-r border-gray-200">
                            <Select defaultValue="001"><SelectTrigger className="h-6 w-full text-[11px] border-none shadow-none bg-transparent"><SelectValue /></SelectTrigger><SelectContent className="max-h-[250px]">{STORE_CODES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr] border-b border-gray-300 bg-gray-50/50">
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">저자</Label>
                        <div className="flex items-center p-1 px-2 border-r border-gray-200 text-gray-700 truncate">{artist || '-'}</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">역자</Label>
                        <div className="flex items-center p-1 px-2 border-r border-gray-200 text-gray-400">-</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">정가금액</Label>
                        <div className="flex items-center p-1 px-2 font-bold text-right col-span-3 text-[13px] tracking-wider">{listPrice ? Number(listPrice).toLocaleString() : '0'}</div>
                    </div>
                    
                    <div className="border-b border-gray-300 border-dashed my-1 mx-2"></div>

                    <div className="grid grid-cols-[80px_auto_80px_1fr_80px_1fr_120px] border-b border-gray-200">
                        <Label className="border-r border-gray-200 bg-yellow-50/60" required>조회일자</Label>
                        <div className="flex items-center p-1 border-r border-gray-200 bg-yellow-50/10 px-3">
                            <DateRangeInput startVal={searchStart} endVal={searchEnd} onStartChange={setSearchStart} onEndChange={setSearchEnd} />
                        </div>
                        <Label className="border-r border-gray-200 bg-yellow-50/60" required>수불처</Label>
                        <div className="flex items-center p-1 border-r border-gray-200 bg-yellow-50/10">
                            <Select defaultValue="001">
                                <SelectTrigger className="h-6 w-[120px] text-[11px] bg-white border-gray-300"><SelectValue /></SelectTrigger>
                                <SelectContent className="max-h-[250px]">
                                    {STORE_CODES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Label className="border-r border-gray-200 bg-yellow-50/60" required>조회구분</Label>
                        <div className="flex items-center p-1 border-r border-gray-200 bg-yellow-50/10">
                            <Select defaultValue="판매량">
                                <SelectTrigger className="h-6 w-[100px] text-[11px] bg-white border-gray-300"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="판매량">판매량</SelectItem>
                                    <SelectItem value="반입량">반입량</SelectItem>
                                    <SelectItem value="반품량">반품량</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                            <Button className="erp-btn-action">조회(F4)</Button>
                            <Button variant="outline" className="h-6 px-3 text-[11px] bg-white border-gray-400 font-bold hover:bg-gray-100">크게</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-[80px_1fr_80px_1fr_80px_1fr_80px_1fr] bg-blue-50/10">
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">최근발주일자</Label>
                        <div className="flex items-center justify-center p-1 border-r border-gray-200 text-gray-700 font-bold">{format(subDays(new Date(), 20), 'yyyy/MM/dd')}</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">발주량</Label>
                        <div className="flex items-center justify-center p-1 border-r border-gray-200 text-blue-700 font-bold text-[13px]">5</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">최근반입일자</Label>
                        <div className="flex items-center justify-center p-1 border-r border-gray-200 text-gray-700 font-bold">{format(subDays(new Date(), 2), 'yyyy/MM/dd')}</div>
                        <Label className="border-r border-gray-200 bg-[#eef3f8]">반입량</Label>
                        <div className="flex items-center justify-center p-1 font-bold text-red-600 text-[13px]">1</div>
                    </div>
                </div>

                <div className="flex gap-3 flex-1 min-h-[300px] overflow-hidden">
                    <div className="flex-[3] border border-gray-300 overflow-auto bg-white flex flex-col">
                        <Table className="table-fixed w-full border-collapse text-[11px]">
                            <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                                <TableRow className="h-8">
                                    <TableHead className="w-[85px] text-center border-r border-gray-300 font-bold text-gray-900">주차</TableHead>
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-gray-900">월</TableHead>
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-gray-900">화</TableHead>
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-gray-900">수</TableHead>
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-gray-900">목</TableHead>
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-gray-900">금</TableHead>
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-blue-600">토</TableHead>
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-red-600">일</TableHead>
                                    <TableHead className="w-[50px] text-center border-r border-gray-300 font-bold bg-yellow-50 text-gray-900">계</TableHead>
                                    <TableHead className="w-[70px] text-center font-bold bg-green-50 text-gray-900">판매누계</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* ★ Fragment key 에러 완벽 해결 */}
                                {[1,2,3,4,5].map(week => (
                                    <React.Fragment key={week}>
                                        <TableRow className="h-6 bg-gray-100/50 border-b border-gray-200">
                                            <TableCell className="text-center border-r border-gray-300 font-bold text-gray-800 bg-[#eef3f8]">02 월 {week} 주</TableCell>
                                            <TableCell className="text-center border-r border-gray-200 text-gray-600">{week===1?'':`2/0${week*7-6}`}</TableCell>
                                            <TableCell className="text-center border-r border-gray-200 text-gray-600">{week===1?'':`2/0${week*7-5}`}</TableCell>
                                            <TableCell className="text-center border-r border-gray-200 text-gray-600">{week===1?'':`2/0${week*7-4}`}</TableCell>
                                            <TableCell className="text-center border-r border-gray-200 text-gray-600">2/{String(week*7-3).padStart(2,'0')}</TableCell>
                                            <TableCell className="text-center border-r border-gray-200 text-gray-600">2/{String(week*7-2).padStart(2,'0')}</TableCell>
                                            <TableCell className="text-center border-r border-gray-200 text-blue-500 font-medium">2/{String(week*7-1).padStart(2,'0')}</TableCell>
                                            <TableCell className="text-center border-r border-gray-200 text-red-400 font-medium">2/{String(week*7).padStart(2,'0')}</TableCell>
                                            <TableCell className="text-center border-r border-gray-300 bg-yellow-50/50"></TableCell>
                                            <TableCell className="text-center bg-green-50/50"></TableCell>
                                        </TableRow>
                                        <TableRow className="h-7 bg-white border-b border-gray-300">
                                            <TableCell className="text-center border-r border-gray-300 font-bold text-gray-800">판매량</TableCell>
                                            <TableCell className="text-right border-r border-gray-200 pr-3">0</TableCell>
                                            <TableCell className="text-right border-r border-gray-200 pr-3">0</TableCell>
                                            <TableCell className="text-right border-r border-gray-200 pr-3">0</TableCell>
                                            <TableCell className="text-right border-r border-gray-200 pr-3 font-bold text-blue-700">{week===1 ? 1 : 0}</TableCell>
                                            <TableCell className="text-right border-r border-gray-200 pr-3">0</TableCell>
                                            <TableCell className="text-right border-r border-gray-200 pr-3">0</TableCell>
                                            <TableCell className="text-right border-r border-gray-200 pr-3 font-bold text-blue-700">{week===4 ? 1 : 0}</TableCell>
                                            <TableCell className="text-right border-r border-gray-300 pr-3 font-bold bg-yellow-50">{week===1 || week===4 ? 1 : 0}</TableCell>
                                            <TableCell className="text-right pr-3 font-bold bg-green-50">{week===1 ? 1 : (week===4 ? 2 : (week>4 ? 2 : 1))}</TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex-[2] border border-gray-300 overflow-auto bg-white flex flex-col">
                        <Table className="table-fixed w-full border-collapse text-[11px]">
                            <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                                <TableRow className="h-8">
                                    <TableHead className="text-center border-r border-gray-300 font-bold text-gray-900">수불처</TableHead>
                                    <TableHead className="w-[65px] text-center border-r border-gray-300 font-bold text-gray-900">수불재고</TableHead>
                                    <TableHead className="w-[60px] text-center border-r border-gray-300 font-bold text-gray-900">실재고</TableHead>
                                    <TableHead className="w-[60px] text-center font-bold bg-blue-50 text-blue-800">판매량</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    {n: '영등포점', s: 1, r: 1, p: 1}, {n: '송도점', s: 1, r: 1, p: 1}, {n: '대전점', s: 0, r: 0, p: 0},
                                    {n: '광화문점', s: 1, r: 1, p: 0}, {n: '파주센터', s: 6, r: 5, p: 0}, {n: '대구점', s: 0, r: 0, p: 0},
                                    {n: '부산점', s: 0, r: 0, p: 0}, {n: '건대스타시티', s: 1, r: 1, p: 0}, {n: '부천점', s: 1, r: 1, p: 0}
                                ].map((row, idx) => (
                                    <TableRow key={row.n} className="h-7 hover:bg-blue-50 bg-white border-b border-gray-200">
                                        <TableCell className="text-center border-r border-gray-200 bg-gray-50/40 text-gray-800 font-medium">{row.n}</TableCell>
                                        <TableCell className="text-right border-r border-gray-200 pr-4 font-bold">{row.s}</TableCell>
                                        <TableCell className="text-right border-r border-gray-200 pr-4 font-bold">{row.r}</TableCell>
                                        <TableCell className="text-right pr-4 text-blue-700 font-bold bg-blue-50/10">{row.p}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="h-8 bg-yellow-50 font-bold sticky bottom-0 shadow-[0_-1px_0_0_#d1d5db]">
                                    <TableCell className="text-center border-r border-gray-300 text-gray-800 text-[12px]">합계</TableCell>
                                    <TableCell className="text-right border-r border-gray-300 pr-4 text-[12px]">25</TableCell>
                                    <TableCell className="text-right border-r border-gray-300 pr-4 text-[12px]">23</TableCell>
                                    <TableCell className="text-right pr-4 text-red-600 text-[12px]">2</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </DraggableModal>
    );
}

// 3. 수불정보조회 팝업 
function InventoryTransactionPopup({ isOpen, onClose, pCode }: { isOpen: boolean, onClose: () => void, pCode: string }) {
    if (!isOpen) return null;
    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} title="수불정보조회" width={700} defaultTop={200}>
            <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center bg-[#f9f9f9] p-2 border border-gray-300 rounded-[2px]">
                    <span className="font-bold text-blue-800 text-[13px] ml-2">상품코드: {pCode || '-'}</span>
                    <div className="flex items-center font-bold text-gray-800 bg-white px-4 py-1.5 border border-gray-300">
                        최근 7일간 판매수량: <span className="text-red-600 ml-3 text-[14px]">[      0      ]</span>
                    </div>
                </div>
                <div className="h-[280px] overflow-auto border border-gray-300 bg-white flex flex-col">
                    <Table className="table-fixed w-full border-collapse flex-1 text-[11px]">
                        <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                            <TableRow className="h-8">
                                <TableHead className="w-[110px] text-center font-bold text-gray-900 border-r border-gray-300">수불일자</TableHead>
                                <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">수불구분</TableHead>
                                <TableHead className="w-[90px] text-center font-bold text-gray-900 border-r border-gray-300">구분</TableHead>
                                <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300">수불상대처</TableHead>
                                <TableHead className="w-[90px] text-center font-bold text-blue-800 border-r border-gray-300 bg-blue-50/50">수량</TableHead>
                                <TableHead className="w-[120px] text-center font-bold text-gray-900 border-gray-300">정가금액</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="h-full">
                                <TableCell colSpan={6} className="text-center align-middle h-full border-none">
                                    <span className="text-gray-500 font-bold text-[13px]">조회된 내용이 없습니다.</span>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-center pt-2 mt-1 border-t border-gray-200">
                    <Button className="h-7 px-8 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px] font-bold" onClick={onClose}>x 닫기</Button>
                </div>
            </div>
        </DraggableModal>
    );
}

// 4. 재고정보 팝업
function InventoryInfoPopup({ isOpen, onClose, pCode }: { isOpen: boolean, onClose: () => void, pCode: string }) {
    if (!isOpen) return null;
    
    const rows = [
        { label: '실재고', style: 'text-gray-900' },
        { label: '가용재고', style: 'text-blue-700' },
        { label: '예약재고', style: 'text-red-600' },
        { label: '수불재고', style: 'text-gray-900 font-bold' },
    ];

    const displayStores = STORE_CODES.slice(0, 25); 

    return (
       <DraggableModal isOpen={isOpen} onClose={onClose} title="재고정보" width={1100} defaultTop={150}>
             <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
                <div className="font-bold text-blue-800 text-[13px] ml-1 bg-blue-50/30 p-2 inline-block border border-blue-100 rounded-[2px]">
                    상품코드: {pCode || '-'}
                </div>
                
                <div className="flex-1 overflow-auto border border-gray-400 custom-scrollbar bg-white">
                    <Table className="table-fixed border-collapse min-w-[2200px] text-[11px]">
                        <TableHeader className="bg-[#f4f4f4] sticky top-0 z-20 shadow-[0_1px_0_0_#d1d5db]">
                            <TableRow className="h-8">
                                <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-400 sticky left-0 bg-[#eef3f8] z-30 shadow-[1px_1px_0_0_#9ca3af]">재고구분</TableHead>
                                {displayStores.map(s => (
                                    <TableHead key={s.code} className="w-[85px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 truncate bg-[#f4f4f4]" title={s.name}>
                                        {s.name.replace('점', '').replace('스토어', '')}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, rIdx) => (
                                <TableRow key={row.label} className={cn("h-9 hover:bg-blue-50/50 bg-white transition-colors", rIdx === rows.length - 1 ? "" : "border-b border-gray-200")}>
                                    <TableCell className="text-center font-bold text-gray-800 border-r border-gray-400 sticky left-0 bg-[#f9f9f9] z-10 shadow-[1px_0_0_0_#9ca3af] tracking-wide">
                                        {row.label}
                                    </TableCell>
                                    {displayStores.map((s, cIdx) => {
                                        let val = 0;
                                        if (s.name === '광화문점' || s.name === '파주센터' || s.name === '강남점' || s.name === '영등포점') val = 1;
                                        else if (cIdx % 3 === 0) val = 1;
                                        if (s.name === '파주센터') val = 6;
                                        
                                        if (row.label === '예약재고') val = 0; 
                                        if (row.label === '가용재고' && s.name === '파주센터') val = 5;
                                        if (row.label === '수불재고' && s.name === '파주센터') val = 6;

                                        return (
                                            <TableCell key={s.code} className={cn("text-center border-r border-gray-200 text-[13px]", row.style)}>
                                                {val}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
             </div>
             <div className="erp-modal-footer mt-1">
                 <Button className="h-8 px-10 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px] font-bold" onClick={onClose}>x 닫기</Button>
             </div>
       </DraggableModal>
    );
}

// ★ 5. 상품상세정보 신규 팝업
function ProductDetailPopup({ isOpen, onClose, pCode, pName }: any) {
    if (!isOpen) return null;
    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} title="상품상세정보" width={650} defaultTop={100}>
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-6 bg-[#f9f9f9] p-2.5 border border-gray-300 rounded-[2px] font-bold text-[13px] text-gray-800">
                    <span>• 상품코드: <span className="text-blue-700 ml-1">[ {pCode || '-'} ]</span></span>
                    <span>• 상품명: <span className="text-blue-700 ml-1">[ {pName || '-'} ]</span></span>
                </div>
                <div className="flex gap-4 h-[350px]">
                    <div className="w-[200px] border border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-[13px] shadow-inner rounded-[2px]">
                        [ 상품 이미지 영역 ]
                    </div>
                    <div className="flex-1 flex flex-col border border-gray-300 overflow-hidden">
                        <div className="erp-section-toolbar border-b border-gray-300"><span className="erp-section-title">상품해제</span></div>
                        <div className="p-4 bg-white flex-1 overflow-y-auto text-gray-700 leading-relaxed text-[12px] custom-scrollbar">
                            [ 상품 해제 텍스트 영역 ]<br/><br/>
                            해당 상품에 대한 상세 설명 및 부가 정보가 노출되는 영역입니다.<br/><br/>
                            (요청에 의해 상세 텍스트 생략됨)
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-1 pt-3 border-t border-gray-200">
                    <Button className="h-7 px-8 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px] font-bold" onClick={onClose}>x 닫기</Button>
                </div>
            </div>
        </DraggableModal>
    );
}

// ★ 6. 서가정보조회(로케이션정보) 신규 팝업
function LocationInfoPopup({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;
    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} title="서가정보조회" width={750} defaultTop={150}>
            <div className="p-4 flex flex-col gap-2">
                <div className="erp-section-toolbar mb-1"><span className="erp-section-title">서가정보조회</span></div>
                <div className="h-[250px] overflow-auto border border-gray-300 bg-white">
                    <Table className="table-fixed w-full border-collapse text-[11px]">
                        <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                            <TableRow className="h-8">
                                <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">서가번호</TableHead>
                                <TableHead className="text-center font-bold text-gray-900 border-r border-gray-300">서가명</TableHead>
                                <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">단번호</TableHead>
                                <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300">단명</TableHead>
                                <TableHead className="w-[100px] text-center font-bold text-gray-900 border-gray-300">상품등록일</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="h-7 hover:bg-blue-50 bg-white border-b border-gray-200">
                                <TableCell className="text-center border-r border-gray-200">100092</TableCell>
                                <TableCell className="text-left border-r border-gray-200 pl-2 truncate text-gray-800 font-medium">코너 통로쪽 종합 베스...</TableCell>
                                <TableCell className="text-center border-r border-gray-200 text-blue-700 font-bold">01</TableCell>
                                <TableCell className="text-left border-r border-gray-200 pl-2 truncate text-gray-800 font-medium">주간 베스트(1~20위)</TableCell>
                                <TableCell className="text-center">2026-01-28</TableCell>
                            </TableRow>
                            <TableRow className="h-7 hover:bg-blue-50 bg-white border-b border-gray-200">
                                <TableCell className="text-center border-r border-gray-200">100099</TableCell>
                                <TableCell className="text-left border-r border-gray-200 pl-2 truncate text-gray-800 font-medium">문학 광고도서</TableCell>
                                <TableCell className="text-center border-r border-gray-200 text-blue-700 font-bold">03</TableCell>
                                <TableCell className="text-left border-r border-gray-200 pl-2 truncate text-gray-800 font-medium">종로출구(평대광고1~3...</TableCell>
                                <TableCell className="text-center">2026-01-22</TableCell>
                            </TableRow>
                            <TableRow className="h-7 hover:bg-blue-50 bg-white border-b border-gray-200">
                                <TableCell className="text-center border-r border-gray-200">100200</TableCell>
                                <TableCell className="text-left border-r border-gray-200 pl-2 truncate text-gray-800 font-medium">한국소설 베스트</TableCell>
                                <TableCell className="text-center border-r border-gray-200 text-blue-700 font-bold">00</TableCell>
                                <TableCell className="text-left border-r border-gray-200 pl-2 truncate text-gray-800 font-medium">한국소설 베스트</TableCell>
                                <TableCell className="text-center">2026-02-10</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-center pt-2 mt-1 border-t border-gray-200">
                    <Button className="h-7 px-8 text-[12px] bg-[#555555] text-white hover:bg-[#444444] rounded-[2px] font-bold" onClick={onClose}>x 닫기</Button>
                </div>
            </div>
        </DraggableModal>
    );
}

// 사원조회 공통 팝업
function EmployeeSearchModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (code: string, name: string) => void }) {
    if (!isOpen) return null;
    return (
       <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[4px] shadow-2xl w-[400px] flex flex-col overflow-hidden text-[12px] font-sans border border-gray-400">
             <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
                <span className="font-bold text-[13px]">사원 조회</span>
                <button onClick={onClose} className="hover:text-red-400"><X className="w-4 h-4" /></button>
             </div>
             <div className="p-4 flex flex-col gap-2 bg-[#fefefe]">
                <Table className="table-fixed w-full border-collapse border border-gray-300 text-[11px]">
                    <TableHeader className="bg-[#f4f4f4]">
                        <TableRow className="h-8">
                            <TableHead className="text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">사원번호</TableHead>
                            <TableHead className="text-center font-bold text-gray-900 border-b border-gray-300 p-1">사원명</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="h-7 cursor-pointer hover:bg-blue-50 bg-white" onClick={() => { onSelect('SYS_01', '관리자'); onClose(); }}>
                            <TableCell className="text-center border-r border-b border-gray-200">SYS_01</TableCell>
                            <TableCell className="text-center border-b border-gray-200 font-bold">관리자</TableCell>
                        </TableRow>
                        <TableRow className="h-7 cursor-pointer hover:bg-blue-50 bg-white" onClick={() => { onSelect('12951', '홍지희'); onClose(); }}>
                            <TableCell className="text-center border-r border-b border-gray-200">12951</TableCell>
                            <TableCell className="text-center border-b border-gray-200 font-bold">홍지희</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
             </div>
          </div>
       </div>
    );
}

export default function ProductInfoMainPage() {
  const { products, suppliers } = useMockData();

  const [integratedSearch, setIntegratedSearch] = useState('');
  const [isMultiSearch, setIsMultiSearch] = useState(false);
  const [isSearchSetting, setIsSearchSetting] = useState(false);
  const [store, setStore] = useState('001');

  // 상품정보 상태
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [productStatus, setProductStatus] = useState('');
  const [artist, setArtist] = useState('');
  const [albumType, setAlbumType] = useState('');
  
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierItemCode, setSupplierItemCode] = useState('');
  const [supplierType, setSupplierType] = useState('');
  const [category, setCategory] = useState('');
  
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');
  const [brand, setBrand] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  
  const [listPrice, setListPrice] = useState('');
  const [salesPrice, setSalesPrice] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [currencyCode, setCurrencyCode] = useState('WON');

  const [empCode, setEmpCode] = useState('');
  const [empName, setEmpName] = useState('');

  // 기타 정보 상태
  const [reservation, setReservation] = useState('none');
  const [reservedInventory, setReservedInventory] = useState('none');
  const [eventInfo, setEventInfo] = useState('none');
  const [statusNote, setStatusNote] = useState('');
  const [commonNote, setCommonNote] = useState('');
  const [subulStore, setSubulStore] = useState('');
  const [productNote, setProductNote] = useState('');

  // 팝업 제어
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  
  const [isIntegratedSearchOpen, setIsIntegratedSearchOpen] = useState(false);
  const [isSalesPopupOpen, setIsSalesPopupOpen] = useState(false);
  const [isSubulPopupOpen, setIsSubulPopupOpen] = useState(false);
  const [isInvPopupOpen, setIsInvPopupOpen] = useState(false);
  const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false);
  const [isLocationPopupOpen, setIsLocationPopupOpen] = useState(false);

  const handleSearchReset = () => {
      setIntegratedSearch('');
      setIsMultiSearch(false); setIsSearchSetting(false);
      setProductCode(''); setProductName(''); setProductStatus(''); setArtist(''); setAlbumType('');
      setSupplierCode(''); setSupplierName(''); setSupplierItemCode(''); setSupplierType(''); setCategory('');
      setPhone(''); setFax(''); setBrand(''); setGroupCode(''); setReleaseDate('');
      setListPrice(''); setSalesPrice(''); setExpectedPrice(''); setEffectiveDate(''); setCurrencyCode('WON');
      setEmpCode(''); setEmpName('');
      setStatusNote(''); setCommonNote(''); setSubulStore(''); setProductNote('');
  };

  const loadProductData = (p: any) => {
      setProductCode(p.productCode);
      setProductName(p.productName);
      setProductStatus(p.productStatus);
      setArtist(p.artistName || '');
      setAlbumType(p.media || '');
      setSupplierCode(p.supplierCode);
      setSupplierName(p.supplierName);
      setSupplierType(p.purchaseType);
      setCategory(p.productCategory);
      setGroupCode(p.groupCategory);
      setReleaseDate(p.releaseDate || '');
      setListPrice(String(p.listPrice));
      setSalesPrice(String(p.listPrice)); 
  };

  const handleIntegratedSearchSubmit = () => {
      if (!integratedSearch.trim()) return;
      const exactMatch = (products || []).find(p => p.productCode === integratedSearch.trim());
      if (exactMatch) {
          loadProductData(exactMatch);
      } else {
          setIsIntegratedSearchOpen(true);
      }
  };

  const handleProductSearch = () => {
      if (!productCode.trim()) { setIsProductModalOpen(true); return; }
      const exactMatches = (products || []).filter(p => p.productCode === productCode.trim());
      if (exactMatches.length === 1) loadProductData(exactMatches[0]);
      else setIsProductModalOpen(true);
  };

  const handleSupplierSearch = () => {
      if (!supplierCode.trim()) { setIsSupplierModalOpen(true); return; }
      const exactMatches = (suppliers || []).filter(s => s.code === supplierCode.trim());
      if (exactMatches.length === 1) setSupplierName(exactMatches[0].name); 
      else setIsSupplierModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#fefdfb] p-4 text-[12px] font-sans overflow-hidden gap-4">
      <div className="flex items-center justify-between flex-shrink-0 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-red-600"></div>
            <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">상품안내Main(문구/음반)</h2>
          </div>
          <div className="flex gap-1">
              <Button variant="outline" className={headerBtnClass} onClick={handleSearchReset}>초기화(F3)</Button>
              <Button variant="outline" className={headerBtnClass} onClick={() => alert('조회되었습니다.')}>조회(F4)</Button>
          </div>
      </div>

      <div className="flex flex-col border border-gray-300 bg-[#fefefe] flex-shrink-0">
          <div className="flex items-center p-2 gap-2 border-b border-gray-200">
              <span className="font-bold text-blue-700 ml-2">통합검색</span>
              <div className="flex-1 max-w-[500px]">
                  <Input 
                      className="h-7 w-full text-[12px] rounded-[2px] border-blue-400 focus-visible:ring-blue-500" 
                      value={integratedSearch} 
                      onChange={(e) => setIntegratedSearch(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleIntegratedSearchSubmit()}
                      placeholder="상품코드, 명칭 입력 후 Enter (일부 입력 시 팝업창 호출)" 
                  />
              </div>
              <div className="flex items-center gap-3 ml-2 border-l border-gray-300 pl-3">
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-700">
                      <Checkbox 
                          checked={isMultiSearch} 
                          onCheckedChange={(c) => { setIsMultiSearch(!!c); if(c) setIsSearchSetting(false); }} 
                          className="h-4 w-4 rounded-[2px]" 
                      /> 다중조회
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-gray-700">
                      <Checkbox 
                          checked={isSearchSetting} 
                          onCheckedChange={(c) => { setIsSearchSetting(!!c); if(c) setIsMultiSearch(false); }} 
                          className="h-4 w-4 rounded-[2px]" 
                      /> 조회설정
                  </label>
              </div>
          </div>
          <div className="flex items-center p-2 gap-1 bg-white">
              <Button variant="outline" className="h-7 px-3 text-[12px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 font-bold" onClick={() => { if(!productCode) return alert('상품을 먼저 검색하세요.'); setIsSalesPopupOpen(true); }}>상품판매집계</Button>
              <Button variant="outline" className="h-7 px-3 text-[12px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 font-bold" onClick={() => { if(!productCode) return alert('상품을 먼저 검색하세요.'); setIsSubulPopupOpen(true); }}>수불조회</Button>
              <Button variant="outline" className="h-7 px-3 text-[12px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 font-bold" onClick={() => { if(!productCode) return alert('상품을 먼저 검색하세요.'); setIsDetailPopupOpen(true); }}>상품상세정보</Button>
              <Button variant="outline" className="h-7 px-3 text-[12px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 font-bold" onClick={() => setIsLocationPopupOpen(true)}>로케이션정보이력</Button>
              <Button variant="outline" className="h-7 px-3 text-[12px] bg-white border-gray-400 text-gray-700 hover:bg-gray-100 font-bold" onClick={() => setIsLocationPopupOpen(true)}>로케이션정보</Button>
          </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-4">
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar min-w-[900px]">
              
              <div className="erp-section-group flex-shrink-0">
               <div className="erp-section-toolbar">
                  <span className="erp-section-title">상품정보</span>
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">점포</span>
                      <Select value={store} onValueChange={setStore}>
                         <SelectTrigger className="h-6 w-[150px] text-[11px] rounded-[2px] border-gray-300 bg-white"><SelectValue placeholder="선택" /></SelectTrigger>
                         <SelectContent className="max-h-[300px]">
                             {STORE_CODES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                         </SelectContent>
                      </Select>
                  </div>
               </div>
              <div className="border border-gray-300 bg-[#fefefe]">
                  <div className="grid grid-cols-[90px_1fr_90px_1fr_90px_1fr_90px_1fr] border-b border-gray-200">
                      <Label className="border-r border-gray-200">상품코드</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative col-span-3">
                          <Input className="h-6 w-32 text-[11px] rounded-[2px] border-gray-300 font-bold" value={productCode} onChange={(e) => setProductCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductSearch()} />
                          <div className="flex-1 relative flex items-center">
                              <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-[#fefefe] pr-6" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (!productName.trim()) { setIsProductModalOpen(true); return; } const nm = (products || []).filter(p => String(p.productName||'').includes(productName.trim())); if (nm.length === 1) loadProductData(nm[0]); else setIsProductModalOpen(true); }}} />
                              <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsProductModalOpen(true)} />
                          </div>
                      </div>
                      <Label className="border-r border-gray-200">상품상태</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 font-bold text-blue-700" value={productStatus} readOnly /></div>
                      <div className="col-span-2 bg-white"></div>
                  </div>

                  <div className="grid grid-cols-[90px_1fr_90px_1fr_90px_1fr_90px_1fr] border-b border-gray-200">
                      <Label className="border-r border-gray-200">가수</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={artist} readOnly /></div>
                      <Label className="border-r border-gray-200">음반종류</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={albumType} readOnly /></div>
                      <Label className="border-r border-gray-200">상품분류</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={category} readOnly /></div>
                      <Label className="border-r border-gray-200">조코드</Label>
                      <div className="flex items-center p-1 gap-1"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 font-bold" value={groupCode} readOnly /></div>
                  </div>

                  <div className="grid grid-cols-[90px_1fr_90px_1fr_90px_1fr_90px_1fr] border-b border-gray-200">
                      <Label className="border-r border-gray-200">매입처</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative col-span-3">
                          <Input className="h-6 w-20 text-[11px] rounded-[2px] border-gray-300" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSupplierSearch()} />
                          <div className="w-[180px] relative flex items-center">
                              <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-gray-50 pr-6" value={supplierName} readOnly />
                              <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={handleSupplierSearch} />
                          </div>
                          <div className="flex items-center gap-1 ml-auto mr-1">
                              <Button variant="outline" className="h-6 px-2 text-[10px] bg-white border-gray-400 text-red-600 hover:bg-red-50">지역총판삭제</Button>
                              <Button variant="outline" className="h-6 px-2 text-[10px] bg-white border-gray-400 text-blue-600 hover:bg-blue-50">지역총판등록</Button>
                          </div>
                      </div>
                      <Label className="border-r border-gray-200">매입처구분</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={supplierType} readOnly /></div>
                      <Label className="border-r border-gray-200">매입처품목</Label>
                      <div className="flex items-center p-1 gap-1"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={supplierItemCode} onChange={(e) => setSupplierItemCode(e.target.value)} /></div>
                  </div>

                  <div className="grid grid-cols-[90px_1fr_90px_1fr_90px_1fr_90px_1fr] border-b border-gray-200">
                      <Label className="border-r border-gray-200">전화번호</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                      <Label className="border-r border-gray-200">Fax</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={fax} onChange={(e) => setFax(e.target.value)} /></div>
                      <Label className="border-r border-gray-200">브랜드</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
                      <Label className="border-r border-gray-200">출시일자</Label>
                      <div className="flex items-center p-1 gap-1"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300" value={releaseDate} readOnly /></div>
                  </div>

                  <div className="grid grid-cols-[90px_1fr_90px_1fr_90px_1fr_90px_1fr] bg-blue-50/20">
                      <Label className="border-r border-gray-200 bg-blue-50/50">정가</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 text-right font-bold bg-white" value={listPrice ? Number(listPrice).toLocaleString() : ''} readOnly /></div>
                      <Label className="border-r border-gray-200 bg-blue-50/50">판매정가</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 text-right font-bold text-blue-700 bg-white" value={salesPrice ? Number(salesPrice).toLocaleString() : ''} onChange={(e) => setSalesPrice(e.target.value.replace(/[^0-9]/g, ''))} /></div>
                      <Label className="border-r border-gray-200 bg-blue-50/50">화폐코드</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                          <Select value={currencyCode} onValueChange={setCurrencyCode}>
                             <SelectTrigger className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-white"><SelectValue placeholder="WON" /></SelectTrigger>
                             <SelectContent><SelectItem value="WON">WON</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EURO</SelectItem></SelectContent>
                          </Select>
                      </div>
                      <div className="col-span-2"></div>
                  </div>
              </div>
              </div>

              <div className="erp-section-group flex-shrink-0">
                 <div className="erp-section-toolbar">
                     <div className="erp-section-title">로케이션정보</div>
                 </div>
                 <div className="border border-gray-300 bg-[#fefefe]">
                 <div className="grid grid-cols-[80px_1fr_60px_80px_1fr_60px] border-b border-gray-200">
                     <Label className="border-r border-gray-200">로케이션1</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="flex items-center justify-center border-r border-gray-200"><Button variant="outline" className="h-6 px-2 text-[10px]">수정</Button></div>
                     <Label className="border-r border-gray-200">로케이션2</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="flex items-center justify-center"><Button variant="outline" className="h-6 px-2 text-[10px]">수정</Button></div>
                 </div>
                 <div className="grid grid-cols-[80px_1fr_60px_80px_1fr_60px] border-b border-gray-200">
                     <Label className="border-r border-gray-200">단1</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="border-r border-gray-200 bg-gray-50"></div>
                     <Label className="border-r border-gray-200">단2</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="bg-gray-50"></div>
                 </div>
                 <div className="grid grid-cols-[80px_1fr_60px_80px_1fr_60px] border-b border-gray-200">
                     <Label className="border-r border-gray-200">로케이션3</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="flex items-center justify-center border-r border-gray-200"><Button variant="outline" className="h-6 px-2 text-[10px]">수정</Button></div>
                     <Label className="border-r border-gray-200">로케이션4</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="flex items-center justify-center"><Button variant="outline" className="h-6 px-2 text-[10px]">수정</Button></div>
                 </div>
                 <div className="grid grid-cols-[80px_1fr_60px_80px_1fr_60px]">
                     <Label className="border-r border-gray-200">단3</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="border-r border-gray-200 bg-gray-50"></div>
                     <Label className="border-r border-gray-200">단4</Label>
                     <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-gray-50" readOnly /></div>
                     <div className="bg-gray-50"></div>
                 </div>
                 </div>
              </div>

              <div className="erp-section-group flex-shrink-0">
                 <div className="erp-section-toolbar">
                    <div className="erp-section-title">재고 및 물류정보</div>
                 </div>
                 <div className="flex flex-col border border-gray-300 bg-white">
                  <div className="overflow-auto">
                     <Table className="table-fixed w-full border-collapse text-[11px]">
                         <TableHeader className="bg-[#f4f4f4] shadow-[0_1px_0_0_#d1d5db]">
                             <TableRow className="h-8">
                                 <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">이전발주의뢰</TableHead>
                                 <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">최종입하</TableHead>
                                 <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">최근반입</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">7일판매</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">안전재고</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">공용재고</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-blue-50">실재고</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-blue-50">가용재고</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1 bg-blue-50">예약재고</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">수불재고</TableHead>
                                 <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-b border-gray-300 p-1">파주재고</TableHead>
                                 <TableHead className="w-[100px] text-center font-bold text-gray-900 border-b border-gray-300 p-1">리드타임일수</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             <TableRow className="h-8 bg-white">
                                 <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">-</TableCell>
                                 <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">-</TableCell>
                                 <TableCell className="text-center p-1 border-r border-gray-200 text-gray-500">-</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-3">0</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-3">0</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-3">0</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-blue-700 pr-3 bg-blue-50/20">15</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-blue-700 pr-3 bg-blue-50/20">15</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 font-bold text-red-600 pr-3 bg-blue-50/20">0</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-3">15</TableCell>
                                 <TableCell className="text-right p-1 border-r border-gray-200 text-gray-600 pr-3">50</TableCell>
                                 <TableCell className="text-center p-1 text-gray-600">2</TableCell>
                             </TableRow>
                         </TableBody>
                     </Table>
                  </div>
                  <div className="grid grid-cols-[100px_1fr_100px_1.5fr_120px_1fr_auto] border-t border-gray-300">
                      <Label className="border-r border-gray-200 border-b-0 h-8">발주의뢰일자</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-white border-gray-300" readOnly /></div>
                      
                      <Label className="border-r border-gray-200 border-b-0 h-8">발주책임자</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 relative">
                          <Input className="h-6 w-16 text-[11px] rounded-[2px] border-gray-300 bg-white" value={empCode} onChange={(e) => setEmpCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setIsEmpModalOpen(true)} />
                          <div className="flex-1 relative flex items-center">
                              <Input className="h-6 w-full text-[11px] rounded-[2px] border-gray-300 bg-gray-50 pr-6" value={empName} readOnly />
                              <Search className="absolute right-1.5 h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800" onClick={() => setIsEmpModalOpen(true)} />
                          </div>
                      </div>
                      
                      <Label className="border-r border-gray-200 border-b-0 h-8">물류사용단위/수량</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200"><Input className="h-6 w-full text-[11px] bg-white border-gray-300 font-bold text-blue-700" value="DZ / 12" readOnly /></div>
                      
                      <div className="flex items-center px-2 gap-1 bg-white">
                          <Button variant="outline" className="h-6 px-3 text-[11px] bg-yellow-50 hover:bg-yellow-100 border-gray-400 text-gray-800 font-bold" onClick={() => alert('자동발주예외 등록 화면으로 이동합니다.')}>자동발주예외 등록</Button>
                          <Button variant="outline" className="h-6 px-3 text-[11px] bg-blue-50 hover:bg-blue-100 border-blue-400 text-blue-800 font-bold" onClick={() => setIsInvPopupOpen(true)}>재고정보</Button>
                      </div>
                  </div>
              </div>
              </div>

              <div className="erp-section-group flex-shrink-0 mb-4">
               <div className="erp-section-toolbar">
                  <span className="erp-section-title">기타</span>
               </div>
              <div className="flex flex-col border border-gray-300 bg-[#fefefe]">
                  <div className="grid grid-cols-[100px_1fr_100px_1fr_100px_1fr] border-b border-gray-200">
                      <Label className="border-r border-gray-200">고객예약</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 pr-2">
                          <Select value={reservation} onValueChange={setReservation}>
                              <SelectTrigger className="h-6 flex-1 text-[11px]"><SelectValue placeholder="예약내역 선택" /></SelectTrigger>
                              <SelectContent><SelectItem value="none">내역 없음</SelectItem><SelectItem value="R001">RV001 - 김철수</SelectItem></SelectContent>
                          </Select>
                          <Button variant="outline" className="h-6 px-2 text-[10px] bg-white font-bold whitespace-nowrap" onClick={() => alert('고객예약등록 화면으로 이동합니다.')}>고객예약</Button>
                      </div>
                      <Label className="border-r border-gray-200">예약재고</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 pr-2">
                          <Select value={reservedInventory} onValueChange={setReservedInventory}>
                              <SelectTrigger className="h-6 flex-1 text-[11px]"><SelectValue placeholder="구분별 수량" /></SelectTrigger>
                              <SelectContent><SelectItem value="none">내역 없음</SelectItem><SelectItem value="V01">일반예약 - 10개</SelectItem></SelectContent>
                          </Select>
                          <Button variant="outline" className="h-6 px-2 text-[10px] bg-white font-bold whitespace-nowrap" onClick={() => alert('예약재고등록해제 화면으로 이동합니다.')}>예약재고</Button>
                      </div>
                      <Label className="border-r border-gray-200">행사정보</Label>
                      <div className="flex items-center p-1 gap-1 pr-2">
                          <Select value={eventInfo} onValueChange={setEventInfo}>
                              <SelectTrigger className="h-6 flex-1 text-[11px]"><SelectValue placeholder="행사내역" /></SelectTrigger>
                              <SelectContent><SelectItem value="none">등록 내역 없음</SelectItem><SelectItem value="E01">신학기 기획전</SelectItem></SelectContent>
                          </Select>
                          <Button variant="outline" className="h-6 px-2 text-[10px] bg-white font-bold whitespace-nowrap" onClick={() => alert('행사정보등록 화면으로 이동합니다.')}>행사정보</Button>
                      </div>
                  </div>

                  <div className="grid grid-cols-[100px_1fr_100px_1.5fr] border-b border-gray-200">
                      <Label className="border-r border-gray-200">상품위치</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200">
                          <Input className="h-6 w-full text-[11px] font-bold text-blue-700 bg-blue-50/30" value="당일: 입하(0), 출하대기(0), 출하(0)" readOnly />
                      </div>
                      <Label className="border-r border-gray-200">상품판매채널</Label>
                      <div className="flex items-center p-1 px-4 gap-6">
                          <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"><Checkbox checked disabled className="h-3.5 w-3.5 rounded-[2px]" /> 오프라인(매장)</label>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"><Checkbox checked disabled className="h-3.5 w-3.5 rounded-[2px]" /> 온라인(인터넷)</label>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"><Checkbox checked disabled className="h-3.5 w-3.5 rounded-[2px]" /> B2B</label>
                      </div>
                  </div>

                  <div className="flex items-stretch">
                      <Label className="border-r border-gray-200 bg-yellow-50/30 w-[100px] flex-shrink-0">상품상태비고</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 flex-1">
                          <Input className="h-6 w-full text-[11px] focus-visible:ring-1 focus-visible:ring-blue-500" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                      </div>
                      <Label className="border-r border-gray-200 bg-yellow-50/30 w-[60px] flex-shrink-0">공통</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 flex-1">
                          <Input className="h-6 w-full text-[11px] focus-visible:ring-1 focus-visible:ring-blue-500" value={commonNote} onChange={(e) => setCommonNote(e.target.value)} />
                      </div>
                      <Label className="border-r border-gray-200 w-[70px] flex-shrink-0">수불처</Label>
                      <div className="flex items-center p-1 gap-1 border-r border-gray-200 flex-1">
                          <Input className="h-6 w-full text-[11px] focus-visible:ring-1 focus-visible:ring-blue-500" value={subulStore} onChange={(e) => setSubulStore(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-1 px-2 flex-shrink-0 bg-white">
                          <Button className="erp-btn-action" onClick={() => alert('상품상태비고 및 공통 정보가 저장되었습니다.')}>저장</Button>
                          <Button variant="outline" className="h-6 px-3 text-[11px] bg-blue-50 hover:bg-blue-100 border-blue-400 text-blue-800 font-bold rounded-[2px]" onClick={() => { if(!productCode) return alert('상품을 먼저 검색하세요.'); setIsInvPopupOpen(true); }}>재고정보</Button>
                          <Button variant="outline" className="h-6 px-3 text-[11px] bg-white hover:bg-gray-100 border-gray-400 text-gray-800 font-bold rounded-[2px]" onClick={() => alert('상품비고')}>상품비고</Button>
                      </div>
                  </div>
              </div>
              </div>
          </div>

          <div className="w-[320px] flex flex-col gap-3 flex-shrink-0">
             <div className="border border-gray-300 bg-white h-[280px] flex flex-col overflow-hidden">
                <div className="flex items-center p-2 border-b border-gray-300">
                    <span className="font-bold text-[13px] text-gray-900">상품 이미지</span>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-bold border-t border-gray-200">
                    이미지 등록 없음
                </div>
             </div>

             <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-[200px]">
                <div className="flex items-center gap-2 p-2 border-b border-gray-300">
                   <div className="w-5 h-5 bg-indigo-600 text-white flex items-center justify-center rounded-full font-bold text-[10px]">P</div>
                   <h3 className="text-[13px] font-bold text-gray-900">구매팀 알림</h3>
                </div>
                <div className="p-3 flex-1 bg-yellow-50/50 text-[12px] text-gray-800 leading-relaxed overflow-y-auto">
                   해당 상품은 공급사 사정으로 인해 단종 예정이오니, 추가 발주 시 유의하여 주시기 바랍니다.<br/><br/>
                   * 유통기한 임박 상품 재고 확인 요망 (2026-03-01)
                </div>
             </div>
          </div>
      </div>

      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} initialSearchName={productName || productCode} onSelect={(item) => { loadProductData(item); }} />
      <SupplierSearchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} initialSearchName={supplierName || supplierCode} onSelect={(item) => { setSupplierCode(item.code); setSupplierName(item.name); }} />
      <EmployeeSearchModal isOpen={isEmpModalOpen} onClose={() => setIsEmpModalOpen(false)} onSelect={(code, name) => { setEmpCode(code); setEmpName(name); }} />
      
      <IntegratedSearchPopup isOpen={isIntegratedSearchOpen} onClose={() => setIsIntegratedSearchOpen(false)} query={integratedSearch} onSelect={loadProductData} keepOpen={isSearchSetting} products={products} />
      <SalesAggregationPopup isOpen={isSalesPopupOpen} onClose={() => setIsSalesPopupOpen(false)} initialPCode={productCode} initialPName={productName} initialListPrice={listPrice} initialSupplierName={supplierName} initialReleaseDate={releaseDate} initialGroupCode={groupCode} initialArtist={artist} products={products} />
      <InventoryTransactionPopup isOpen={isSubulPopupOpen} onClose={() => setIsSubulPopupOpen(false)} pCode={productCode} />
      <InventoryInfoPopup isOpen={isInvPopupOpen} onClose={() => setIsInvPopupOpen(false)} pCode={productCode} />
      <ProductDetailPopup isOpen={isDetailPopupOpen} onClose={() => setIsDetailPopupOpen(false)} pCode={productCode} pName={productName} />
      <LocationInfoPopup isOpen={isLocationPopupOpen} onClose={() => setIsLocationPopupOpen(false)} />
    </div>
  );
}