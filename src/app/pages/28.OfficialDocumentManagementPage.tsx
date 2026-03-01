import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Download, Upload, Printer, Plus, X, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Table as TableIcon 
} from 'lucide-react';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../../lib/utils';
import { format, subMonths } from 'date-fns';
import { useMockData } from '../../context/MockDataContext';
import { SupplierSearchModal } from '../components/SupplierSearchModal';

// -------------------------------------------------------------------
// 공통 헬퍼 컴포넌트
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
// 템플릿 상수
// -------------------------------------------------------------------
const TEMPLATE_AGREEMENT = `<div style="padding: 10px;"><h2 style="text-align: center;">물품 공급 약정서</h2><p>교보핫트랙스(주)와 [매입처명]은 다음과 같이 약정한다.</p></div>`;
const TEMPLATE_GENERAL = `<div style="padding: 10px;"><h2 style="text-align: center;">일반 협조 공문</h2><p>귀사의 무궁한 발전을 기원합니다.</p></div>`;

// -------------------------------------------------------------------
// 데이터 타입 정의
// -------------------------------------------------------------------
type OfficialDoc = {
    id: string;
    docNo: string;
    docType: string;
    docName: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    regDate: string;
    hasFile: boolean;
    content?: string; // 에디터 내용 저장용
};

export default function OfficialDocumentManagementPage() {
  const { suppliers } = useMockData();

  const [sDocType, setSDocType] = useState('전체');
  const [sStatus, setSStatus] = useState('전체');
  const [sDateStart, setSDateStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [sDateEnd, setSDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // ★ SCM 매입처 조회
  const [scmSupplierCode, setScmSupplierCode] = useState('');
  const [scmSupplierName, setScmSupplierName] = useState('');
  const [isScmSuppModalOpen, setIsScmSuppModalOpen] = useState(false);

  const [gridData, setGridData] = useState<OfficialDoc[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const initialForm = { id: '', docType: '약정서', docName: '', start: '', end: '' };
  const [form, setForm] = useState(initialForm);

  // --- 에디터 도구 ---
  const formatDoc = (cmd: string, value?: string) => {
      document.execCommand(cmd, false, value);
      editorRef.current?.focus();
  };

  const insertTable = () => {
      const tableHTML = `<br/><table style="width:100%; border-collapse: collapse; border: 1px solid #ccc;"><tr><td style="border: 1px solid #ccc; padding: 8px;">내용</td><td style="border: 1px solid #ccc; padding: 8px;">내용</td></tr></table><br/>`;
      document.execCommand('insertHTML', false, tableHTML);
  };

  // -------------------------------------------------------------------
  // 채번 접두어 매핑 (공문서구분별)
  // -------------------------------------------------------------------
  const DOC_PREFIX_MAP: Record<string, string> = {
      '약정서': 'AG',       // Agreement
      '일반공문서': 'GD',   // General Document
  };

  // -------------------------------------------------------------------
  // 핸들러 함수
  // -------------------------------------------------------------------
  const handleSearch = () => {
      if (!scmSupplierCode) {
          alert('매입처를 먼저 조회해주세요.');
          return;
      }
      const suppName = scmSupplierName || scmSupplierCode;
      const mockData: OfficialDoc[] = [
          { id: '1', docNo: 'AG20260228-0001', docType: '약정서', docName: `2026년도 상반기 ${suppName} 공급 약정`, periodStart: '2026-03-01', periodEnd: '2026-08-31', status: '완료', regDate: '2026-02-28', hasFile: true, content: TEMPLATE_AGREEMENT },
          { id: '2', docNo: 'GD20260228-0002', docType: '일반공문서', docName: `${suppName} 단가 인상에 따른 협조 공문`, periodStart: '2026-04-01', periodEnd: '2026-04-30', status: '진행중', regDate: '2026-02-27', hasFile: false, content: TEMPLATE_GENERAL },
          { id: '3', docNo: 'AG20260115-0003', docType: '약정서', docName: `${suppName} 2025년도 하반기 약정 갱신`, periodStart: '2025-07-01', periodEnd: '2025-12-31', status: '완료', regDate: '2025-01-15', hasFile: true, content: TEMPLATE_AGREEMENT },
      ];
      setGridData(mockData);
      setSelectedRowId(null);
  };

  // 신규 추가 버튼 클릭
  const handleOpenAdd = () => {
      setIsEditMode(false);
      setForm(initialForm);
      setIsModalOpen(true);
      setTimeout(() => {
          if (editorRef.current) editorRef.current.innerHTML = form.docType === '약정서' ? TEMPLATE_AGREEMENT : TEMPLATE_GENERAL;
      }, 50);
  };

  // 행 더블클릭 수정
  const handleRowDoubleClick = (row: OfficialDoc) => {
      setIsEditMode(true);
      setForm({
          id: row.id,
          docType: row.docType,
          docName: row.docName,
          start: row.periodStart,
          end: row.periodEnd
      });
      setIsModalOpen(true);
      setTimeout(() => {
          if (editorRef.current) editorRef.current.innerHTML = row.content || '';
      }, 50);
  };

  const handleSave = () => {
      if (!form.docName || !form.start || !form.end) return alert('필수 항목을 입력해주세요.');

      const htmlContent = editorRef.current?.innerHTML || '';

      if (isEditMode) {
          setGridData(prev => prev.map(row => 
              row.id === form.id ? { ...row, docType: form.docType, docName: form.docName, periodStart: form.start, periodEnd: form.end, content: htmlContent } : row
          ));
          alert('수정되었습니다.');
      } else {
          const newRow: OfficialDoc = {
              id: Date.now().toString(),
              docNo: `${DOC_PREFIX_MAP[form.docType] || 'D'}${format(new Date(), 'yyyyMMdd')}-${String(Math.floor(Math.random()*1000)).padStart(4, '0')}`,
              docType: form.docType, docName: form.docName, periodStart: form.start, periodEnd: form.end,
              status: '진행중', regDate: format(new Date(), 'yyyy-MM-dd'), hasFile: false, content: htmlContent
          };
          setGridData(prev => [newRow, ...prev]);
          alert('등록되었습니다.');
      }
      setIsModalOpen(false);
  };

  const triggerFileUpload = (id: string) => {
      setUploadTargetId(id);
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && uploadTargetId) {
          setGridData(prev => prev.map(row => row.id === uploadTargetId ? { ...row, hasFile: true, status: '완료' } : row));
          alert('업로드 완료');
      }
      setUploadTargetId(null);
  };

  return (
    <div className="erp-page">
      <div className="erp-page-title">
        <h2>공문서 관리(문구/음반)</h2>
        <span className="text-gray-500 font-normal text-[12px] ml-4 mt-1">
            | 공문서의 조회 및 진행상태를 조회하는 화면입니다.
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-gray-300 rounded-[2px] bg-white px-2 py-1">
            <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap">매입처</span>
            <Input className="h-5 w-[70px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="코드" value={scmSupplierCode} onChange={(e) => setScmSupplierCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierCode.trim()) { const found = suppliers.find(s => s.code === scmSupplierCode.trim()); if (found) setScmSupplierName(found.name); else alert('해당 매처를 찾을 수 없습니다.'); }}} />
            <Input className="h-5 w-[120px] text-[11px] rounded-[2px] border-gray-300 bg-white px-1" placeholder="매입처명" value={scmSupplierName} onChange={(e) => setScmSupplierName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && scmSupplierName.trim()) { const found = suppliers.find(s => s.name.includes(scmSupplierName.trim())); if (found) { setScmSupplierCode(found.code); setScmSupplierName(found.name); } else { alert('해당 매입처를 찾을 수 없습니다.'); } }}} />
            <Search className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-800 flex-shrink-0" onClick={() => setIsScmSuppModalOpen(true)} />
        </div>
      </div>

      {/* 1. 조회부 */}
      <div className="erp-section-group">
       <div className="erp-section-toolbar">
          <div className="erp-section-title">공문서 관리</div>
       </div>
       <div className="border border-gray-300 bg-white">
          <div className="grid grid-cols-[120px_1fr_120px_1fr_120px_1fr] border-b border-gray-300">
             <Label>공문서구분</Label>
             <div className="p-1 border-r border-gray-200"><Select value={sDocType} onValueChange={setSDocType}><SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="전체">전체</SelectItem><SelectItem value="약정서">약정서</SelectItem><SelectItem value="일반공문서">일반공문서</SelectItem></SelectContent></Select></div>
             <Label>진행상태</Label>
             <div className="p-1 border-r border-gray-200"><Select value={sStatus} onValueChange={setSStatus}><SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="전체">전체</SelectItem><SelectItem value="진행중">진행중</SelectItem><SelectItem value="완료">완료</SelectItem></SelectContent></Select></div>
             <Label>등록일</Label>
             <div className="p-1 px-3 flex items-center"><DateRangeInput startVal={sDateStart} endVal={sDateEnd} onStartChange={setSDateStart} onEndChange={setSDateEnd} /></div>
          </div>
          <div className="flex items-center justify-end px-3 py-1.5 gap-1.5 bg-gray-50">
             <Button variant="outline" className="erp-btn-header" onClick={() => { setGridData([]); setSelectedRowId(null); }}>초기화(F3)</Button>
             <Button variant="outline" className="erp-btn-header" onClick={handleSearch}>조회(F4)</Button>
          </div>
       </div>
      </div>

      {/* 2. 그리드부 */}
      <div className="erp-section-group flex-1 flex flex-col min-h-0">
          <div className="erp-section-toolbar">
             <div className="flex items-center gap-2"><span className="erp-section-title">공문서 내역</span><span className="text-gray-500 font-normal text-[11px]">| 행을 더블클릭하면 수정이 가능합니다.</span></div>
             <div className="flex gap-1 pr-1">
                 {/* ★ 출력 버튼: variant="outline" 적용하여 스타일 고정 */}
                 <Button variant="outline" className="erp-btn-action" onClick={() => !selectedRowId && alert('선택하세요')}><Printer className="w-3.5 h-3.5 mr-1"/>출력</Button>
                 <div className="w-[1px] h-4 bg-gray-300 self-center mx-1"></div>
                 <Button variant="outline" className="erp-btn-action" onClick={handleOpenAdd}><Plus className="w-3.5 h-3.5 mr-1"/>추가</Button>
             </div>
          </div>
          
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

          <div className="border border-gray-300 bg-white flex-1 flex flex-col min-h-0">
          <div className="erp-grid-wrapper flex-1">
              <Table className="table-fixed min-w-[1200px] border-collapse text-[11px]">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0 z-10 shadow-[0_1px_0_0_#d1d5db]">
                      <TableRow className="h-8">
                          <TableHead className="w-[40px] text-center border-r border-gray-300 p-0 text-gray-900">선택</TableHead>
                          <TableHead className="w-[150px] text-center font-bold text-gray-900 border-r border-gray-300">계약서번호</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">공문서구분</TableHead>
                          <TableHead className="w-[300px] text-center font-bold text-gray-900 border-r border-gray-300">계약서명</TableHead>
                          <TableHead className="w-[180px] text-center font-bold text-gray-900 border-r border-gray-300">계약기간</TableHead>
                          <TableHead className="w-[80px] text-center font-bold text-gray-900 border-r border-gray-300">진행상태</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">등록일</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900 border-r border-gray-300">업로드</TableHead>
                          <TableHead className="w-[100px] text-center font-bold text-gray-900">다운로드</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {gridData.map((row) => (
                          <TableRow 
                              key={row.id} 
                              className={cn("h-8 border-b border-gray-200 cursor-pointer", selectedRowId === row.id ? "bg-blue-100/50" : "bg-white hover:bg-blue-50/30")}
                              onClick={() => setSelectedRowId(row.id)}
                              onDoubleClick={() => handleRowDoubleClick(row)} // ★ 더블클릭 이벤트 추가
                          >
                              <TableCell className="text-center border-r border-gray-200 p-0" onClick={(e) => e.stopPropagation()}>
                                  <input type="radio" name="docSelect" checked={selectedRowId === row.id} onChange={() => setSelectedRowId(row.id)} />
                              </TableCell>
                              <TableCell className="text-center border-r border-gray-200 font-bold text-gray-800">{row.docNo}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.docType}</TableCell>
                              <TableCell className="text-left border-r border-gray-200 truncate pl-3 font-bold text-gray-800">{row.docName}</TableCell>
                              <TableCell className="text-center border-r border-gray-200">{row.periodStart} ~ {row.periodEnd}</TableCell>
                              <TableCell className="text-center border-r border-gray-200"><span className={cn("px-2 py-0.5 rounded-[2px] font-bold", row.status === '완료' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700")}>{row.status}</span></TableCell>
                              <TableCell className="text-center border-r border-gray-200 text-gray-500">{row.regDate}</TableCell>
                              <TableCell className="text-center border-r border-gray-200 p-1"><Button variant="outline" className="erp-btn-sub w-full h-[22px]" onClick={(e) => { e.stopPropagation(); triggerFileUpload(row.id); }}><Upload className="w-3 h-3 mr-1"/>업로드</Button></TableCell>
                              <TableCell className="text-center p-1">{row.hasFile ? (<Button variant="outline" className="erp-btn-sub w-full h-[22px] bg-blue-50 text-blue-700" onClick={(e) => { e.stopPropagation(); alert('다운로드'); }}><Download className="w-3 h-3 mr-1"/>다운로드</Button>) : (<span className="text-gray-400">-</span>)}</TableCell>
                          </TableRow>
                      ))}
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

      {/* 4. 공문서 작성/수정 통합 팝업 */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="erp-modal w-[800px] h-[750px]">
                  <div className="erp-modal-header">
                      <span>{isEditMode ? '공문서 수정' : '공문서 작성'}(문구/음반)</span>
                      <button onClick={() => setIsModalOpen(false)}><X className="w-4 h-4 text-white" /></button>
                  </div>
                  <div className="p-4 bg-white flex flex-col gap-3 flex-1 overflow-hidden">
                      <div className="grid grid-cols-[100px_1fr] border border-gray-300">
                          <Label className="border-b" required>공문서구분</Label>
                          <div className="p-1 border-b border-gray-200"><Select value={form.docType} onValueChange={v => setForm(p => ({...p, docType: v}))} disabled={isEditMode}><SelectTrigger className="h-6 w-[150px] text-[11px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="약정서">약정서</SelectItem><SelectItem value="일반공문서">일반공문서</SelectItem></SelectContent></Select></div>
                          <Label className="border-b" required>계약서명</Label>
                          <div className="p-1 border-b border-gray-200"><Input className="h-6 w-full text-[11px]" value={form.docName} onChange={e => setForm(p => ({...p, docName: e.target.value}))} /></div>
                          <Label required>계약기간</Label>
                          <div className="p-1 flex items-center px-2"><DateRangeInput startVal={form.start} endVal={form.end} onStartChange={(v: string) => setForm(p => ({...p, start: v}))} onEndChange={(v: string) => setForm(p => ({...p, end: v}))} /></div>
                      </div>

                      {/* 에디터 */}
                      <div className="flex flex-col border border-gray-300 flex-1 overflow-hidden rounded-sm">
                          <div className="flex items-center gap-1 bg-gray-100 border-b border-gray-300 p-1">
                              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => formatDoc('bold')}><Bold className="w-3.5 h-3.5"/></Button>
                              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => formatDoc('italic')}><Italic className="w-3.5 h-3.5"/></Button>
                              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => formatDoc('underline')}><Underline className="w-3.5 h-3.5"/></Button>
                              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => formatDoc('justifyLeft')}><AlignLeft className="w-3.5 h-3.5"/></Button>
                              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => formatDoc('justifyCenter')}><AlignCenter className="w-3.5 h-3.5"/></Button>
                              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => formatDoc('justifyRight')}><AlignRight className="w-3.5 h-3.5"/></Button>
                              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                              <Button type="button" variant="ghost" className="h-7 w-7 p-0" onClick={insertTable}><TableIcon className="w-3.5 h-3.5"/></Button>
                          </div>
                          <div ref={editorRef} contentEditable className="p-5 flex-1 overflow-y-auto outline-none text-[13px] bg-white custom-scrollbar" />
                      </div>
                  </div>
                  <div className="erp-modal-footer">
                      <Button variant="outline" className="erp-btn-action px-6" onClick={handleSave}>저장</Button>
                      <Button variant="outline" className="erp-btn-action px-6" onClick={() => setIsModalOpen(false)}>취소</Button>
                  </div>
              </div>
          </div>
      )}

      <SupplierSearchModal
          isOpen={isScmSuppModalOpen}
          onClose={() => setIsScmSuppModalOpen(false)}
          initialSearchName=""
          excludedCodes={['0900216', '0900224', '0900252']}
          onSelect={(item) => { setScmSupplierCode(item.code); setScmSupplierName(item.name); }}
      />
    </div>
  );
}