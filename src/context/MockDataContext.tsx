import React, { createContext, useContext, useState } from 'react';
import { Product, Supplier, SupplierItem, Category, SupplierCategory, Status, CommonCode, CustomsBroker, AlbumBatch } from '../types';

// 기존 목업 데이터
import { MOCK_CATEGORIES, MOCK_STATUSES, MOCK_SUPPLIER_CATEGORIES } from '../data/mockCategories';
import { MOCK_SUPPLIERS, MOCK_SUPPLIER_ITEMS } from '../data/mockSuppliers';
import { MOCK_PRODUCT_LIST } from '../data/mockProducts'; // ★ INITIAL_PRODUCTS 제거됨

// 신규 추가된 관계 데이터 및 공통코드
import { MOCK_CUSTOMS_BROKERS, MOCK_ALBUM_BATCHES } from '../data/mockRelations';
import * as CommonCodes from '../data/mockCommonCodes';

interface MockDataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  suppliers: Supplier[];
  supplierItems: SupplierItem[]; 
  categories: Category[];
  supplierCategories: SupplierCategory[];
  statuses: Status[];
  
  // 신규 데이터 접근자
  customsBrokers: CustomsBroker[];
  albumBatches: AlbumBatch[];
  commonCodes: typeof CommonCodes;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider = ({ children }: { children: React.ReactNode }) => {
  // ★ 오직 완벽하게 세팅된 MOCK_PRODUCT_LIST만 바라보도록 수정
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCT_LIST);

  return (
    <MockDataContext.Provider value={{ 
      products, 
      setProducts, 
      suppliers: MOCK_SUPPLIERS,
      supplierItems: MOCK_SUPPLIER_ITEMS,
      categories: MOCK_CATEGORIES,
      supplierCategories: MOCK_SUPPLIER_CATEGORIES,
      statuses: MOCK_STATUSES,

      // 신규 데이터 연결
      customsBrokers: MOCK_CUSTOMS_BROKERS,
      albumBatches: MOCK_ALBUM_BATCHES,
      commonCodes: CommonCodes
    }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) throw new Error('useMockData must be used within MockDataProvider');
  return context;
};