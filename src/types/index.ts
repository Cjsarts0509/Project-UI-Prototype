export interface CommonCode { code: string; name: string; }

export interface Supplier { 
  code: string; name: string; businessRegistrationNumber: string | number; 
  purchaseTypeCode: string | number; purchaseType: string; statusCode: string | number; 
  status: string; categoryCode: string; category: string; customsBrokerCode: string; customsBrokerName: string; 
  ceoName?: string; phoneNumber?: string;
}

export interface SupplierItem {
  supplierCode: string;
  itemCode: string | number;
  itemName: string;
  itemDescription?: string;
}

export interface Category { code: string; name: string; }
export interface Status { code: string; name: string; }
export interface SupplierCategory { code: string; name: string; }

// ★ 운송통관사 타입 추가
export interface CustomsBroker {
  no: number;
  code: string;
  name: string;
}

// ★ 음반차수 타입 추가
export interface AlbumBatch {
  supplierCode: string;
  supplierName: string;
  batch: string;
  gayo: number;
  pop: number;
  classic: number;
  dvd: number;
  useYn: string;
}

// ★ 상품 데이터 타입 완벽 반영 (23개 컬럼)
export interface Product {
  productCode: string;          
  productName: string;          
  initialReleasePrice: string;  
  listPrice: string;            
  purchaseRate: string;         
  supplierCode: string;         
  supplierName: string;         
  supplierItemCode: string;     
  supplierItemName: string;     
  purchaseType: string;         
  centerOrderYn: string;        
  groupCategory: string;        
  hdcName: string;              
  productCategory: string;      
  registrationDate: string;     
  productStatus: string;        
  registrant: string;           
  orderNo: string;              
  foreignCurrencyPrice: string; 
  artistCode: string;           
  artistName: string;           
  media: string;                
  labelName: string;            
  releaseDate: string;          
  fobPrice: string;             
  logisticsUnit?: string;       // 물류사용단위 (예: DZ, BOX 등)
  logisticsUnitQty?: number;    // 물류사용단위 수량 (예: 12 = 1DZ당 EA수)
  productNumber?: string;       // 제품번호 (음반주문번호)
}