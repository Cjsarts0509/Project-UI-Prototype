// 점포별 공용알바 공제 더미 데이터 — (광화문점/강남점/창원점) 2026년 2월 실자료 기반
export interface DeductionSupplier {
  code: string;
  name: string;
  itemCode: string;
  itemName: string;
  type: 'N' | 'R' | 'A' | 'E';
  sales: number;
  excludeSales: number;
  fixedRate?: number;
  fixedAmount?: number;
  // 매입처 행 단위 감사 필드 (스토리보드: 추가 시점 / 수정 시점 자동 기록)
  regDate?: string;
  regEmpNo?: string;
  regName?: string;
  modDate?: string;
  modEmpNo?: string;
  modName?: string;
}

export interface DeductionMaster {
  id: string;
  yearMonth: string;
  storeCode: string;
  storeName: string;
  totalLaborCost: number;
  status: '작성중' | '확정';
  finalConfirmed: 'Y' | 'N';
  ifasSent: 'Y' | 'N';
  ifasSentDate: string;
  regDate: string;
  regEmpNo: string;
  regName: string;
  finalConfirmDate: string;
  finalConfirmEmpNo: string;
  finalConfirmName: string;
  note: string;
  suppliers: DeductionSupplier[];
}

export const MOCK_DEDUCTION_MASTERS: DeductionMaster[] = [
  {
    id: 'AB20260200100001',
    yearMonth: '2026-02',
    storeCode: '001',
    storeName: '광화문점',
    totalLaborCost: 18513674,
    status: '작성중',
    finalConfirmed: 'N',
    ifasSent: 'N',
    ifasSentDate: '',
    regDate: '2026-03-05',
    regEmpNo: '2024001',
    regName: '조준수',
    finalConfirmDate: '',
    finalConfirmEmpNo: '',
    finalConfirmName: '',
    note: '',
    suppliers: [
      { code: '0803741', name: 'BST', itemCode: 'IC0374100', itemName: 'BST 일반', type: 'N', sales: 1316370, excludeSales: 0 },
      { code: '0803791', name: '공장', itemCode: 'IC0379100', itemName: '공장 일반', type: 'N', sales: 2146540, excludeSales: 0 },
      { code: '0816555', name: '냐냐온 스튜디오', itemCode: 'IC0655500', itemName: '냐냐온 스튜디오 일반', type: 'N', sales: 1519590, excludeSales: 0 },
      { code: '0817528', name: '누크코퍼레이션', itemCode: 'IC0752800', itemName: '누크코퍼레이션 일반', type: 'N', sales: 2874840, excludeSales: 0 },
      { code: '0807485', name: '대시앤도트', itemCode: 'IC0748500', itemName: '대시앤도트 일반', type: 'N', sales: 3353020, excludeSales: 0 },
      { code: '0817625', name: '대인커머스', itemCode: 'IC0762500', itemName: '대인커머스 일반', type: 'N', sales: 3231320, excludeSales: 0 },
      { code: '0816903', name: '더시호', itemCode: 'IC0690300', itemName: '더시호 일반', type: 'N', sales: 1860110, excludeSales: 0 },
      { code: '0818620', name: '더토브', itemCode: 'IC0862000', itemName: '더토브 일반', type: 'N', sales: 17616460, excludeSales: 0 },
      { code: '0817225', name: '도혜드로잉', itemCode: 'IC0722500', itemName: '도혜드로잉 일반', type: 'N', sales: 3288170, excludeSales: 0 },
      { code: '0810456', name: '디앤에프조이필', itemCode: 'IC0045600', itemName: '디앤에프조이필 일반', type: 'N', sales: 2122860, excludeSales: 0 },
      { code: '0818173', name: '디에스컴퍼니', itemCode: 'IC0817300', itemName: '디에스컴퍼니 일반', type: 'N', sales: 642520, excludeSales: 0 },
      { code: '0811335', name: '디자인랩', itemCode: 'IC0133500', itemName: '디자인랩 일반', type: 'N', sales: 1786780, excludeSales: 0 },
      { code: '0807002', name: '디자인피그', itemCode: 'IC0700200', itemName: '디자인피그 일반', type: 'N', sales: 1354810, excludeSales: 0 },
      { code: '0803503', name: '로마네', itemCode: 'IC0350300', itemName: '로마네 일반', type: 'N', sales: 12283310, excludeSales: 0 },
      { code: '0816525', name: '루카랩컴퍼니', itemCode: 'IC0652500', itemName: '루카랩컴퍼니 일반', type: 'N', sales: 3138900, excludeSales: 0 },
      { code: '0816579', name: '모노라이크엘앤비', itemCode: 'IC0657900', itemName: '모노라이크엘앤비 일반', type: 'N', sales: 2712580, excludeSales: 0 },
      { code: '0815261', name: '모먼트디자인', itemCode: 'IC0526100', itemName: '모먼트디자인 일반', type: 'N', sales: 0, excludeSales: 0 },
      { code: '0812988', name: '모트모트', itemCode: 'IC0298800', itemName: '모트모트 일반', type: 'N', sales: 11309300, excludeSales: 0 },
      { code: '0813069', name: '바이나쿠', itemCode: 'IC0306900', itemName: '바이나쿠 일반', type: 'N', sales: 605990, excludeSales: 0 },
      { code: '0814818', name: '바이인터내셔널', itemCode: 'IC0481800', itemName: '바이인터내셔널 일반', type: 'N', sales: 1197430, excludeSales: 0 },
      { code: '0811795', name: '베르제마넷', itemCode: 'IC0179500', itemName: '베르제마넷 일반', type: 'N', sales: 8418860, excludeSales: 0 },
      { code: '0817604', name: '비온뒤', itemCode: 'IC0760400', itemName: '비온뒤 일반', type: 'N', sales: 12482440, excludeSales: 0 },
      { code: '0810863', name: '서원씨엔케이', itemCode: 'IC0086300', itemName: '서원씨엔케이 일반', type: 'N', sales: 0, excludeSales: 0 },
      { code: '0803289', name: '솜씨스템프', itemCode: 'IC0328900', itemName: '솜씨스템프 일반', type: 'N', sales: 5172680, excludeSales: 0 },
      { code: '0815173', name: '수앙스', itemCode: 'IC0517300', itemName: '수앙스 일반', type: 'N', sales: 416310, excludeSales: 0 },
      { code: '0818498', name: '수키도키', itemCode: 'IC0849800', itemName: '수키도키 일반', type: 'N', sales: 2170040, excludeSales: 0 },
      { code: '0803222', name: '아르디움', itemCode: 'IC0322200', itemName: '아르디움 일반', type: 'N', sales: 6096510, excludeSales: 0 },
      { code: '0816628', name: '아이썬북', itemCode: 'IC0662800', itemName: '아이썬북 일반', type: 'N', sales: 7085580, excludeSales: 0 },
      { code: '0803186', name: '아이코닉', itemCode: 'IC0318600', itemName: '아이코닉 일반', type: 'N', sales: 14034000, excludeSales: 0 },
      { code: '0803159', name: '안테나샵', itemCode: 'IC0315900', itemName: '안테나샵 일반', type: 'N', sales: 7266730, excludeSales: 0 },
      { code: '0815608', name: '알로아라', itemCode: 'IC0560800', itemName: '알로아라 일반', type: 'N', sales: 2183500, excludeSales: 0 },
      { code: '0814876', name: '에이치엠플러스', itemCode: 'IC0487600', itemName: '에이치엠플러스 일반', type: 'N', sales: 3913120, excludeSales: 0 },
      { code: '0816312', name: '엠젯패밀리', itemCode: 'IC0631200', itemName: '엠젯패밀리 일반', type: 'N', sales: 8973320, excludeSales: 0 },
      { code: '0803303', name: '이투컬렉션', itemCode: 'IC0330300', itemName: '이투컬렉션 일반', type: 'N', sales: 4907920, excludeSales: 0 },
      { code: '0803690', name: '인디고', itemCode: 'IC0369000', itemName: '인디고 일반', type: 'N', sales: 14626130, excludeSales: 0 },
      { code: '0803825', name: '정인통상', itemCode: 'IC0382500', itemName: '정인통상 일반', type: 'N', sales: 8498630, excludeSales: 0 },
      { code: '0816921', name: '체리블로섬', itemCode: 'IC0692100', itemName: '체리블로섬 일반', type: 'N', sales: 1924140, excludeSales: 0 },
      { code: '0803187', name: '칠삼이일', itemCode: 'IC0318700', itemName: '칠삼이일 일반', type: 'N', sales: 9026740, excludeSales: 0 },
      { code: '0811513', name: '캘리엠', itemCode: 'IC0151300', itemName: '캘리엠 일반', type: 'N', sales: 4626670, excludeSales: 0 },
      { code: '0816769', name: '컴포지션스튜디오', itemCode: 'IC0676900', itemName: '컴포지션스튜디오 일반', type: 'N', sales: 1270200, excludeSales: 0 },
      { code: '0810588', name: '케이디코퍼레이션(구,오첵)', itemCode: 'IC0058800', itemName: '케이디코퍼레이션(구,오첵) 일반', type: 'N', sales: 8476620, excludeSales: 0 },
      { code: '0803702', name: '케이아트컴퍼니(구,케이페이퍼)', itemCode: 'IC0370200', itemName: '케이아트컴퍼니(구,케이페이퍼) 일반', type: 'N', sales: 1293770, excludeSales: 0 },
      { code: '0816201', name: '콤래드', itemCode: 'IC0620100', itemName: '콤래드 일반', type: 'N', sales: 785820, excludeSales: 0 },
      { code: '0818036', name: '페펜스튜디오(구,워너디스)', itemCode: 'IC0803600', itemName: '페펜스튜디오(구,워너디스) 일반', type: 'N', sales: 3907690, excludeSales: 0 },
      { code: '0803267', name: '플레플레', itemCode: 'IC0326700', itemName: '플레플레 일반', type: 'N', sales: 3284560, excludeSales: 0 },
      { code: '0807497', name: '학산', itemCode: 'IC0749700', itemName: '학산 일반', type: 'N', sales: 2576940, excludeSales: 0 },
      { code: '0817135', name: '해피썬', itemCode: 'IC0713500', itemName: '해피썬 일반', type: 'N', sales: 15220940, excludeSales: 0 },
      { code: '0810974', name: '헤른후트', itemCode: 'IC0097400', itemName: '헤른후트 일반', type: 'N', sales: 2026910, excludeSales: 0 },
      { code: '0807481', name: '골드디자인', itemCode: 'IC0748100', itemName: '골드디자인 일반', type: 'N', sales: 8784790, excludeSales: 0 },
      { code: '0811452', name: '누리플러스', itemCode: 'IC0145200', itemName: '누리플러스 일반', type: 'N', sales: 4330350, excludeSales: 0 },
      { code: '0818289', name: '대원미디어/닌텐도', itemCode: 'IC0828900', itemName: '대원미디어/닌텐도 일반', type: 'N', sales: 8242970, excludeSales: 0 },
      { code: '0817681', name: '롤리조쓰컴퍼니', itemCode: 'IC0768100', itemName: '롤리조쓰컴퍼니 일반', type: 'N', sales: 8604930, excludeSales: 0 },
      { code: '0816796', name: '마이누', itemCode: 'IC0679600', itemName: '마이누 일반', type: 'N', sales: 9144260, excludeSales: 0 },
      { code: '0818304', name: '상상스퀘어', itemCode: 'IC0830400', itemName: '상상스퀘어 일반', type: 'N', sales: 1512840, excludeSales: 0 },
      { code: '0818037', name: '신한커머스/로디아', itemCode: 'IC0803700', itemName: '신한커머스/로디아 일반', type: 'N', sales: 2708810, excludeSales: 0 },
      { code: '0817389', name: '에스앤에스테크놀러지', itemCode: 'IC0738900', itemName: '에스앤에스테크놀러지 일반', type: 'N', sales: 2948450, excludeSales: 0 },
      { code: '0810708', name: '워프', itemCode: 'IC0070800', itemName: '워프 일반', type: 'N', sales: 2547060, excludeSales: 0 },
      { code: '0818298', name: '위올(ouior)', itemCode: 'IC0829800', itemName: '위올(ouior) 일반', type: 'N', sales: 4044250, excludeSales: 0 },
      { code: '0806798', name: '이가라인유통', itemCode: 'IC0679800', itemName: '이가라인유통 일반', type: 'N', sales: 14989050, excludeSales: 0 },
      { code: '0818089', name: '이브이큐', itemCode: 'IC0808900', itemName: '이브이큐 일반', type: 'N', sales: 3681950, excludeSales: 0 },
      { code: '0816821', name: '프롬더페이지', itemCode: 'IC0682100', itemName: '프롬더페이지 일반', type: 'N', sales: 8186680, excludeSales: 0 },
      { code: '0817530', name: '후추더페퍼', itemCode: 'IC0753000', itemName: '후추더페퍼 일반', type: 'N', sales: 2445440, excludeSales: 0 },
    ],
  },
  {
    id: 'AB20260200200002',
    yearMonth: '2026-02',
    storeCode: '002',
    storeName: '강남점',
    totalLaborCost: 10217369,
    status: '작성중',
    finalConfirmed: 'N',
    ifasSent: 'N',
    ifasSentDate: '',
    regDate: '2026-03-05',
    regEmpNo: '2024001',
    regName: '조준수',
    finalConfirmDate: '',
    finalConfirmEmpNo: '',
    finalConfirmName: '',
    note: '',
    suppliers: [
      { code: '0803144', name: '씨케이세일즈', itemCode: 'IC0314400', itemName: '씨케이세일즈 일반', type: 'N', sales: 17270650, excludeSales: 3071040 },
      { code: '0803527', name: '프론티어통상', itemCode: 'IC0352700', itemName: '프론티어통상 일반', type: 'N', sales: 10683650, excludeSales: 0 },
      { code: '0803503', name: '로마네', itemCode: 'IC0350300', itemName: '로마네 일반', type: 'N', sales: 8840720, excludeSales: 0 },
      { code: '0806798', name: '이가라인유통', itemCode: 'IC0679800', itemName: '이가라인유통 일반', type: 'N', sales: 8586300, excludeSales: 0 },
      { code: '0812988', name: '모트모트', itemCode: 'IC0298800', itemName: '모트모트 일반', type: 'N', sales: 8387620, excludeSales: 0 },
      { code: '0803690', name: '인디고', itemCode: 'IC0369000', itemName: '인디고 일반', type: 'N', sales: 8253250, excludeSales: 0 },
      { code: '0817604', name: '비온뒤', itemCode: 'IC0760400', itemName: '비온뒤 일반', type: 'N', sales: 7953160, excludeSales: 0 },
      { code: '0803158', name: '바이풀디자인', itemCode: 'IC0315800', itemName: '바이풀디자인 일반', type: 'N', sales: 6248110, excludeSales: 0 },
      { code: '0816796', name: '마이누', itemCode: 'IC0679600', itemName: '마이누 일반', type: 'N', sales: 4807000, excludeSales: 0 },
      { code: '0803187', name: '칠삼이일디자인', itemCode: 'IC0318700', itemName: '칠삼이일디자인 일반', type: 'N', sales: 4724040, excludeSales: 0 },
      { code: '0816312', name: '엠젯패밀리', itemCode: 'IC0631200', itemName: '엠젯패밀리 일반', type: 'N', sales: 4194100, excludeSales: 0 },
      { code: '0803222', name: '아르디움', itemCode: 'IC0322200', itemName: '아르디움 일반', type: 'N', sales: 3995430, excludeSales: 0 },
      { code: '0811795', name: '베르제마넷', itemCode: 'IC0179500', itemName: '베르제마넷 일반', type: 'N', sales: 3906510, excludeSales: 0 },
      { code: '0818036', name: '페펜스튜디오', itemCode: 'IC0803600', itemName: '페펜스튜디오 일반', type: 'N', sales: 3882740, excludeSales: 0 },
      { code: '0803159', name: '안테나샵', itemCode: 'IC0315900', itemName: '안테나샵 일반', type: 'N', sales: 3704260, excludeSales: 0 },
      { code: '0803289', name: '더솜씨', itemCode: 'IC0328900', itemName: '더솜씨 일반', type: 'N', sales: 3638980, excludeSales: 0 },
      { code: '0810588', name: '케이디코퍼레이션', itemCode: 'IC0058800', itemName: '케이디코퍼레이션 일반', type: 'N', sales: 3445740, excludeSales: 0 },
      { code: '0816579', name: '모노라이크엘앤비', itemCode: 'IC0657900', itemName: '모노라이크엘앤비 일반', type: 'N', sales: 3316680, excludeSales: 0 },
      { code: '0816166', name: '해밀', itemCode: 'IC0616600', itemName: '해밀 일반', type: 'N', sales: 3085890, excludeSales: 0 },
      { code: '0816821', name: '프롬더페이지', itemCode: 'IC0682100', itemName: '프롬더페이지 일반', type: 'N', sales: 3055450, excludeSales: 0 },
      { code: '0803825', name: '정인통상', itemCode: 'IC0382500', itemName: '정인통상 일반', type: 'N', sales: 2884070, excludeSales: 0 },
      { code: '0807485', name: '대시앤도트', itemCode: 'IC0748500', itemName: '대시앤도트 일반', type: 'N', sales: 2835520, excludeSales: 0 },
      { code: '0811513', name: '캘리엠', itemCode: 'IC0151300', itemName: '캘리엠 일반', type: 'N', sales: 2657940, excludeSales: 0 },
      { code: '0818089', name: '이브이큐', itemCode: 'IC0808900', itemName: '이브이큐 일반', type: 'N', sales: 2463320, excludeSales: 0 },
      { code: '0816769', name: '컴포지션스튜디오', itemCode: 'IC0676900', itemName: '컴포지션스튜디오 일반', type: 'N', sales: 2269180, excludeSales: 0 },
      { code: '0807002', name: '디자인피그', itemCode: 'IC0700200', itemName: '디자인피그 일반', type: 'N', sales: 2268930, excludeSales: 0 },
      { code: '0814876', name: '에이치엠플러스', itemCode: 'IC0487600', itemName: '에이치엠플러스 일반', type: 'N', sales: 2180900, excludeSales: 0 },
      { code: '0816525', name: '루카랩컴퍼니', itemCode: 'IC0652500', itemName: '루카랩컴퍼니 일반', type: 'N', sales: 2113400, excludeSales: 0 },
      { code: '0809045', name: 'DBD', itemCode: 'IC0904500', itemName: 'DBD 일반', type: 'N', sales: 2111170, excludeSales: 0 },
      { code: '0803303', name: '이투컬렉션', itemCode: 'IC0330300', itemName: '이투컬렉션 일반', type: 'N', sales: 2089690, excludeSales: 0 },
      { code: '0803342', name: '코즈모갤러리', itemCode: 'IC0334200', itemName: '코즈모갤러리 일반', type: 'N', sales: 2087920, excludeSales: 0 },
      { code: '0818498', name: '수키도키(주)', itemCode: 'IC0849800', itemName: '수키도키(주) 일반', type: 'N', sales: 1993130, excludeSales: 0 },
      { code: '0812581', name: '제이케이엠디자인', itemCode: 'IC0258100', itemName: '제이케이엠디자인 일반', type: 'N', sales: 1962010, excludeSales: 0 },
      { code: '0818173', name: '디에스컴퍼니', itemCode: 'IC0817300', itemName: '디에스컴퍼니 일반', type: 'N', sales: 1937690, excludeSales: 0 },
      { code: '0803791', name: '그린디자인웍스공장', itemCode: 'IC0379100', itemName: '그린디자인웍스공장 일반', type: 'N', sales: 1928900, excludeSales: 0 },
      { code: '0817530', name: '후추더페퍼', itemCode: 'IC0753000', itemName: '후추더페퍼 일반', type: 'N', sales: 1845090, excludeSales: 0 },
      { code: '0807497', name: '학산문화사', itemCode: 'IC0749700', itemName: '학산문화사 일반', type: 'N', sales: 1625480, excludeSales: 0 },
      { code: '0818305', name: '티지오엠', itemCode: 'IC0830500', itemName: '티지오엠 일반', type: 'N', sales: 1617520, excludeSales: 0 },
      { code: '0803741', name: 'BST', itemCode: 'IC0374100', itemName: 'BST 일반', type: 'N', sales: 1410770, excludeSales: 0 },
      { code: '0817225', name: '도혜드로잉', itemCode: 'IC0722500', itemName: '도혜드로잉 일반', type: 'N', sales: 1332460, excludeSales: 0 },
      { code: '0803267', name: '플레플레', itemCode: 'IC0326700', itemName: '플레플레 일반', type: 'N', sales: 1280510, excludeSales: 0 },
      { code: '0818037', name: '신한커머스/로디아', itemCode: 'IC0803700', itemName: '신한커머스/로디아 일반', type: 'N', sales: 1246150, excludeSales: 0 },
      { code: '0810456', name: '디앤에프조이필', itemCode: 'IC0045600', itemName: '디앤에프조이필 일반', type: 'N', sales: 1235100, excludeSales: 0 },
      { code: '0803321', name: '아프로캣', itemCode: 'IC0332100', itemName: '아프로캣 일반', type: 'N', sales: 1221430, excludeSales: 0 },
      { code: '0817528', name: '누크코퍼레이션', itemCode: 'IC0752800', itemName: '누크코퍼레이션 일반', type: 'N', sales: 1157100, excludeSales: 0 },
      { code: '0803310', name: '유아쏘', itemCode: 'IC0331000', itemName: '유아쏘 일반', type: 'N', sales: 585860, excludeSales: 0 },
      { code: '0803229', name: '웨이크업(wakup)', itemCode: 'IC0322900', itemName: '웨이크업(wakup) 일반', type: 'N', sales: 482500, excludeSales: 0 },
      { code: '0811642', name: '아이씨엘', itemCode: 'IC0164200', itemName: '아이씨엘 일반', type: 'N', sales: 244480, excludeSales: 0 },
      { code: '0806456', name: '인시즌(연도)', itemCode: 'IC0645600', itemName: '인시즌(연도) 일반', type: 'N', sales: 210120, excludeSales: 0 },
      { code: '0813069', name: '바이나쿠', itemCode: 'IC0306900', itemName: '바이나쿠 일반', type: 'N', sales: 158650, excludeSales: 0 },
      { code: '0813689', name: '페이블렛', itemCode: 'IC0368900', itemName: '페이블렛 일반', type: 'N', sales: 151020, excludeSales: 0 },
      { code: '0815173', name: '수앙스', itemCode: 'IC0517300', itemName: '수앙스 일반', type: 'N', sales: 66000, excludeSales: 0 },
      { code: '0803242', name: '미니버스', itemCode: 'IC0324200', itemName: '미니버스 일반', type: 'N', sales: 48600, excludeSales: 0 },
      { code: '0811029', name: '참돌', itemCode: 'IC0102900', itemName: '참돌 일반', type: 'N', sales: 37880, excludeSales: 0 },
      { code: '0809531', name: '인도사이다', itemCode: 'IC0953100', itemName: '인도사이다 일반', type: 'N', sales: 19600, excludeSales: 0 },
    ],
  },
  {
    id: 'AB20260201200003',
    yearMonth: '2026-02',
    storeCode: '012',
    storeName: '창원점',
    totalLaborCost: 3590689,
    status: '확정',
    finalConfirmed: 'N',
    ifasSent: 'N',
    ifasSentDate: '',
    regDate: '2026-03-05',
    regEmpNo: '2024001',
    regName: '조준수',
    finalConfirmDate: '',
    finalConfirmEmpNo: '',
    finalConfirmName: '',
    note: '확정 데모용 (창원점)',
    suppliers: [
      { code: '0803080', name: '위드에버상사', itemCode: 'IC0308000', itemName: '위드에버상사 일반', type: 'N', sales: 6808990, excludeSales: 0 },
      { code: '0803527', name: '프론티어통상', itemCode: 'IC0352700', itemName: '프론티어통상 일반', type: 'N', sales: 5409300, excludeSales: 0 },
      { code: '0803255', name: '모닝글로리', itemCode: 'IC0325500', itemName: '모닝글로리 일반', type: 'N', sales: 5400760, excludeSales: 0 },
      { code: '0800334', name: '아이비스코리아', itemCode: 'IC0033400', itemName: '아이비스코리아 일반', type: 'N', sales: 3628440, excludeSales: 0 },
      { code: '0803503', name: '로마네', itemCode: 'IC0350300', itemName: '로마네 일반', type: 'N', sales: 3572320, excludeSales: 0 },
      { code: '0803690', name: '인디고', itemCode: 'IC0369000', itemName: '인디고 일반', type: 'N', sales: 3546220, excludeSales: 0 },
      { code: '0816166', name: '해밀', itemCode: 'IC0616600', itemName: '해밀 일반', type: 'N', sales: 3190370, excludeSales: 0 },
      { code: '0807481', name: '골드디자인', itemCode: 'IC0748100', itemName: '골드디자인 일반', type: 'N', sales: 2426470, excludeSales: 0 },
      { code: '0803176', name: '라이브워크', itemCode: 'IC0317600', itemName: '라이브워크 일반', type: 'N', sales: 2223710, excludeSales: 0 },
      { code: '0803187', name: '칠삼이일디자인', itemCode: 'IC0318700', itemName: '칠삼이일디자인 일반', type: 'N', sales: 1853030, excludeSales: 0 },
      { code: '0806798', name: '이가라인유통', itemCode: 'IC0679800', itemName: '이가라인유통 일반', type: 'N', sales: 1716810, excludeSales: 0 },
      { code: '0817604', name: '비온뒤', itemCode: 'IC0760400', itemName: '비온뒤 일반', type: 'N', sales: 1687460, excludeSales: 0 },
      { code: '0803186', name: '아이코닉디자인', itemCode: 'IC0318600', itemName: '아이코닉디자인 일반', type: 'N', sales: 1625320, excludeSales: 0 },
      { code: '0803158', name: '바이풀디자인', itemCode: 'IC0315800', itemName: '바이풀디자인 일반', type: 'N', sales: 1474950, excludeSales: 0 },
      { code: '0803303', name: '이투컬렉션', itemCode: 'IC0330300', itemName: '이투컬렉션 일반', type: 'N', sales: 1443750, excludeSales: 0 },
      { code: '0817560', name: '도나앤데코', itemCode: 'IC0756000', itemName: '도나앤데코 일반', type: 'N', sales: 1429400, excludeSales: 0 },
      { code: '0818036', name: '페펜스튜디오', itemCode: 'IC0803600', itemName: '페펜스튜디오 일반', type: 'N', sales: 1255840, excludeSales: 0 },
      { code: '0803222', name: '아르디움', itemCode: 'IC0322200', itemName: '아르디움 일반', type: 'N', sales: 1017070, excludeSales: 0 },
      { code: '0806606', name: '디자인랩(레더랩)', itemCode: 'IC0660600', itemName: '디자인랩(레더랩) 일반', type: 'N', sales: 877500, excludeSales: 0 },
      { code: '0803825', name: '정인통상', itemCode: 'IC0382500', itemName: '정인통상 일반', type: 'N', sales: 775060, excludeSales: 0 },
      { code: '0807497', name: '학산문화사', itemCode: 'IC0749700', itemName: '학산문화사 일반', type: 'N', sales: 531060, excludeSales: 0 },
      { code: '0803289', name: '더솜씨', itemCode: 'IC0328900', itemName: '더솜씨 일반', type: 'N', sales: 489260, excludeSales: 0 },
      { code: '0803791', name: '그린디자인웍스공장', itemCode: 'IC0379100', itemName: '그린디자인웍스공장 일반', type: 'N', sales: 372180, excludeSales: 0 },
      { code: '0803229', name: '웨이크업(wakup)', itemCode: 'IC0322900', itemName: '웨이크업(wakup) 일반', type: 'N', sales: 227600, excludeSales: 0 },
      { code: '0803288', name: '명성코리아', itemCode: 'IC0328800', itemName: '명성코리아 일반', type: 'N', sales: 166950, excludeSales: 0 },
      { code: '0803144', name: '씨케이세일즈', itemCode: 'IC0314400', itemName: '씨케이세일즈 일반', type: 'R', sales: 3692540, excludeSales: 0, fixedRate: 0.08 },
      { code: '0811795', name: '베르제마넷', itemCode: 'IC0179500', itemName: '베르제마넷 일반', type: 'R', sales: 3933560, excludeSales: 0, fixedRate: 0.05 },
    ],
  },
];

export const STORE_LIST = [
  { code: '001', name: '광화문점' },
  { code: '002', name: '강남점' },
  { code: '003', name: '잠실점' },
  { code: '004', name: '영등포점' },
  { code: '005', name: '합정점' },
  { code: '006', name: '목동점' },
  { code: '007', name: '분당점' },
  { code: '008', name: '판교점' },
  { code: '009', name: '부산점' },
  { code: '010', name: '대구점' },
  { code: '011', name: '울산점' },
  { code: '012', name: '창원점' },
  { code: '013', name: '광주점' },
  { code: '014', name: '대전점' },
  { code: '015', name: '천안점' },
];

// ============================================================================
// 🔒 백엔드 시뮬레이션 영역 (프론트엔드 UI에 직접 노출되지 않음)
// ----------------------------------------------------------------------------
// 실제 운영에서는 DW에서 점포별 매입처 매출을 조회하는 서버 API에 해당.
// 화면에서는 아래 getter 함수들만 호출 (getStoreSupplierCodes / getStoreSupplierSales 등)
// ============================================================================

/**
 * 매입처 마스터 정보 (백엔드 DB의 매입처 테이블 역할)
 * - 공용알바 공제 대상 매입처 (문구/음반/특정매입/해외문구 포함)
 * - items[]: 매입처별 매핑된 매입처품목 리스트 (첫 번째가 기본값 '일반')
 */
interface SupplierItem {
  itemCode: string;
  itemName: string;
}
interface SupplierMaster {
  code: string;
  name: string;
  division: '문구' | '음반' | '특정매입' | '해외문구';
  items: SupplierItem[];
}

// 매입처품목 카테고리 풀 — '일반'은 항상 첫 번째 (기본값)
const ITEM_CATEGORIES = ['일반', '대표상품', '기획전', 'PB', '정품', '특가', '증정', '리미티드', '베이직', '문구행사'];
const MUSIC_CATEGORIES = ['일반', '음반', 'KPOP', '해외음반'];
const SPECIFIC_CATEGORIES = ['일반', '특정매입', '시즌특가'];

function makeItems(code: string, name: string, division: SupplierMaster['division']): SupplierItem[] {
  // 결정적 해시
  let h = 0;
  for (let i = 0; i < code.length; i++) h = ((h << 5) - h + code.charCodeAt(i)) | 0;
  const baseDigits = code.replace(/\D/g, '').slice(-4).padStart(4, '0');
  const prefix = division === '음반' ? 'IB0' : 'IC0';

  // '일반'은 항상 포함 (스토리보드: 기본값 일반)
  const items: SupplierItem[] = [{
    itemCode: prefix + baseDigits + '00',
    itemName: `${name} 일반`,
  }];

  // 카테고리 풀 선택
  const pool = (division === '음반' ? MUSIC_CATEGORIES : division === '특정매입' ? SPECIFIC_CATEGORIES : ITEM_CATEGORIES).slice(1);
  // 추가 항목 0~4개 — 일부 매입처는 일반만 보유 (extraCount === 0)
  const extraCount = Math.abs(h) % 5;
  const used = new Set<string>();
  for (let i = 0; i < extraCount; i++) {
    const cat = pool[Math.abs(h + i * 31) % pool.length];
    if (used.has(cat)) continue;
    used.add(cat);
    items.push({
      itemCode: prefix + baseDigits + String(i + 1).padStart(2, '0'),
      itemName: `${name} ${cat}`,
    });
  }
  return items;
}

const SUPPLIER_MASTER: SupplierMaster[] = ([
  // 문구 (categoryCode='8')
  ['0803741', 'BST'], ['0803791', '공장'], ['0816555', '냐냐온 스튜디오'], ['0817528', '누크코퍼레이션'],
  ['0807485', '대시앤도트'], ['0817625', '대인커머스'], ['0816903', '더시호'], ['0818620', '더토브'],
  ['0817225', '도혜드로잉'], ['0810456', '디앤에프조이필'], ['0803503', '로마네'], ['0816525', '루카랩컴퍼니'],
  ['0812988', '모트모트'], ['0811795', '베르제마넷'], ['0817604', '비온뒤'], ['0803289', '솜씨스템프'],
  ['0803222', '아르디움'], ['0803186', '아이코닉'], ['0803159', '안테나샵'], ['0803303', '이투컬렉션'],
  ['0803690', '인디고'], ['0803825', '정인통상'], ['0803187', '칠삼이일디자인'], ['0811513', '캘리엠'],
  ['0810588', '케이디코퍼레이션'], ['0818036', '페펜스튜디오'], ['0803267', '플레플레'], ['0807497', '학산문화사'],
  ['0817135', '해피썬'], ['0803144', '씨케이세일즈'], ['0803527', '프론티어통상'], ['0803255', '모닝글로리'],
  ['0803158', '바이풀디자인'], ['0816796', '마이누'], ['0816312', '엠젯패밀리'], ['0806798', '이가라인유통'],
  ['0816166', '해밀'], ['0807481', '골드디자인'], ['0800334', '아이비스코리아'], ['0803080', '위드에버상사'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '문구' as const, items: makeItems(code, name, '문구') }))
.concat(([
  // 음반/영상
  ['01B0470', '드림어스컴퍼니'], ['01B0478', '와이지플러스'], ['01B0504', '카카오엔터테인먼트'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '음반' as const, items: makeItems(code, name, '음반') })))
.concat(([
  // 특정매입
  ['0803124', '아톰상사(특정매입)'], ['0803833', '모나미(특정매입)'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '특정매입' as const, items: makeItems(code, name, '특정매입') })))
.concat(([
  // 해외문구
  ['0900216', 'LEUCHTTURM'], ['0900224', 'LIHIT LAB.,INC'], ['0900252', 'HIGHTIDE CO.,LTD'],
] as [string, string][]).map(([code, name]) => ({ code, name, division: '해외문구' as const, items: makeItems(code, name, '해외문구') })))
.concat(([
  // 창원점 전용 (또는 기타 — 일반 단일품목)
  ['0803176', '라이브워크'],
  ['0817560', '도나앤데코'],
  ['0806606', '디자인랩(레더랩)'],
  ['0803229', '웨이크업(wakup)'],
  ['0803288', '명성코리아'],
] as [string, string][]).map(([code, name]) => ({
  code, name, division: '문구' as const,
  items: [{
    itemCode: 'IC0' + code.replace(/\D/g, '').slice(-4).padStart(4, '0') + '00',
    itemName: name + ' 일반',
  }],
})));

/**
 * 점포별 매입처 코드 리스트 (핵심 5개 점포)
 * - 모든 점포가 공통 매입처 풀에서 동일한 코드를 갖되,
 *   백엔드 매출 시뮬레이션을 위해 점포별로 명시적으로 관리.
 * - 실제로는 DW에서 "해당 점포에서 매출이 발생한 매입처"를 조회.
 * - 프론트엔드 UI에는 직접 노출되지 않음 (모달 필터링 용도로만 사용).
 */
const STORE_SUPPLIER_CODES_MAP: Record<string, string[]> = {
  '001': SUPPLIER_MASTER.map(s => s.code), // 광화문점 - 전체
  '002': SUPPLIER_MASTER.map(s => s.code), // 강남점 - 전체
  '003': SUPPLIER_MASTER.map(s => s.code), // 잠실점 - 전체
  '009': SUPPLIER_MASTER.map(s => s.code), // 부산점 - 전체
  '012': SUPPLIER_MASTER.map(s => s.code), // 창원점 - 전체
};

/**
 * 공용알바 공제 대상 점포 목록
 */
export const DEDUCTION_TARGET_STORES = ['001', '002', '003', '009', '012'];

/**
 * 점포×매입처 매출 매트릭스 (백엔드 시뮬레이션)
 * - 실제로는 DW의 매출 팩트 테이블 조회 쿼리 결과에 해당
 * - 점포별로 매입처마다 서로 다른 매출/매출제외 값 보유
 */
interface StoreSupplierSales {
  sales: number;
  excludeSales: number;
}

// 결정적(deterministic) 해시 기반 매출 생성 — 같은 입력이면 항상 같은 값
function hashSales(storeCode: string, supplierCode: string, base: number, variance: number): number {
  let h = 0;
  const s = storeCode + ':' + supplierCode;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  const pct = (Math.abs(h) % 10000) / 10000; // 0 ~ 0.9999
  // 1만원 단위로 반올림
  const raw = base + (pct * variance * 2 - variance);
  return Math.max(0, Math.round(raw / 10000) * 10000);
}

/**
 * 사용자 지정 매출 — 해시 결과를 덮어쓰는 화이트리스트
 * (실데이터 기반 시연 케이스)
 */
const SALES_OVERRIDES: Record<string, Record<string, StoreSupplierSales>> = {
  '012': {
    '0803176': { sales: 2223710, excludeSales: 0 },
    '0817560': { sales: 1429400, excludeSales: 0 },
    '0806606': { sales: 877500,  excludeSales: 0 },
    '0803229': { sales: 227600,  excludeSales: 0 },
    '0803288': { sales: 166950,  excludeSales: 0 },
  },
};

const STORE_SUPPLIER_SALES_MAP: Record<string, Record<string, StoreSupplierSales>> = (() => {
  const map: Record<string, Record<string, StoreSupplierSales>> = {};
  DEDUCTION_TARGET_STORES.forEach(storeCode => {
    map[storeCode] = {};
    // 점포별 매출 규모 — 광화문(큰점) > 강남 > 부산 > 잠실 > 창원(작은점)
    const scale: Record<string, number> = {
      '001': 1.0,
      '002': 0.75,
      '009': 0.55,
      '003': 0.45,
      '012': 0.30,
    };
    const s = scale[storeCode] ?? 0.5;
    (STORE_SUPPLIER_CODES_MAP[storeCode] || []).forEach(code => {
      const base = 3_000_000 * s;
      const variance = 2_500_000 * s;
      const sales = hashSales(storeCode, code, base, variance);
      // 일부 매입처만 매출제외 (약 10%)
      const exHash = (code.charCodeAt(code.length - 1) + storeCode.charCodeAt(2)) % 10;
      const excludeSales = exHash === 0 ? Math.round(sales * 0.15 / 10000) * 10000 : 0;
      map[storeCode][code] = { sales, excludeSales };
    });
    // 화이트리스트 적용
    Object.entries(SALES_OVERRIDES[storeCode] || {}).forEach(([code, vals]) => {
      map[storeCode][code] = vals;
    });
  });
  return map;
})();

/**
 * [백엔드 API 시뮬레이션] 점포에 등록된 매입처 코드 리스트 조회
 * - 실제: GET /api/deduction/stores/{storeCode}/suppliers
 */
export function getStoreSupplierCodes(storeCode: string): string[] {
  return STORE_SUPPLIER_CODES_MAP[storeCode] || [];
}

/**
 * [백엔드 API 시뮬레이션] 특정 점포 + 매입처의 매출/매출제외 조회
 * - 실제: GET /api/deduction/stores/{storeCode}/suppliers/{supplierCode}/sales?yearMonth=YYYY-MM
 * - 등록되지 않은 매입처인 경우 null 반환
 */
export function getStoreSupplierSales(
  storeCode: string,
  supplierCode: string
): { sales: number; excludeSales: number } | null {
  return STORE_SUPPLIER_SALES_MAP[storeCode]?.[supplierCode] || null;
}

/**
 * [백엔드 API 시뮬레이션] 점포의 전체 매입처 매출 일괄 조회
 * - 실제: [매출조회] 버튼 클릭 시 호출되는 API
 * - 기존 등록된 매입처들의 매출을 DW에서 일괄 조회하여 반영
 */
export function getAllStoreSupplierSales(
  storeCode: string
): Record<string, { sales: number; excludeSales: number }> {
  return STORE_SUPPLIER_SALES_MAP[storeCode] || {};
}

/**
 * [백엔드 API 시뮬레이션] 매입처코드로 매입처 마스터 정보 조회
 * - 실제: GET /api/suppliers/{supplierCode}
 * - itemCode/itemName 은 기본 매입처품목('일반') 기준으로 반환
 */
export function getSupplierMaster(
  supplierCode: string
): { code: string; name: string; itemCode: string; itemName: string } | null {
  const m = SUPPLIER_MASTER.find(s => s.code === supplierCode);
  if (!m) return null;
  const def = m.items[0];
  return { code: m.code, name: m.name, itemCode: def.itemCode, itemName: def.itemName };
}

/**
 * [백엔드 API 시뮬레이션] 매입처에 매핑된 매입처품목 리스트 조회
 * - 실제: GET /api/suppliers/{supplierCode}/items
 * - 그리드 dropdown 옵션으로 사용
 */
export function getSupplierItems(
  supplierCode: string
): { itemCode: string; itemName: string }[] {
  return SUPPLIER_MASTER.find(s => s.code === supplierCode)?.items || [];
}