import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface EmployeeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchId?: string;
  initialSearchName?: string;
  onSelect: (emp: { id: string; name: string; dept: string }) => void;
}

export function EmployeeSearchModal({ isOpen, onClose, initialSearchId, initialSearchName, onSelect }: EmployeeSearchModalProps) {
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
      if (isOpen) {
          setSearchId(initialSearchId || '');
          setSearchName(initialSearchName || '');
          handleSearch(initialSearchId, initialSearchName);
      }
  }, [isOpen, initialSearchId, initialSearchName]);

  const handleSearch = (idVal = searchId, nameVal = searchName) => {
      const dummy = [
          { id: '12951', name: '홍길동', dept: '상품기획팀' },
          { id: '12999', name: '홍길동', dept: '영업기획팀' }, // ★ 동명이인 추가
          { id: '12952', name: '김철수', dept: '물류팀' },
          { id: '12953', name: '이영희', dept: '영업팀' },
          { id: '12954', name: '박지성', dept: '인사팀' },
      ];
      const filtered = dummy.filter(e => {
          if (idVal && e.id !== idVal) return false;
          if (nameVal && !e.name.includes(nameVal)) return false;
          return true;
      });
      setItems(filtered);
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white border border-gray-400 shadow-2xl w-[500px] flex flex-col h-[400px]">
          <div className="bg-[#444444] text-white flex items-center justify-between px-4 h-9 flex-shrink-0">
            <span className="font-bold text-[13px]">사원 조회</span>
            <button onClick={onClose} className="hover:text-red-400"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-3 border-b border-gray-300">
              <div className="flex gap-2">
                  <Input className="h-7 text-[12px] w-24" placeholder="사번" value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                  <Input className="h-7 text-[12px] flex-1" placeholder="사원명" value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                  <Button className="h-7 px-4 text-[12px] bg-[#00a9ce] text-white hover:bg-[#0098ba]" onClick={() => handleSearch()}>조회</Button>
              </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
              <Table className="border border-gray-300 w-full text-[12px] table-fixed">
                  <TableHeader className="bg-[#f4f4f4] sticky top-0">
                      <TableRow className="h-8">
                          <TableHead className="text-center border-r w-[100px]">사번</TableHead>
                          <TableHead className="text-center border-r w-[150px]">사원명</TableHead>
                          <TableHead className="text-center w-[200px]">부서</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {items.map(item => (
                          <TableRow key={item.id} className="h-7 cursor-pointer hover:bg-blue-50" onClick={() => { onSelect(item); onClose(); }}>
                              <TableCell className="text-center border-r font-bold text-gray-800">{item.id}</TableCell>
                              <TableCell className="text-center border-r">{item.name}</TableCell>
                              <TableCell className="text-center text-gray-600">{item.dept}</TableCell>
                          </TableRow>
                      ))}
                      {items.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-gray-500">조회된 사원이 없습니다.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
        </div>
      </div>
  );
}