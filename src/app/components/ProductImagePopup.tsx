import React, { useEffect, useRef, useState } from 'react';
import { X, ImageOff } from 'lucide-react';

/**
 * 상품이미지조회 팝업
 * - 화면 위에 떠 있는 창(모달 아님): 열어 둔 채로 그리드의 다른 줄을 누르면
 *   그 줄의 상품 이미지로 바로 바뀐다.
 * - 머리줄을 끌어 옮길 수 있다.
 * - 상품에 imageUrl 이 있으면 그 이미지를, 없으면 상품코드 · 상품명으로 그린 예시 이미지를 보여 준다.
 */

export interface ProductImageTarget {
  productCode: string;
  productName: string;
  brand?: string;
  groupCategory?: string;
  listPrice?: number | string;
  imageUrl?: string;
}

interface ProductImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductImageTarget | null;
}

const WIDTH = 360;

// 조분류마다 바탕색을 고정해 같은 분류는 같은 색으로 보이게 한다
const PALETTE = ['#4f7cac', '#c0634a', '#5a9a6e', '#8a6bb0', '#c79a3b', '#3f8f9b', '#b0577f', '#6b7a8f'];
const hashOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 상품명을 몇 글자씩 끊어 여러 줄로
const wrap = (text: string, perLine: number, maxLines: number) => {
  const lines: string[] = [];
  let rest = text;
  while (rest.length > 0 && lines.length < maxLines) {
    lines.push(rest.slice(0, perLine));
    rest = rest.slice(perLine);
  }
  if (rest.length > 0) lines[lines.length - 1] = lines[lines.length - 1].slice(0, perLine - 1) + '…';
  return lines;
};

/** 실제 이미지가 없을 때 쓰는 예시 이미지 (SVG data URI) */
export function buildSampleProductImage(p: ProductImageTarget): string {
  const color = PALETTE[hashOf(p.groupCategory || p.productCode) % PALETTE.length];
  const brandMatch = p.productName.match(/^\[([^\]]+)\]/);
  const brand = (p.brand && p.brand !== '-' ? p.brand : brandMatch?.[1]) || p.groupCategory || '';
  const name = p.productName.replace(/^\[[^\]]+\]\s*/, '');
  const nameLines = wrap(name, 14, 3);

  // 상품코드 숫자로 바코드 모양 줄무늬
  const digits = p.productCode.replace(/[^0-9]/g, '') || '0';
  let x = 110;
  let bars = '';
  for (let i = 0; i < digits.length && x < 290; i++) {
    const d = Number(digits[i]);
    const w = 1 + (d % 3);
    bars += `<rect x="${x}" y="318" width="${w}" height="34" fill="#222"/>`;
    x += w + 1 + ((d + i) % 3);
    bars += `<rect x="${x}" y="318" width="1" height="34" fill="#222"/>`;
    x += 3;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f3f4f6"/>
  <rect x="70" y="40" width="260" height="330" rx="10" fill="${color}"/>
  <rect x="70" y="40" width="260" height="70" rx="10" fill="#000" fill-opacity="0.15"/>
  <text x="200" y="84" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${escapeXml(brand.slice(0, 12))}</text>
  ${nameLines
    .map(
      (l, i) =>
        `<text x="200" y="${170 + i * 30}" font-family="sans-serif" font-size="19" font-weight="700" fill="#fff" text-anchor="middle">${escapeXml(l)}</text>`
    )
    .join('')}
  <rect x="100" y="308" width="200" height="54" fill="#fff"/>
  ${bars}
  <text x="200" y="390" font-family="monospace" font-size="14" fill="#555" text-anchor="middle">${escapeXml(p.productCode)}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ProductImagePopup({ isOpen, onClose, product }: ProductImagePopupProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 처음 열 때 화면 오른쪽, 조회조건 버튼 아래쪽에 띄운다
  useEffect(() => {
    if (isOpen) setPosition({ x: Math.max(16, window.innerWidth - WIDTH - 40), y: Math.max(16, Math.min(280, window.innerHeight - 540)) });
  }, [isOpen]);

  // 상품이 바뀌면 이미지 오류 표시를 초기화
  useEffect(() => setImgFailed(false), [product?.productCode, product?.imageUrl]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = Math.min(Math.max(0, e.clientX - dragStart.current.x), window.innerWidth - 80);
      const y = Math.min(Math.max(0, e.clientY - dragStart.current.y), window.innerHeight - 40);
      setPosition({ x, y });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const src = product ? product.imageUrl || buildSampleProductImage(product) : '';
  const isSample = !!product && !product.imageUrl;
  const price = product?.listPrice !== undefined && product?.listPrice !== '' ? Number(product.listPrice) : NaN;

  return (
    <div
      style={{ position: 'fixed', left: position.x, top: position.y, width: WIDTH, zIndex: 150 }}
      className="bg-white rounded-[4px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-[12px] font-sans border border-gray-500"
    >
      <div
        className="bg-[#444444] text-white flex items-center justify-between px-3 h-9 flex-shrink-0 cursor-move select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }}
      >
        <span className="font-bold text-[13px]">상품이미지조회</span>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="hover:text-red-400 cursor-pointer"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-[#fefefe] p-3 flex flex-col gap-2">
        <div className="w-full aspect-square border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
          {!product ? (
            <span className="text-gray-400 font-bold text-center px-4">
              그리드에서 항목을 누르면
              <br />
              상품 이미지가 표시됩니다.
            </span>
          ) : imgFailed ? (
            <div className="flex flex-col items-center gap-2 text-gray-400 font-bold">
              <ImageOff className="w-8 h-8" />
              이미지 등록 없음
            </div>
          ) : (
            <img
              key={product.productCode}
              src={src}
              alt={product.productName}
              className="w-full h-full object-contain"
              onError={() => setImgFailed(true)}
            />
          )}
        </div>

        {product && (
          <div className="grid grid-cols-[64px_1fr] border border-gray-200 text-[11px]">
            <div className="bg-[#eef3f8] px-2 py-1 font-bold text-blue-600 border-b border-r border-gray-200 text-right">상품코드</div>
            <div className="px-2 py-1 border-b border-gray-200 font-bold">{product.productCode}</div>
            <div className="bg-[#eef3f8] px-2 py-1 font-bold text-blue-600 border-b border-r border-gray-200 text-right">상품명</div>
            <div className="px-2 py-1 border-b border-gray-200 break-all">{product.productName}</div>
            <div className="bg-[#eef3f8] px-2 py-1 font-bold text-blue-600 border-r border-gray-200 text-right">정가</div>
            <div className="px-2 py-1">{Number.isFinite(price) ? `${price.toLocaleString()}원` : '-'}</div>
          </div>
        )}

        {isSample && !imgFailed && (
          <p className="text-[10px] text-gray-400">※ 예시 이미지입니다 (상품 이미지 연동 전).</p>
        )}
      </div>
    </div>
  );
}
