import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// 다른 화면에서도 미디어 코드를 참조할 수 있도록 export 합니다.
export const MEDIA_CODES = [
  { code: '166', name: 'MC' }, { code: '167', name: 'Video' }, { code: '168', name: 'CD' },
  { code: '169', name: 'LP' }, { code: '170', name: '부속' }, { code: '172', name: 'MD' },
  { code: '173', name: 'DVD' }, { code: '174', name: 'DVD Audio' }, { code: '175', name: 'SACD' },
  { code: '176', name: 'SACD HYBRID' }, { code: '177', name: 'XRCD' }, { code: '178', name: 'BLU-RAY DISC' },
  { code: '179', name: 'CD-ROM' }, { code: '180', name: 'HD-DVD' }, { code: '181', name: '화보집' },
  { code: '182', name: 'DIGITAL-DISC' }, { code: '183', name: 'UMD' }, { code: '184', name: 'Book' },
  { code: '185', name: 'Video Product' }, { code: '186', name: 'LD' }, { code: '187', name: '음원' },
  { code: '188', name: 'VCD' }, { code: '189', name: 'DM' }, { code: '190', name: 'BLU-RAY AUDIO' }
];

export function MediaSearchModal({ isOpen, onClose, initialSearchName, onSelect }: any) {
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [results, setResults] = useState(MEDIA_CODES);

  useEffect(() => {
    if (isOpen) {
      setSearchName(initialSearchName || '');
      setSearchCode('');
      handleSearch('', initialSearchName || '');
    }
  }, [isOpen, initialSearchName]);

  const handleSearch = (code: string, name: string) => {
    setResults(MEDIA_CODES.filter(m => 
      (code ? m.code.includes(code) : true) && 
      (name ? m.name.toLowerCase().includes(name.toLowerCase()) : true)
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-[400px] flex flex-col overflow-hidden text-[12px]">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-[14px] text-gray-900">미디어 조회</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold">✕</button>
        </div>
        <div className="p-3 bg-gray-100 flex gap-2 border-b border-gray-200">
           <Input className="h-7 flex-1 text-[12px] bg-white" placeholder="미디어코드" value={searchCode} onChange={e => setSearchCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch(searchCode, searchName)} />
           <Input className="h-7 flex-1 text-[12px] bg-white" placeholder="미디어명" value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch(searchCode, searchName)} />
           <Button className="h-7 px-3 bg-gray-600 text-white text-[12px] hover:bg-gray-700 font-bold" onClick={() => handleSearch(searchCode, searchName)}>조회</Button>
        </div>
        <div className="flex-1 overflow-auto max-h-[300px] p-2">
           <Table>
             <TableHeader className="bg-gray-100 sticky top-0"><TableRow className="h-7"><TableHead className="text-center py-1 font-bold text-gray-900">코드</TableHead><TableHead className="text-center py-1 font-bold text-gray-900">미디어명</TableHead></TableRow></TableHeader>
             <TableBody>
               {results.map(m => (
                 <TableRow key={m.code} className="cursor-pointer hover:bg-blue-50 h-7 border-b border-gray-200" onClick={() => { onSelect(m); onClose(); }}>
                   <TableCell className="text-center py-1 font-medium text-gray-700">{m.code}</TableCell>
                   <TableCell className="text-center py-1 text-gray-900 font-bold">{m.name}</TableCell>
                 </TableRow>
               ))}
               {results.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-6 text-gray-500">조회 결과가 없습니다.</TableCell></TableRow>}
             </TableBody>
           </Table>
        </div>
      </div>
    </div>
  );
}