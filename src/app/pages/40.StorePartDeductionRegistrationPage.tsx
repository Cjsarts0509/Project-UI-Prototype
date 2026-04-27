import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  STORE_LIST,
  DeductionMaster,
  DeductionSupplier,
  getStoreSupplierCodes,
  getAllStoreSupplierSales,
  getSupplierMaster,
  getSupplierItems,
} from '../../data/mockStorePartDeduction';
import { calcDeduction, TYPE_LABEL } from '../../utils/deductionCalc';
import { SupplierSearchModal } from '../components/SupplierSearchModal';
import { useDeductionStore } from '../../context/DeductionContext';

const CURRENT_USER = { empNo: '2024001', name: '조준수' };

type Status = '전체' | '작성중' | '확정';
type DeductionType = 'N' | 'R' | 'A' | 'E';

const today = () => new Date().toISOString().slice(0, 10);
const currentYm = () => new Date().toISOString().slice(0, 7);
const fmtNum = (n: number) => (n || 0).toLocaleString('ko-KR');
// VAT 10% 포함 (입력 공급가 → 저장/계산용 금액)
const VAT_RATE = 0.1;
const withVAT = (base: number) => Math.round((base || 0) * (1 + VAT_RATE));
// 고정점유율 (소수점 2자리까지) 표시 — float 오차 제거
const fmtRateInput = (rate?: number): string => {
  if (rate === undefined || rate === null) return '';
  return String(Math.round(rate * 10000) / 100);
};
// 매입처 그리드 행의 고유 키 — 한 매입처가 여러 품목을 가질 수 있으므로 (code + itemCode) 조합
const rowKeyOf = (s: { code: string; itemCode: string }) => `${s.code}__${s.itemCode}`;

export default function StorePartDeductionRegistrationPage() {
  // ── 1. 조회 영역
  const [sYearMonth, setSYearMonth] = useState('2026-02');
  const [sStore, setSStore] = useState('전체');
  const [sStatus, setSStatus] = useState<Status>('전체');

  // ── 2. 전체 마스터 데이터 (전역 컨텍스트 — 페이지 41과 동기화)
  const { masters, setMasters } = useDeductionStore();
  const [appliedFilter, setAppliedFilter] = useState<{ yearMonth: string; store: string; status: Status }>({
    yearMonth: '', store: '전체', status: '전체',
  });
  const filtered = useMemo(() => masters.filter(m => {
    if (appliedFilter.yearMonth && m.yearMonth !== appliedFilter.yearMonth) return false;
    if (appliedFilter.store !== '전체' && m.storeName !== appliedFilter.store) return false;
    if (appliedFilter.status !== '전체' && m.status !== appliedFilter.status) return false;
    return true;
  }), [masters, appliedFilter]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedMasters, setCheckedMasters] = useState<string[]>([]);

  // ── 3. 공제정보 입력 폼
  const [fYearMonth, setFYearMonth] = useState(currentYm());
  const [fStore, setFStore] = useState('광화문점');
  const [fLaborCost, setFLaborCost] = useState('');

  // ── 4. 공제매입처 입력 영역
  const [inpSupplierCode, setInpSupplierCode] = useState('');
  const [inpSupplierName, setInpSupplierName] = useState('');
  const [chkType, setChkType] = useState(false);
  const [inpType, setInpType] = useState<DeductionType>('N');
  const [chkRate, setChkRate] = useState(false);
  const [inpRate, setInpRate] = useState('');
  const [chkAmount, setChkAmount] = useState(false);
  const [inpAmount, setInpAmount] = useState('');

  // ── 5. 매입처 그리드
  const [checkedSups, setCheckedSups] = useState<string[]>([]);
  // 점유율/공제액 입력 중 raw 텍스트 (commit 전 표시용)
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});

  // ── 6. 매입처 조회 모달
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===================== 파생 값 =====================
  const selected = useMemo(() => masters.find(m => m.id === selectedId) || null, [masters, selectedId]);
  const rows = useMemo(() => {
    if (!selected) return [];
    // 총인건비는 공급가로 저장하고, 계산 시 VAT 10% 가산한 금액 사용
    return calcDeduction(withVAT(selected.totalLaborCost), selected.suppliers);
  }, [selected]);

  // 현재 선택된 영업점의 매입처 코드 리스트 (모달 필터링용)
  // — 선택된 마스터가 있으면 그 점포의 매입처, 없으면 입력 폼의 영업점 기준
  const currentStoreCode = useMemo(() => {
    if (selected) return selected.storeCode;
    const st = STORE_LIST.find(s => s.name === fStore);
    return st?.code || '';
  }, [selected, fStore]);

  const allowedSupplierCodes = useMemo(
    () => getStoreSupplierCodes(currentStoreCode),
    [currentStoreCode]
  );

  // ===================== 핸들러: 조회 =====================
  const handleSearch = () => {
    setAppliedFilter({ yearMonth: sYearMonth, store: sStore, status: sStatus });
    const list = masters.filter(m => {
      if (sYearMonth && m.yearMonth !== sYearMonth) return false;
      if (sStore !== '전체' && m.storeName !== sStore) return false;
      if (sStatus !== '전체' && m.status !== sStatus) return false;
      return true;
    });
    if (list.length) {
      setSelectedId(list[0].id);
      setFYearMonth(list[0].yearMonth);
      setFStore(list[0].storeName);
      setFLaborCost(String(list[0].totalLaborCost));
    }
  };

  const handleSearchReset = () => {
    setSYearMonth(currentYm());
    setSStore('전체');
    setSStatus('전체');
    setAppliedFilter({ yearMonth: '', store: '전체', status: '전체' });
  };

  // ===================== 핸들러: 공제정보 =====================
  const handleFormReset = () => {
    setFYearMonth(currentYm());
    setFStore('광화문점');
    setFLaborCost('');
    setSelectedId(null);
  };

  const handleSelectMaster = (m: DeductionMaster) => {
    setSelectedId(m.id);
    setFYearMonth(m.yearMonth);
    setFStore(m.storeName);
    setFLaborCost(String(m.totalLaborCost));
  };

  const nextSeq = (ym: string, storeCode: string) => {
    const ymClean = ym.replace('-', '');
    const exist = masters.filter(m => m.yearMonth === ym && m.storeCode === storeCode).length;
    return 'AB' + ymClean + storeCode + String(exist + 1).padStart(5, '0');
  };

  const handleSaveMaster = () => {
    if (!fYearMonth || !fStore || !fLaborCost) return alert('정산년월/영업점/총인건비를 입력하세요.');
    const store = STORE_LIST.find(s => s.name === fStore);
    if (!store) return alert('유효한 영업점이 아닙니다.');
    const cost = Number(fLaborCost.replace(/,/g, '')) || 0;

    if (selected && selected.status !== '확정') {
      // 기존 건 업데이트
      setMasters(prev => prev.map(m => m.id === selected.id ? { ...m, totalLaborCost: cost } : m));
      alert('수정되었습니다.');
    } else {
      const newId = nextSeq(fYearMonth, store.code);
      const newMaster: DeductionMaster = {
        id: newId, yearMonth: fYearMonth, storeCode: store.code, storeName: store.name,
        totalLaborCost: cost, status: '작성중', finalConfirmed: 'N', ifasSent: 'N', ifasSentDate: '',
        regDate: today(), regEmpNo: '2024001', regName: '조준수',
        finalConfirmDate: '', finalConfirmEmpNo: '', finalConfirmName: '', note: '',
        suppliers: [],
      };
      setMasters(prev => [newMaster, ...prev]);
      setSelectedId(newId);
      alert(`신규 공제번호 생성: ${newId}`);
    }
  };

  const handleRegenerate = () => {
    if (!selected) return alert('재생성할 공제정보를 선택하세요.');
    if (selected.status === '확정') return alert('확정된 건은 재생성할 수 없습니다.');
    if (!confirm('매입처 설정(유형/점유율/공제액)은 유지하고 매출·최종매출·공제액만 초기화합니다.')) return;
    setMasters(prev => prev.map(m => m.id !== selected.id ? m : ({
      ...m,
      suppliers: m.suppliers.map(s => ({ ...s, sales: 0, excludeSales: 0 })),
    })));
    alert('재생성되었습니다. [매출조회] 또는 [파일등록]을 눌러 매출을 반영하세요.');
  };

  const handleMasterDelete = () => {
    if (!checkedMasters.length) return alert('삭제할 공제정보를 선택하세요.');
    const targets = masters.filter(m => checkedMasters.includes(m.id));
    if (targets.some(m => m.status === '확정')) return alert('확정된 건은 삭제할 수 없습니다.');
    if (!confirm(`${targets.length}건을 삭제하시겠습니까?`)) return;
    setMasters(prev => prev.filter(m => !checkedMasters.includes(m.id)));
    if (selectedId && checkedMasters.includes(selectedId)) handleFormReset();
    setCheckedMasters([]);
  };

  const handleConfirm = () => {
    if (!selected) return alert('확정할 공제정보를 선택하세요.');
    if (selected.status === '확정') return alert('이미 확정된 건입니다.');
    if (!selected.suppliers.length) return alert('매입처 정보가 없습니다.');
    if (!confirm('확정 후 매입처 정보는 수정·삭제가 불가합니다. 진행하시겠습니까?')) return;
    setMasters(prev => prev.map(m => m.id !== selected.id ? m : { ...m, status: '확정' as const }));
    alert('확정되었습니다.');
  };

  // ===================== 핸들러: 매입처 =====================
  const canEditSuppliers = selected && selected.status !== '확정';

  /**
   * 매입처 마스터 정보 + 해당 점포 매출을 조합하여 DeductionSupplier 생성
   * (현재 선택된 공제정보의 점포 기준)
   */
  /**
   * 매입처 추가 시: 매입처코드/매입처명 + 기본 매입처품목('일반')만 채우고
   * 매출/매출제외는 0으로 둠 (사용자가 [매출조회] 클릭해야 채워짐).
   */
  const buildSupplierRow = (code: string, nameHint?: string): DeductionSupplier | null => {
    if (!selected) return null;
    const master = getSupplierMaster(code);
    return {
      code,
      name: master?.name || nameHint || `매입처-${code}`,
      itemCode: master?.itemCode || 'IC' + code.slice(-4) + '00',
      itemName: master?.itemName || `${master?.name || nameHint || '매입처'} 일반`,
      type: 'N',
      sales: 0,
      excludeSales: 0,
      regDate: today(),
      regEmpNo: CURRENT_USER.empNo,
      regName: CURRENT_USER.name,
    };
  };

  /** 선택된 마스터의 매입처 목록을 갱신하면서 수정 감사 필드를 자동 기록 (위치 기반 변경 감지) */
  const updateSuppliers = (
    updater: (suppliers: DeductionSupplier[]) => DeductionSupplier[],
    options: { stampModified?: boolean } = {},
  ) => {
    if (!selected) return;
    const { stampModified = true } = options;
    const apply = (m: DeductionMaster): DeductionMaster => {
      if (m.id !== selected.id) return m;
      const next = updater(m.suppliers);
      if (!stampModified) return { ...m, suppliers: next };
      const stamped = next.map((s, i) => {
        const original = m.suppliers[i];
        // 새 행(원본 없음) 또는 동일 참조(미변경)는 stamp 안 함
        if (!original || original === s) return s;
        return { ...s, modDate: today(), modEmpNo: CURRENT_USER.empNo, modName: CURRENT_USER.name };
      });
      return { ...m, suppliers: stamped };
    };
    setMasters(prev => prev.map(apply));
  };

  /**
   * 매입처코드 조회 (다른 화면과 동일한 패턴)
   * - 코드 비어있음 → 모달 오픈
   * - 현재 점포의 매입처 리스트에서 정확히 1건 일치 → 바로 그리드에 추가
   * - 불일치 → 모달 오픈
   */
  const handleSupplierCodeSearch = () => {
    if (!canEditSuppliers) return alert('공제정보를 먼저 저장 후 매입처를 추가할 수 있습니다. (확정 건은 불가)');
    if (!inpSupplierCode.trim()) { setIsSupplierModalOpen(true); return; }
    const code = inpSupplierCode.trim();
    if (allowedSupplierCodes.includes(code)) {
      const newSup = buildSupplierRow(code);
      if (!newSup) return;
      // 동일 (매입처+매입처품목) 이미 등록되었는지 체크
      if (selected!.suppliers.some(s => s.code === newSup.code && s.itemCode === newSup.itemCode)) {
        alert('이미 동일 매입처품목으로 등록된 행이 있습니다. 다른 품목을 선택하려면 그리드의 매입처품목 dropdown을 사용하세요.');
        return;
      }
      addSupplierToGrid(newSup);
    } else {
      setIsSupplierModalOpen(true);
    }
  };

  /**
   * 매입처명 조회 (다른 화면과 동일한 패턴)
   * - 이름 비어있음 → 모달 오픈
   * - 현재 점포의 매입처 리스트 중 이름 일치 1건 → 바로 그리드에 추가
   * - 불일치/다수 → 모달 오픈
   */
  const handleSupplierNameSearch = () => {
    if (!canEditSuppliers) return alert('공제정보를 먼저 저장 후 매입처를 추가할 수 있습니다. (확정 건은 불가)');
    if (!inpSupplierName.trim()) { setIsSupplierModalOpen(true); return; }
    const nameQuery = inpSupplierName.trim();
    const candidates = allowedSupplierCodes
      .map(c => getSupplierMaster(c))
      .filter((m): m is NonNullable<typeof m> => !!m && m.name.includes(nameQuery));
    if (candidates.length === 1) {
      const match = candidates[0];
      const newSup = buildSupplierRow(match.code);
      if (!newSup) return;
      if (selected!.suppliers.some(s => s.code === newSup.code && s.itemCode === newSup.itemCode)) {
        alert('이미 동일 매입처품목으로 등록된 행이 있습니다.');
        return;
      }
      addSupplierToGrid(newSup);
    } else {
      setIsSupplierModalOpen(true);
    }
  };

  /** 그리드에 매입처 행 추가 + 입력 필드 초기화 (신규 행은 stamp 안 함) */
  const addSupplierToGrid = (newSup: DeductionSupplier) => {
    updateSuppliers(list => [...list, newSup], { stampModified: false });
    setInpSupplierCode('');
    setInpSupplierName('');
  };

  /** 모달에서 매입처 선택 시 */
  const handleSupplierSelect = (item: { code: string; name: string }) => {
    if (!canEditSuppliers) return;
    const newSup = buildSupplierRow(item.code, item.name);
    if (!newSup) return;
    if (selected!.suppliers.some(s => s.code === newSup.code && s.itemCode === newSup.itemCode)) {
      alert('이미 동일 매입처품목으로 등록된 행이 있습니다.');
      return;
    }
    addSupplierToGrid(newSup);
  };

  const handleBulkApply = () => {
    if (!canEditSuppliers || !checkedSups.length) return alert('적용할 매입처를 선택하세요.');
    const rate = Number(inpRate) / 100;
    const amount = Number(inpAmount.replace(/,/g, '')) || 0;
    updateSuppliers(list => list.map(s => {
      if (!checkedSups.includes(rowKeyOf(s))) return s;
      const upd: DeductionSupplier = { ...s };
      if (chkType) {
        upd.type = inpType;
        if (inpType !== 'R') upd.fixedRate = undefined;
        if (inpType !== 'A') upd.fixedAmount = undefined;
      }
      if (chkRate && upd.type === 'R') upd.fixedRate = rate;
      if (chkAmount && upd.type === 'A') upd.fixedAmount = amount;
      return upd;
    }));
    alert(`${checkedSups.length}건 일괄적용 완료.`);
  };

  /**
   * [매출조회] 버튼
   * - 백엔드(DW)에서 해당 점포의 전체 매입처 매출을 일괄 조회
   * - 등록된 매입처만 매출 반영 (기존 매출제외금액은 유지)
   */
  const handleQuerySales = () => {
    if (!canEditSuppliers) return;
    if (!confirm('정산년월 기준 전월 매출을 DW에서 일괄 조회하여 매출금액 컬럼에 반영합니다. (기존 매출제외금액은 유지)')) return;
    const storeSales = getAllStoreSupplierSales(selected!.storeCode);
    updateSuppliers(list => list.map(s => {
      const fromDW = storeSales[s.code];
      return fromDW ? { ...s, sales: fromDW.sales } : s;
    }));
    alert('매출이 반영되었습니다.');
  };

  /**
   * 파일등록: 엑셀(xlsx/xls)에서 매입처코드 일괄 등록
   * - 헤더 자동 감지: 매입처코드 / 매입처명 / 매출(매출금액) / 매출제외금액 / 매입처품목코드 / 매입처품목코드명
   * - 숫자형 컬럼은 콤마/공백 자동 제거
   * - 매입처코드는 영숫자(예: 01B0470) 허용
   * - 매입처품목코드가 파일에 있고 카탈로그에 매칭되면 그 품목으로 등록, 아니면 '일반'(기본값)
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEditSuppliers) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, any>[];
        if (!rows.length) {
          alert('엑셀에 데이터가 없습니다.');
          return;
        }

        // 헤더 키 자동 매칭
        const sample = rows[0];
        const findKey = (cands: string[]) => {
          const keys = Object.keys(sample);
          for (const c of cands) {
            const hit = keys.find(k => k.replace(/\s/g, '').includes(c));
            if (hit) return hit;
          }
          return null;
        };
        const codeKey = findKey(['매입처코드', '거래처코드', '코드']);
        const nameKey = findKey(['매입처명', '거래처명', '매입처']);
        const itemCodeKey = findKey(['매입처품목코드', '품목코드']);
        const itemNameKey = findKey(['매입처품목코드명', '품목명']);
        const salesKey = findKey(['매출금액', '매출']);
        const excludeKey = findKey(['매출제외금액', '매출제외']);

        if (!codeKey) {
          alert('매입처코드 컬럼을 찾지 못했습니다. 헤더에 "매입처코드"가 있어야 합니다.');
          return;
        }

        const toNum = (v: any): number => {
          if (typeof v === 'number') return v;
          const s = String(v ?? '').replace(/[^\d.-]/g, '');
          return s ? Number(s) : 0;
        };

        const newSups: DeductionSupplier[] = [];
        let skipDup = 0;
        rows.forEach(r => {
          const codeRaw = String(r[codeKey] || '').trim().replace(/\s/g, '');
          if (!codeRaw) return;
          if (!/^[A-Za-z0-9]{4,10}$/.test(codeRaw)) return;
          const code = codeRaw;
          const nameFromFile = nameKey ? String(r[nameKey] || '').trim() : '';
          const sales = salesKey ? toNum(r[salesKey]) : 0;
          const excludeSales = excludeKey ? toNum(r[excludeKey]) : 0;

          const master = getSupplierMaster(code);
          const items = getSupplierItems(code);
          let item = items[0]; // 일반(기본)
          if (itemCodeKey && items.length > 0) {
            const wantCode = String(r[itemCodeKey] || '').trim();
            const found = items.find(it => it.itemCode === wantCode);
            if (found) item = found;
          }
          const last4 = (code.replace(/\D/g, '').slice(-4) || '0000').padStart(4, '0');
          const fallbackItemName = itemNameKey ? String(r[itemNameKey] || '').trim() : '';
          const itemCode = item?.itemCode || `IC0${last4}00`;

          // (매입처+매입처품목) 조합으로 중복 체크
          if (
            selected!.suppliers.some(s => s.code === code && s.itemCode === itemCode) ||
            newSups.some(s => s.code === code && s.itemCode === itemCode)
          ) {
            skipDup++;
            return;
          }

          newSups.push({
            code,
            name: master?.name || nameFromFile || `매입처-${code}`,
            itemCode,
            itemName: item?.itemName || fallbackItemName || `${master?.name || nameFromFile || '매입처'} 일반`,
            type: 'N',
            sales,
            excludeSales,
            regDate: today(),
            regEmpNo: CURRENT_USER.empNo,
            regName: CURRENT_USER.name,
          });
        });

        if (!newSups.length) {
          alert(`등록할 신규 매입처가 없습니다.${skipDup ? ` (중복 ${skipDup}건 건너뜀)` : ''}`);
          return;
        }
        updateSuppliers(list => [...list, ...newSups], { stampModified: false });
        alert(`${newSups.length}건 등록되었습니다.${skipDup ? ` (중복 ${skipDup}건 건너뜀)` : ''}`);
      } catch (err) {
        console.error('파일등록 오류:', err);
        alert('엑셀 파일 파싱에 실패했습니다. 헤더 형식을 확인하세요.\n예: 매입처코드 | 매입처명 | 매출 | 매출제외금액');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSupReset = () => {
    setInpSupplierCode(''); setInpSupplierName('');
    setChkType(false); setChkRate(false); setChkAmount(false);
    setInpType('N'); setInpRate(''); setInpAmount('');
  };

  const handleExcelDown = () => {
    if (!rows.length) return alert('다운로드할 내역이 없습니다.');
    const data = rows.map((r, i) => ({
      순번: i + 1, 매입처코드: r.code, 매입처명: r.name,
      매입처품목코드: r.itemCode, 매입처품목코드명: r.itemName,
      유형: TYPE_LABEL[r.type], 매출금액: r.sales, 매출제외금액: r.excludeSales,
      최종매출금액: r.finalSales, '점유율(%)': r.ratePct.toFixed(4), 공제액: r.deduction,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '매입처공제');
    XLSX.writeFile(wb, `${selected!.storeName}_${selected!.yearMonth}_공제매입처.xlsx`);
  };

  const handleSupSave = () => {
    if (!canEditSuppliers) return;
    alert('매입처 변경사항이 저장되었습니다.');
  };

  const handleSupDelete = () => {
    if (!canEditSuppliers || !checkedSups.length) return alert('삭제할 매입처를 선택하세요.');
    if (!confirm(`${checkedSups.length}건을 삭제하시겠습니까?`)) return;
    updateSuppliers(list => list.filter(s => !checkedSups.includes(rowKeyOf(s))), { stampModified: false });
    setCheckedSups([]);
  };

  /** 인라인 매입처 수정 — (현재 code, 현재 itemCode)로 행을 식별하여 업데이트 */
  const updateOneSupplier = (currentCode: string, currentItemCode: string, patch: Partial<DeductionSupplier>) => {
    if (!canEditSuppliers || !selected) return;
    // 매입처품목코드 변경 시 동일 매입처의 다른 행과 충돌하는지 검사
    if (patch.itemCode && patch.itemCode !== currentItemCode) {
      const collision = selected.suppliers.some(s =>
        s.code === currentCode && s.itemCode === patch.itemCode
      );
      if (collision) {
        alert('해당 매입처품목으로 이미 등록된 행이 있습니다.');
        return;
      }
    }
    updateSuppliers(list => list.map(s => {
      if (s.code !== currentCode || s.itemCode !== currentItemCode) return s;
      const next: DeductionSupplier = { ...s, ...patch };
      if (patch.type && patch.type !== 'R') next.fixedRate = undefined;
      if (patch.type && patch.type !== 'A') next.fixedAmount = undefined;
      return next;
    }));
  };

  /** 비고(note) 업데이트 — 마스터 그리드에서 인라인 입력 */
  const handleNoteChange = (id: string, note: string) => {
    setMasters(prev => prev.map(m => m.id === id ? { ...m, note } : m));
  };

  // ===================== 렌더 =====================
  const allMasterChecked = filtered.length > 0 && filtered.every(m => checkedMasters.includes(m.id));
  const allSupChecked = rows.length > 0 && rows.every(r => checkedSups.includes(rowKeyOf(r)));

  return (
    <div className="erp-page">
      <div className="erp-page-title"><h2>점포별 공용알바 공제등록</h2></div>

      {/* ── 1. 조회 영역 ── */}
      <div className="erp-filter-box">
        <div className="erp-form-grid" style={{ gridTemplateColumns: '90px 140px 90px 140px 90px 140px 1fr' }}>
          <div className="erp-form-label">정산년월<span className="required">*</span></div>
          <div className="erp-form-cell">
            <input type="month" className="erp-input" style={{ width: '100%' }} value={sYearMonth} onChange={e => setSYearMonth(e.target.value)} />
          </div>
          <div className="erp-form-label">영업점</div>
          <div className="erp-form-cell">
            <select className="erp-select-trigger" style={{ width: '100%' }} value={sStore} onChange={e => setSStore(e.target.value)}>
              <option>전체</option>
              {STORE_LIST.map(s => <option key={s.code}>{s.name}</option>)}
            </select>
          </div>
          <div className="erp-form-label">진행상태<span className="required">*</span></div>
          <div className="erp-form-cell">
            <select className="erp-select-trigger" style={{ width: '100%' }} value={sStatus} onChange={e => setSStatus(e.target.value as Status)}>
              <option>전체</option><option>작성중</option><option>확정</option>
            </select>
          </div>
          <div className="erp-form-cell" style={{ justifyContent: 'flex-end', gap: 4, paddingRight: 8 }}>
            <button className="erp-btn-action" onClick={handleSearch}>조회</button>
            <button className="erp-btn-header" onClick={handleSearchReset}>초기화</button>
          </div>
        </div>
      </div>

      {/* ── 2. 공제정보 영역 ── */}
      <div className="erp-section-group">
        <div className="erp-section-header">
          <div className="erp-section-title">점포별 공용알바 공제정보</div>
        </div>
        <div className="erp-section">
          <div className="erp-form-grid" style={{ gridTemplateColumns: '90px 140px 90px 140px 90px 160px 1fr' }}>
            <div className="erp-form-label">정산년월<span className="required">*</span></div>
            <div className="erp-form-cell">
              <input type="month" className="erp-input" style={{ width: '100%' }} value={fYearMonth} onChange={e => setFYearMonth(e.target.value)} disabled={!!selected && selected.status === '확정'} />
            </div>
            <div className="erp-form-label">영업점<span className="required">*</span></div>
            <div className="erp-form-cell">
              <select className="erp-select-trigger" style={{ width: '100%' }} value={fStore} onChange={e => setFStore(e.target.value)} disabled={!!selected && selected.status === '확정'}>
                {STORE_LIST.map(s => <option key={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div className="erp-form-label">총인건비<span className="required">*</span></div>
            <div className="erp-form-cell">
              <input type="text" className="erp-input" style={{ width: '100%', textAlign: 'right' }} value={fLaborCost ? fmtNum(Number(fLaborCost.replace(/,/g,''))) : ''} onChange={e => setFLaborCost(e.target.value.replace(/[^\d]/g, ''))} disabled={!!selected && selected.status === '확정'} placeholder="공급가" />
            </div>
            <div className="erp-form-cell" style={{ justifyContent: 'flex-end', gap: 4, paddingRight: 8 }}>
              <button className="erp-btn-header" onClick={handleFormReset}>초기화</button>
              <button className="erp-btn-action" onClick={handleSaveMaster}>저장</button>
              <button className="erp-btn-action" onClick={handleRegenerate}>재생성</button>
              <button className="erp-btn-danger" onClick={handleMasterDelete}>삭제</button>
              <button className="erp-btn-action" onClick={handleConfirm}>확정</button>
            </div>
          </div>
        </div>

        {/* ── 3. 공제정보 그리드 ── */}
        <div className="erp-section" style={{ marginTop: 4 }}>
          <div className="erp-grid-wrapper" style={{ maxHeight: 180 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allMasterChecked} onChange={e => setCheckedMasters(e.target.checked ? filtered.map(m => m.id) : [])} />
                  </th>
                  <th>공용알바공제번호</th>
                  <th style={{ width: 90 }}>정산년월</th>
                  <th style={{ width: 110 }}>영업점</th>
                  <th>총인건비</th>
                  <th>총인건비(VAT포함)</th>
                  <th style={{ width: 80 }}>진행상태</th>
                  <th style={{ width: 100 }}>정산등록일</th>
                  <th style={{ width: 100 }}>정산등록사번</th>
                  <th style={{ width: 110 }}>정산등록자명</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="erp-empty-row"><td colSpan={11}>조회된 데이터가 없습니다.</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id} className={selectedId === m.id ? 'selected' : ''} onClick={() => handleSelectMaster(m)}>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={checkedMasters.includes(m.id)} onChange={e => setCheckedMasters(p => e.target.checked ? [...p, m.id] : p.filter(x => x !== m.id))} />
                    </td>
                    <td style={{ textAlign: 'center' }}>{m.id}</td>
                    <td style={{ textAlign: 'center' }}>{m.yearMonth}</td>
                    <td style={{ textAlign: 'center' }}>{m.storeName}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(m.totalLaborCost)}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(withVAT(m.totalLaborCost))}</td>
                    <td style={{ textAlign: 'center', color: m.status === '확정' ? '#dc2626' : '#2563eb' }}>{m.status}</td>
                    <td style={{ textAlign: 'center' }}>{m.regDate}</td>
                    <td style={{ textAlign: 'center' }}>{m.regEmpNo}</td>
                    <td style={{ textAlign: 'center' }}>{m.regName}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        className="erp-input"
                        style={{ width: '100%', minWidth: 120 }}
                        value={m.note || ''}
                        disabled={m.status === '확정'}
                        onChange={e => handleNoteChange(m.id, e.target.value)}
                        placeholder={m.status === '확정' ? '' : '메모 입력'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 4. 공제매입처정보 영역 ── */}
      <div className="erp-section-group" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="erp-section-header">
          <div className="erp-section-title">점포별 공용알바 공제매입처정보</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="erp-btn-action" onClick={handleBulkApply}>일괄적용</button>
            <button className="erp-btn-action" onClick={handleQuerySales}>매출조회</button>
            <button className="erp-btn-action" onClick={() => fileInputRef.current?.click()}>파일등록</button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx,.xls" onChange={handleFileUpload} />
            <button className="erp-btn-header" onClick={handleSupReset}>초기화</button>
            <button className="erp-btn-action" onClick={handleExcelDown}>엑셀다운</button>
            <button className="erp-btn-action" onClick={handleSupSave}>저장</button>
            <button className="erp-btn-danger" onClick={handleSupDelete}>삭제</button>
          </div>
        </div>
        <div className="erp-section" style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, flexWrap: 'wrap' }}>
            <span className="erp-label" style={{ border: '1px solid #e5e7eb' }}>매입처코드</span>
            <input
              className="erp-input"
              style={{ width: 90 }}
              value={inpSupplierCode}
              onChange={e => setInpSupplierCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSupplierCodeSearch()}
              placeholder="코드"
            />
            <input
              className="erp-input"
              style={{ width: 160 }}
              value={inpSupplierName}
              onChange={e => setInpSupplierName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSupplierNameSearch()}
              placeholder="매입처명 (enter로 조회)"
            />
            <button
              className="erp-btn-header"
              onClick={() => {
                if (!canEditSuppliers) return alert('공제정보를 먼저 저장 후 매입처를 추가할 수 있습니다.');
                setIsSupplierModalOpen(true);
              }}
              title="매입처 조회"
            >
              🔍
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={chkType} onChange={e => setChkType(e.target.checked)} />
              <span style={{ fontSize: 11 }}>공제유형</span>
            </label>
            <select className="erp-select-trigger" style={{ width: 110 }} value={inpType} onChange={e => setInpType(e.target.value as DeductionType)} disabled={!chkType}>
              <option value="N">일반</option><option value="R">고정점유율</option><option value="A">고정공제</option><option value="E">제외</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={chkRate} onChange={e => setChkRate(e.target.checked)} />
              <span style={{ fontSize: 11 }}>점유율</span>
            </label>
            <input className="erp-input" style={{ width: 70 }} value={inpRate} onChange={e => setInpRate(e.target.value.replace(/[^\d.]/g, ''))} disabled={!chkRate || inpType !== 'R'} />
            <span style={{ fontSize: 11 }}>%</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={chkAmount} onChange={e => setChkAmount(e.target.checked)} />
              <span style={{ fontSize: 11 }}>공제액</span>
            </label>
            <input className="erp-input" style={{ width: 110, textAlign: 'right' }} value={inpAmount ? fmtNum(Number(inpAmount.replace(/,/g,''))) : ''} onChange={e => setInpAmount(e.target.value.replace(/[^\d]/g,''))} disabled={!chkAmount || inpType !== 'A'} />
          </div>
        </div>

        {/* ── 5. 매입처 그리드 ── */}
        <div className="erp-section" style={{ flex: 1, minHeight: 0 }}>
          <div className="erp-grid-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1600 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allSupChecked} onChange={e => setCheckedSups(e.target.checked ? rows.map(r => rowKeyOf(r)) : [])} />
                  </th>
                  <th style={{ width: 44 }}>순번</th>
                  <th style={{ width: 90 }}>매입처코드</th>
                  <th style={{ width: 160 }}>매입처명</th>
                  <th style={{ width: 110 }}>매입처품목코드</th>
                  <th style={{ width: 180 }}>매입처품목코드명</th>
                  <th style={{ width: 90 }}>유형</th>
                  <th style={{ width: 110 }}>매출금액</th>
                  <th style={{ width: 110 }}>매출제외금액</th>
                  <th style={{ width: 110 }}>최종매출금액</th>
                  <th style={{ width: 80 }}>점유율(%)</th>
                  <th style={{ width: 110 }}>공제액</th>
                  <th style={{ width: 70 }}>진행상태</th>
                  <th style={{ width: 90 }}>등록일</th>
                  <th style={{ width: 80 }}>등록사번</th>
                  <th style={{ width: 90 }}>등록자명</th>
                  <th style={{ width: 90 }}>수정일</th>
                  <th style={{ width: 80 }}>수정사번</th>
                  <th style={{ width: 90 }}>수정자명</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="erp-empty-row"><td colSpan={19}>{selected ? '매입처를 추가하거나 [파일등록] / [매출조회] 로 생성하세요.' : '공제정보를 먼저 선택/생성하세요.'}</td></tr>
                ) : rows.map((r, i) => {
                  const rk = rowKeyOf(r);
                  return (
                  <tr key={rk}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={checkedSups.includes(rk)} onChange={e => setCheckedSups(p => e.target.checked ? [...p, rk] : p.filter(x => x !== rk))} />
                    </td>
                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ textAlign: 'center' }}>{r.code}</td>
                    <td>{r.name}</td>
                    <td style={{ textAlign: 'center' }}>{r.itemCode}</td>
                    <td style={{ padding: 2 }}>
                      {(() => {
                        const items = getSupplierItems(r.code);
                        if (items.length <= 1) return <span style={{ paddingLeft: 4 }}>{r.itemName}</span>;
                        return (
                          <select
                            className="erp-select-trigger"
                            style={{ width: '100%' }}
                            value={r.itemCode}
                            disabled={!canEditSuppliers}
                            onChange={e => {
                              const it = items.find(x => x.itemCode === e.target.value);
                              if (it) updateOneSupplier(r.code, r.itemCode, { itemCode: it.itemCode, itemName: it.itemName });
                            }}
                          >
                            {items.map(it => <option key={it.itemCode} value={it.itemCode}>{it.itemName}</option>)}
                          </select>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: 'center', padding: 2 }}>
                      <select
                        className="erp-select-trigger"
                        style={{ width: '100%' }}
                        value={r.type}
                        disabled={!canEditSuppliers}
                        onChange={e => updateOneSupplier(r.code, r.itemCode, { type: e.target.value as DeductionType })}
                      >
                        <option value="N">일반</option>
                        <option value="R">고정점유율</option>
                        <option value="A">고정공제</option>
                        <option value="E">제외</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(r.sales)}</td>
                    <td style={{ textAlign: 'right', padding: 2 }}>
                      <input
                        className="erp-input"
                        style={{ width: '100%', textAlign: 'right' }}
                        value={r.excludeSales ? fmtNum(r.excludeSales) : ''}
                        disabled={!canEditSuppliers}
                        onChange={e => {
                          const v = e.target.value.replace(/[^\d]/g, '');
                          updateOneSupplier(r.code, r.itemCode, { excludeSales: v ? Number(v) : 0 });
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(r.finalSales)}</td>
                    <td style={{ textAlign: 'right', padding: r.type === 'R' ? 2 : undefined }}>
                      {r.type === 'R' ? (
                        <input
                          type="text"
                          className="erp-input"
                          style={{ width: '100%', textAlign: 'right' }}
                          placeholder="%"
                          value={rateDrafts[rk] ?? fmtRateInput(r.fixedRate)}
                          disabled={!canEditSuppliers}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === '') {
                              setRateDrafts(p => ({ ...p, [rk]: '' }));
                              updateOneSupplier(r.code, r.itemCode, { fixedRate: undefined });
                              return;
                            }
                            if (!/^\d{0,3}(\.\d{0,2})?$/.test(v)) return;
                            setRateDrafts(p => ({ ...p, [rk]: v }));
                            const num = Number(v);
                            if (isFinite(num)) updateOneSupplier(r.code, r.itemCode, { fixedRate: num / 100 });
                          }}
                          onBlur={() => setRateDrafts(p => {
                            const c = { ...p }; delete c[rk]; return c;
                          })}
                        />
                      ) : (
                        r.ratePct > 0 ? r.ratePct.toFixed(4) : '-'
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: r.type === 'A' ? 2 : undefined }}>
                      {r.type === 'A' ? (
                        <input
                          type="text"
                          className="erp-input"
                          style={{ width: '100%', textAlign: 'right', fontWeight: 700 }}
                          placeholder="공제액"
                          value={amountDrafts[rk] ?? (r.fixedAmount ? fmtNum(r.fixedAmount) : '')}
                          disabled={!canEditSuppliers}
                          onChange={e => {
                            const raw = e.target.value.replace(/[^\d]/g, '');
                            const display = raw ? fmtNum(Number(raw)) : '';
                            setAmountDrafts(p => ({ ...p, [rk]: display }));
                            updateOneSupplier(r.code, r.itemCode, { fixedAmount: raw ? Number(raw) : undefined });
                          }}
                          onBlur={() => setAmountDrafts(p => {
                            const c = { ...p }; delete c[rk]; return c;
                          })}
                        />
                      ) : (
                        r.type === 'E' ? '-' : fmtNum(r.deduction)
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{selected?.status}</td>
                    <td style={{ textAlign: 'center' }}>{r.regDate || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{r.regEmpNo || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{r.regName || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{r.modDate || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{r.modEmpNo || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{r.modName || '-'}</td>
                  </tr>
                  );
                })}
                {rows.length > 0 && (() => {
                  const fixedSum = rows.filter(r => r.type === 'A').reduce((a, r) => a + r.deduction, 0);
                  const ratedSum = rows.filter(r => r.type === 'R').reduce((a, r) => a + r.deduction, 0);
                  const normals = rows.filter(r => r.type === 'N');
                  const totalCostVAT = withVAT(selected?.totalLaborCost || 0);
                  const normalShare = totalCostVAT - fixedSum - ratedSum;
                  const normalTotalSales = normals.reduce((a, r) => a + r.finalSales, 0);
                  const totalDed = rows.reduce((a, r) => a + (r.type === 'E' ? 0 : r.deduction), 0);
                  return (
                    <>
                      {(fixedSum > 0 || ratedSum > 0) && (
                        <tr style={{ backgroundColor: '#fefce8', fontSize: 11, color: '#854d0e' }}>
                          <td colSpan={19} style={{ padding: '4px 8px' }}>
                            <strong>공제 산출 근거</strong> &nbsp;|&nbsp;
                            총인건비(VAT포함) {fmtNum(totalCostVAT)}원
                            {ratedSum > 0 && <> − 고정점유율(R) 합계 {fmtNum(ratedSum)}원</>}
                            {fixedSum > 0 && <> − 고정공제(A) 합계 {fmtNum(fixedSum)}원</>}
                            &nbsp;= <strong>일반형 분배목 {fmtNum(normalShare)}원</strong>
                            &nbsp;|&nbsp; 일반형 총 최종매출 {fmtNum(normalTotalSales)}원
                            &nbsp;→ 일반 매입처 공제 = (자사 최종매출 ÷ {fmtNum(normalTotalSales)}) × {fmtNum(normalShare)}
                          </td>
                        </tr>
                      )}
                      <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 700 }}>
                        <td colSpan={7} style={{ textAlign: 'center' }}>합계</td>
                        <td style={{ textAlign: 'right' }}>{fmtNum(rows.reduce((a, r) => a + r.sales, 0))}</td>
                        <td style={{ textAlign: 'right' }}>{fmtNum(rows.reduce((a, r) => a + r.excludeSales, 0))}</td>
                        <td style={{ textAlign: 'right' }}>{fmtNum(rows.reduce((a, r) => a + r.finalSales, 0))}</td>
                        <td></td>
                        <td style={{ textAlign: 'right' }}>{fmtNum(totalDed)}</td>
                        <td colSpan={7}></td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 매입처 조회 모달 (다른 화면들과 동일한 컴포넌트) ── */}
      <SupplierSearchModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        initialSearchName={inpSupplierName}
        allowedCodes={allowedSupplierCodes}
        onSelect={handleSupplierSelect}
      />
    </div>
  );
}