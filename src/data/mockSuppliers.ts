import { Supplier, SupplierItem } from '../types';

export const MOCK_SUPPLIERS: Supplier[] = [
  { code: '01B0470', name: '드림어스컴퍼니', businessRegistrationNumber: '2148629288', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: 'B', category: '음반', customsBrokerCode: 'HR00001', customsBrokerName: '엠투엠코리아㈜', ceoName: '서정환', phoneNumber: '02-3444-0211' },
  { code: '01B0478', name: '와이지플러스', businessRegistrationNumber: '1208167338', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: 'B', category: '음반', customsBrokerCode: 'HR00007', customsBrokerName: '와이지플러스', ceoName: '황보경', phoneNumber: '02-2144-9700' },
  { code: '01B0479', name: '케이티지니뮤직(씨제이-엠투엠)', businessRegistrationNumber: '3148103453', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: 'B', category: '음반', customsBrokerCode: 'HR00001', customsBrokerName: '엠투엠코리아㈜', ceoName: '이정호', phoneNumber: '02-2016-5555' },
  { code: '01B0504', name: '카카오엔터테인먼트', businessRegistrationNumber: '2208802594', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: 'B', category: '음반', customsBrokerCode: 'HR00005', customsBrokerName: '서울미디어', ceoName: '정신아,김성수', phoneNumber: '1644-4755' },
  { code: '01B0509', name: '와이지플러스(빅히트뮤직)', businessRegistrationNumber: '2448802192', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: 'B', category: '음반', customsBrokerCode: 'HR00007', customsBrokerName: '와이지플러스', ceoName: '황보경', phoneNumber: '02-2144-9700' },
  { code: '01B0510', name: '와이지플러스(플레디스엔터)', businessRegistrationNumber: '2118846472', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: 'B', category: '음반', customsBrokerCode: 'HR00007', customsBrokerName: '와이지플러스', ceoName: '황보경', phoneNumber: '02-2144-9700' },
  { code: '01B0521', name: '와이지플러스(KOZ엔터)', businessRegistrationNumber: '3608101195', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: 'B', category: '음반', customsBrokerCode: 'HR00007', customsBrokerName: '와이지플러스', ceoName: '황보경', phoneNumber: '02-2144-9700' },
  { code: '0800448', name: '아톰상사(직매입)', businessRegistrationNumber: '2148169437', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '김태우', phoneNumber: '02-2268-7771' },
  { code: '0803124', name: '아톰상사(특정매입)', businessRegistrationNumber: '2148169437', purchaseTypeCode: 503, purchaseType: '위탁', statusCode: '002', status: '정상', categoryCode: '6', category: '특정매입', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '김태우', phoneNumber: '02-2268-7771' },
  { code: '0800586', name: '짐모아(직매입)', businessRegistrationNumber: '6048123745', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '이상민', phoneNumber: '031-944-4000' },
  { code: '0800618', name: '동아교재(직매입)', businessRegistrationNumber: '3068101003', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '박강휘,양종모', phoneNumber: '031-955-3100' },
  { code: '0800666', name: '모나미(직매입)', businessRegistrationNumber: '1208108227', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '송하경', phoneNumber: '031-329-8600' },
  { code: '0803833', name: '모나미(특정매입)', businessRegistrationNumber: '1208108227', purchaseTypeCode: 503, purchaseType: '위탁', statusCode: '002', status: '정상', categoryCode: '6', category: '특정매입', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '송하경', phoneNumber: '031-329-8600' },
  { code: '0811137', name: '한양오티에스(직매입)', businessRegistrationNumber: '1108183200', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '최영길', phoneNumber: '02-717-3000' },
  { code: '0815165', name: '한국파이롯트(직매입)', businessRegistrationNumber: '1298104062', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '김영호', phoneNumber: '02-2632-9150' },
  { code: '0817037', name: '앞썬아이앤씨(직매입)', businessRegistrationNumber: '2158629618', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '정회덕', phoneNumber: '031-949-2345' },
  { code: '0900216', name: 'LEUCHTTURM', businessRegistrationNumber: '#', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '-', phoneNumber: '-' },
  { code: '0900224', name: 'LIHIT LAB.,INC', businessRegistrationNumber: '#', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '-', phoneNumber: '-' },
  { code: '0900252', name: 'HIGHTIDE CO.,LTD', businessRegistrationNumber: '#', purchaseTypeCode: 501, purchaseType: '직매입', statusCode: '002', status: '정상', categoryCode: '8', category: '생산자', customsBrokerCode: '#', customsBrokerName: '#', ceoName: '-', phoneNumber: '-' }
];

export const MOCK_SUPPLIER_ITEMS: SupplierItem[] = [
  { supplierCode: '01B0470', itemCode: '001', itemName: '기본' }, { supplierCode: '01B0478', itemCode: '001', itemName: '기본' },
  { supplierCode: '01B0479', itemCode: '001', itemName: '기본' }, { supplierCode: '01B0504', itemCode: '001', itemName: '기본' },
  { supplierCode: '01B0509', itemCode: '001', itemName: '기본' }, { supplierCode: '01B0510', itemCode: '001', itemName: '기본' },
  { supplierCode: '01B0521', itemCode: '001', itemName: '기본' }, { supplierCode: '0800448', itemCode: '001', itemName: '기본' },
  { supplierCode: '0803124', itemCode: '001', itemName: 'APICA' }, { supplierCode: '0800586', itemCode: '001', itemName: '기본' },
  { supplierCode: '0800618', itemCode: '001', itemName: '기본' }, { supplierCode: '0800666', itemCode: '001', itemName: '기본' },
  { supplierCode: '0800666', itemCode: '002', itemName: '톰보' }, { supplierCode: '0803833', itemCode: '001', itemName: '기본' },
  { supplierCode: '0803833', itemCode: '002', itemName: '몰스킨' }, { supplierCode: '0811137', itemCode: '001', itemName: '기본' },
  { supplierCode: '0815165', itemCode: '001', itemName: '기본' }, { supplierCode: '0817037', itemCode: '001', itemName: '기본' },
  { supplierCode: '0900216', itemCode: '001', itemName: '기본' }, { supplierCode: '0900224', itemCode: '001', itemName: '기본' },
  { supplierCode: '0900252', itemCode: '001', itemName: '기본' }
];