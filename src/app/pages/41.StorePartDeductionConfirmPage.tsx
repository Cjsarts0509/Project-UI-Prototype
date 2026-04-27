import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_DEDUCTION_MASTERS, STORE_LIST, DeductionMaster } from '../../data/mockStorePartDeduction';
import { calcDeduction, TYPE_LABEL } from '../../utils/deductionCalc';

type Status = '전체' | '작성중' | '확정';
type YN = '전체' | 'Y' | 'N';

const currentYm = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);
const fmtNum = (n: number) => (n || 0).toLocaleString('ko-KR');

export default function StorePartDeductionConfirmPage() {
  // 초기엔 확정된 건만 노출되도록 — 그러나 더미는 전부 작성중이라 전체 보여줌
  const [sYearMonth, setSYearMonth] = useState('2026-02');
  const [sStore, setSStore] = useState('전체');
  const [sStatus, setSStatus] = useState<Status>('전체');
  const [sFinal, setSFinal] = useState<YN>('전체');

  const [masters, setMasters] = useState<DeductionMaster[]>(MOCK_DEDUCTION_MASTERS);
  const [filtered, setFiltered] = useState<DeductionMaster[]>(MOCK_DEDUCTION_MASTERS);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_DEDUCTION_MASTERS[0]?.id || null);
  const [checkedMasters, setCheckedMasters] = useState<string[]>([]);
  const [checkedSups, setCheckedSups] = useState<string[]>([]);

  const selected = useMemo(() => masters.find(m => m.id === selectedId) || null, [masters, selectedId]);
  const rows = useMemo(() => selected ? calcDeduction(selected.totalLaborCost, selected.suppliers) : [], [selected]);

  // 체크된 마스터 기준 버튼 활성/비활성 (스토리보드 규칙)
  const checkedRows = masters.filter(m => checkedMasters.includes(m.id));
  const canFinalize = checkedRows.length > 0 && checkedRows.every(m => m.status === '확정' && m.finalConfirmed === 'N');
  const canUnfinalize = checkedRows.length > 0 && checkedRows.every(m => m.finalConfirmed === 'Y' && m.ifasSent === 'N');
  const canIfas = checkedRows.length > 0 && checkedRows.every(m => m.finalConfirmed === 'Y' && m.ifasSent === 'N');

  const handleSearch = () => {
    const list = masters.filter(m => {
      if (sYearMonth && m.yearMonth !== sYearMonth) return false;
      if (sStore !== '전체' && m.storeName !== sStore) return false;
      if (sStatus !== '전체' && m.status !== sStatus) return false;
      if (sFinal !== '전체' && m.finalConfirmed !== sFinal) return false;
      return true;
    });
    setFiltered(list);
    setSelectedId(list[0]?.id || null);
    setCheckedMasters([]);
    setCheckedSups([]);
  };

  const handleReset = () => {
    setSYearMonth(currentYm()); setSStore('전체'); setSStatus('전체'); setSFinal('전체');
    setFiltered(masters);
  };

  const checkedConfirmedRecords = () =>
    masters.filter(m => checkedMasters.includes(m.id) && m.status === '확정');

  const handleFinalize = () => {
    const targets = masters.filter(m => checkedMasters.includes(m.id));
    if (!targets.length) return alert('최종확정할 항목을 선택하세요.');
    if (targets.some(m => m.status !== '확정')) return alert('확정 상태의 항목만 최종확정할 수 있습니다.');
    if (targets.some(m => m.finalConfirmed === 'Y')) return alert('이미 최종확정된 항목이 포함되어 있습니다.');
    if (!confirm(`${targets.length}건을 최종확정합니다.`)) return;
    setMasters(prev => prev.map(m => checkedMasters.includes(m.id) ? { ...m, finalConfirmed: 'Y', finalConfirmDate: today(), finalConfirmEmpNo: '2024001', finalConfirmName: '조준수' } : m));
    setFiltered(prev => prev.map(m => checkedMasters.includes(m.id) ? { ...m, finalConfirmed: 'Y', finalConfirmDate: today(), finalConfirmEmpNo: '2024001', finalConfirmName: '조준수' } : m));
    alert('최종확정 완료.');
  };

  const handleUnfinalize = () => {
    const targets = checkedConfirmedRecords().filter(m => m.finalConfirmed === 'Y' && m.ifasSent === 'N');
    if (!targets.length) return alert('확정취소할 항목을 선택하세요. (IFAS 전송된 건은 불가)');
    if (!confirm(`${targets.length}건을 확정취소합니다.`)) return;
    const ids = targets.map(t => t.id);
    setMasters(prev => prev.map(m => ids.includes(m.id) ? { ...m, finalConfirmed: 'N', finalConfirmDate: '', finalConfirmEmpNo: '', finalConfirmName: '' } : m));
    setFiltered(prev => prev.map(m => ids.includes(m.id) ? { ...m, finalConfirmed: 'N', finalConfirmDate: '', finalConfirmEmpNo: '', finalConfirmName: '' } : m));
  };

  const handleIfas = () => {
    const targets = masters.filter(m => checkedMasters.includes(m.id) && m.finalConfirmed === 'Y' && m.ifasSent === 'N');
    if (!targets.length) return alert('IFAS 전송 가능한 항목(최종확정 Y, 미전송)을 선택하세요.');
    if (!confirm(`${targets.length}건을 IFAS에 전송합니다.`)) return;
    const ids = targets.map(t => t.id);
    setMasters(prev => prev.map(m => ids.includes(m.id) ? { ...m, ifasSent: 'Y', ifasSentDate: today() } : m));
    setFiltered(prev => prev.map(m => ids.includes(m.id) ? { ...m, ifasSent: 'Y', ifasSentDate: today() } : m));
    alert('IFAS 전송 완료.');
  };

  const handleExcelDown = () => {
    if (!selected) return alert('다운로드할 항목을 선택하세요.');
    const data = rows.map((r, i) => ({
      순번: i + 1, 영업점: selected.storeName, 매입처코드: r.code, 매입처명: r.name,
      매입처품목코드: r.itemCode, 매입처품목명: r.itemName,
      유형: TYPE_LABEL[r.type], 최종매출금액: r.finalSales, '점유율(%)': r.ratePct.toFixed(4), 공제액: r.deduction,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '공제확정매입처');
    XLSX.writeFile(wb, `${selected.storeName}_${selected.yearMonth}_공제확정.xlsx`);
  };

  const handleExcelDownAll = () => {
    if (!filtered.length) return alert('다운로드할 데이터가 없습니다.');
    const data: any[] = [];
    filtered.forEach(m => {
      const mr = calcDeduction(m.totalLaborCost, m.suppliers);
      mr.forEach((r, i) => {
        data.push({
          공용알바공제번호: m.id, 정산년월: m.yearMonth, 영업점: m.storeName,
          순번: i + 1, 매입처코드: r.code, 매입처명: r.name,
          매입처품목코드: r.itemCode, 매입처품목명: r.itemName,
          유형: TYPE_LABEL[r.type], 최종매출금액: r.finalSales,
          '점유율(%)': r.ratePct.toFixed(4), 공제액: r.deduction,
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '공제확정_전체');
    XLSX.writeFile(wb, `점포별공용알바_공제확정_전체_${today()}.xlsx`);
  };

  const allChecked = filtered.length > 0 && filtered.every(m => checkedMasters.includes(m.id));

  return (
    <div className="erp-page">
      <div className="erp-page-title"><h2>점포별 공용알바 공제확정</h2></div>

      {/* ── 조회 영역 ── */}
      <div className="erp-filter-box">
        <div className="erp-form-grid" style={{ gridTemplateColumns: '90px 140px 80px 140px 80px 130px 100px 130px 1fr' }}>
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
          <div className="erp-form-label">진행상태</div>
          <div className="erp-form-cell">
            <select className="erp-select-trigger" style={{ width: '100%' }} value={sStatus} onChange={e => setSStatus(e.target.value as Status)}>
              <option>전체</option><option>작성중</option><option>확정</option>
            </select>
          </div>
          <div className="erp-form-label">최종확정여부</div>
          <div className="erp-form-cell">
            <select className="erp-select-trigger" style={{ width: '100%' }} value={sFinal} onChange={e => setSFinal(e.target.value as YN)}>
              <option>전체</option><option>Y</option><option>N</option>
            </select>
          </div>
          <div className="erp-form-cell" style={{ justifyContent: 'flex-end', gap: 4, paddingRight: 8 }}>
            <button className="erp-btn-action" onClick={handleSearch}>조회</button>
            <button className="erp-btn-header" onClick={handleReset}>초기화</button>
          </div>
        </div>
      </div>

      {/* ── 공제확정정보 ── */}
      <div className="erp-section-group">
        <div className="erp-section-header">
          <div className="erp-section-title">점포별 공용알바 공제확정정보</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="erp-btn-action"
              onClick={handleFinalize}
              disabled={!canFinalize}
              title={canFinalize ? '' : '확정 상태이며 미최종확정인 항목을 선택하세요.'}
            >최종확정</button>
            <button
              className="erp-btn-header"
              onClick={handleUnfinalize}
              disabled={!canUnfinalize}
              title={canUnfinalize ? '' : '최종확정 Y이며 IFAS 미전송인 항목만 취소 가능합니다.'}
            >확정취소</button>
            <button
              className="erp-btn-action"
              onClick={handleIfas}
              disabled={!canIfas}
              title={canIfas ? '' : '최종확정 Y이며 IFAS 미전송인 항목만 전송 가능합니다.'}
            >IFAS전송</button>
            <button className="erp-btn-action" onClick={handleExcelDown}>엑셀다운</button>
            <button className="erp-btn-action" onClick={handleExcelDownAll}>전체엑셀다운</button>
          </div>
        </div>
        <div className="erp-section">
          <div className="erp-grid-wrapper" style={{ maxHeight: 260 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1600 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allChecked} onChange={e => setCheckedMasters(e.target.checked ? filtered.map(m => m.id) : [])} />
                  </th>
                  <th>공용알바공제번호</th>
                  <th style={{ width: 90 }}>정산년월</th>
                  <th style={{ width: 100 }}>영업점</th>
                  <th style={{ width: 110 }}>총인건비</th>
                  <th style={{ width: 80 }}>매입처수</th>
                  <th style={{ width: 80 }}>진행상태</th>
                  <th style={{ width: 100 }}>최종확정여부</th>
                  <th style={{ width: 100 }}>IFAS전송여부</th>
                  <th style={{ width: 100 }}>IFAS전송일</th>
                  <th style={{ width: 90 }}>등록일</th>
                  <th style={{ width: 80 }}>등록사번</th>
                  <th style={{ width: 90 }}>등록자명</th>
                  <th style={{ width: 100 }}>최종확정일</th>
                  <th style={{ width: 100 }}>최종확정사번</th>
                  <th style={{ width: 100 }}>최종확정자명</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="erp-empty-row"><td colSpan={16}>조회된 데이터가 없습니다.</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id} className={selectedId === m.id ? 'selected' : ''} onClick={() => { setSelectedId(m.id); setCheckedSups([]); }}>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={checkedMasters.includes(m.id)} onChange={e => setCheckedMasters(p => e.target.checked ? [...p, m.id] : p.filter(x => x !== m.id))} />
                    </td>
                    <td style={{ textAlign: 'center' }}>{m.id}</td>
                    <td style={{ textAlign: 'center' }}>{m.yearMonth}</td>
                    <td style={{ textAlign: 'center' }}>{m.storeName}</td>
                    <td style={{ textAlign: 'right' }}>{fmtNum(m.totalLaborCost)}</td>
                    <td style={{ textAlign: 'right' }}>{m.suppliers.length}</td>
                    <td style={{ textAlign: 'center', color: m.status === '확정' ? '#dc2626' : '#2563eb' }}>{m.status}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: m.finalConfirmed === 'Y' ? '#16a34a' : '#6b7280' }}>{m.finalConfirmed}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: m.ifasSent === 'Y' ? '#16a34a' : '#6b7280' }}>{m.ifasSent}</td>
                    <td style={{ textAlign: 'center' }}>{m.ifasSentDate}</td>
                    <td style={{ textAlign: 'center' }}>{m.regDate}</td>
                    <td style={{ textAlign: 'center' }}>{m.regEmpNo}</td>
                    <td style={{ textAlign: 'center' }}>{m.regName}</td>
                    <td style={{ textAlign: 'center' }}>{m.finalConfirmDate}</td>
                    <td style={{ textAlign: 'center' }}>{m.finalConfirmEmpNo}</td>
                    <td style={{ textAlign: 'center' }}>{m.finalConfirmName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 공제확정매입처정보 ── */}
      <div className="erp-section-group" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="erp-section-header">
          <div className="erp-section-title">점포별 공용알바 공제확정매입처정보</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="erp-btn-action" onClick={handleExcelDown}>엑셀다운</button>
          </div>
        </div>
        <div className="erp-section" style={{ flex: 1, minHeight: 0 }}>
          <div className="erp-grid-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every(r => checkedSups.includes(r.code))}
                      onChange={e => setCheckedSups(e.target.checked ? rows.map(r => r.code) : [])}
                    />
                  </th>
                  <th style={{ width: 44 }}>순번</th>
                  <th style={{ width: 100 }}>영업점</th>
                  <th style={{ width: 100 }}>매입처코드</th>
                  <th style={{ width: 180 }}>매입처명</th>
                  <th style={{ width: 120 }}>매입처품목코드</th>
                  <th style={{ width: 200 }}>매입처품목명</th>
                  <th style={{ width: 100 }}>유형</th>
                  <th style={{ width: 120 }}>최종매출금액</th>
                  <th style={{ width: 90 }}>점유율(%)</th>
                  <th style={{ width: 120 }}>공제액</th>
                </tr>
              </thead>
              <tbody>
                {!selected ? (
                  <tr className="erp-empty-row"><td colSpan={11}>공제확정정보를 먼저 선택하세요.</td></tr>
                ) : rows.length === 0 ? (
                  <tr className="erp-empty-row"><td colSpan={11}>매입처 정보가 없습니다.</td></tr>
                ) : (
                  <>
                    {rows.map((r, i) => (
                      <tr key={r.code}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checkedSups.includes(r.code)}
                            onChange={e => setCheckedSups(p => e.target.checked ? [...p, r.code] : p.filter(x => x !== r.code))}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ textAlign: 'center' }}>{selected.storeName}</td>
                        <td style={{ textAlign: 'center' }}>{r.code}</td>
                        <td>{r.name}</td>
                        <td style={{ textAlign: 'center' }}>{r.itemCode}</td>
                        <td>{r.itemName}</td>
                        <td style={{ textAlign: 'center' }}>{TYPE_LABEL[r.type]}</td>
                        <td style={{ textAlign: 'right' }}>{fmtNum(r.finalSales)}</td>
                        <td style={{ textAlign: 'right' }}>{r.ratePct > 0 ? r.ratePct.toFixed(4) : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.type === 'E' ? '-' : fmtNum(r.deduction)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 700 }}>
                      <td colSpan={8} style={{ textAlign: 'center' }}>합계</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(rows.reduce((a, r) => a + r.finalSales, 0))}</td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(rows.reduce((a, r) => a + (r.type === 'E' ? 0 : r.deduction), 0))}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
