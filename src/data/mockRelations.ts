import { CustomsBroker, AlbumBatch } from '../types';


export const MOCK_CUSTOMS_BROKERS: CustomsBroker[] = [
  { no: 1, code: 'HR00007', name: '와이지플러스' },
  { no: 2, code: 'HR00006', name: '에스엠라이프' },
  { no: 3, code: 'HR00005', name: '서울미디어' },
  { no: 4, code: 'HR00004', name: '조은뮤직' },
  { no: 5, code: 'HR00003', name: '엔쓰리컴퍼니' },
  { no: 6, code: 'HR00002', name: '뮤직앤뉴' },
  { no: 7, code: 'HR00001', name: '엠투엠코리아(주)' }
];


export const MOCK_ALBUM_BATCHES: AlbumBatch[] = [
  { supplierCode: '01B0039', supplierName: '워너뮤직코리아', batch: '1차', gayo: 1, pop: 1, classic: 1, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0044', supplierName: '소니뮤직엔터테인먼트코리아', batch: '1차', gayo: 1, pop: 1, classic: 1, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0078', supplierName: '포니캐년코리아', batch: '1차', gayo: 1, pop: 1, classic: 1, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0264', supplierName: '엠앤브이', batch: '1차', gayo: 0, pop: 0, classic: 0, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0279', supplierName: '서울미디어', batch: '1차', gayo: 1, pop: 1, classic: 1, dvd: 0, useYn: '사용' },
  { supplierCode: '01B0311', supplierName: '케이티지니뮤직(KT)', batch: '1차', gayo: 1, pop: 1, classic: 1, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0342', supplierName: '엠투엠코리아(주)', batch: '1차', gayo: 1, pop: 1, classic: 1, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0355', supplierName: '오이일이뮤직', batch: '2차', gayo: 1, pop: 1, classic: 1, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0373', supplierName: '해리슨앤컴퍼니', batch: '2차', gayo: 0, pop: 0, classic: 0, dvd: 1, useYn: '사용' },
  { supplierCode: '01B0380', supplierName: '에스엠엔터테인먼트', batch: 'free', gayo: 1, pop: 1, classic: 0, dvd: 1, useYn: '사용' },
];